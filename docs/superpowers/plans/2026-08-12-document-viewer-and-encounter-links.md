# Document Viewer + Encounter/DocumentReference Field Gaps — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user view/download the actual note content behind a `DocumentReference`
or `Binary` resource; cross-link `Encounter` and `DocumentReference`; render the
remaining missing/partial fields on both resource types identified in the design spec
(`docs/superpowers/specs/2026-08-12-document-viewer-and-encounter-links-design.md`).

**Architecture:** A content-resolution utility (`resolveAttachmentContent`) sits under a
new `AttachmentPreview` component that renders any FHIR `Attachment`-shaped value by
content type; a `DocumentViewer`/`DocumentViewerPage` pair (modeled on
`CompositionSummary`/`CompositionSummaryPage`) composes it into a dedicated full-page
viewer reachable from a new `ResourceCard` link. Separately, several new
hand-maintained `Partials` components (following the existing `Attachment.tsx`/
`ReverseReference.tsx` precedent) close the missing-field gaps on the auto-generated
`DocumentReference.tsx`, `Binary.tsx`, and `Encounter.tsx` pages, wired in via
`src/generator/partials_mapping_for_fields.py` / `src/generator/reverse_references.py`
/ a couple of narrow jinja template special cases, then regenerated with
`make generate_components`.

**Tech Stack:** React 19, TypeScript, MUI v9, react-router v8, Vite, `dompurify`,
`file-saver`, a new `rtf.js` dependency for RTF preview, Python/Jinja2 codegen (run via
`make generate_components`, which shells out to Docker per `Makefile`).

## Global Constraints

- **No automated test framework exists in this repo** (no jest/vitest/playwright, no
  `*.test.*` files). Every task replaces the "write a failing test" cycle with: make the
  change, run `yarn lint && yarn tsc --noEmit` (0 errors, no new warnings beyond the
  pre-existing baseline — a handful of pre-existing `security/detect-object-injection`
  and `security/detect-unsafe-regex` warnings in unrelated files are expected and not
  yours to fix), then manually verify via `yarn dev`.
- **Never hand-edit `src/pages/resources/*.tsx`, `src/components/ResourceItem.tsx`, or
  any `src/types/**/*.ts` file.** They are regenerated from scratch (`shutil.rmtree` +
  rewrite) by `make generate_components` / `make generate_types` every run — any hand
  edit is silently destroyed the next time someone regenerates. The source of truth for
  every field-rendering change in this plan is `src/generator/partials_mapping_for_fields.py`,
  `src/generator/reverse_references.py`, `src/generator/partialsResources.py`, or
  `src/generator/template.javascript.component.jinja2` — then run
  `make generate_components` to materialize the change.
- **`make generate_components` requires Docker** (see `Makefile:63-67`): it runs
  `python:3.8-slim-buster`, `pip install lxml jinja2`, then
  `python3 src/generator/generate_components.py`. `src/generator/fhir_xml_schema_parser.py`
  is already checked into the repo (no network fetch of FHIR XSDs needed). If Docker
  isn't available in your environment, this plan cannot regenerate the resource pages —
  flag that blocker rather than hand-editing the generated files as a workaround.
- **`downloadFile`'s new `headers` option must never allow overriding `Authorization`.**
  `BaseApi.buildHeaders()` already strips any caller-supplied `Authorization` header
  before merging (`src/api/baseApi.ts:98-101`) — Task 1 must route the new option
  through the existing `streamRequest`/`buildHeaders` path, not bypass it, so that
  guarantee holds for attachment fetches too.
- **Content fetched via the native-`Accept`-header path must stay same-origin.**
  `streamRequest()` already refuses to fetch off the configured FHIR origin
  (`src/api/baseApi.ts:157-165`) — the new attachment-resolution code must build its
  Binary URL as a relative path (`/4_0_0/Binary/{id}`) exactly like every other FHIR
  fetch in this codebase, never an absolute URL, so that guard keeps applying.
- **Object URLs must be revoked.** Any `URL.createObjectURL(blob)` created for inline
  PDF/image preview must be revoked in a cleanup effect when the component unmounts or
  the attachment changes, or repeated views leak memory.
- **This is new work on a fresh branch (`feature/document-viewer-and-encounter-links`),
  not a rewrite of an open PR.** Commit after each task.

---

### Task 1: Extend `BaseApi.downloadFile` with a `headers` override; add the attachment content resolver

**Files:**
- Modify: `src/api/baseApi.ts`
- Create: `src/utils/attachment.utils.ts`

**Interfaces:**
- Produces: `resolveAttachmentContent(attachment: TAttachment, baseApi: BaseApi): Promise<ResolveAttachmentResult>` and `extensionForContentType(contentType: string): string` from `src/utils/attachment.utils.ts`. Task 2's `AttachmentPreview` is the only consumer.

- [ ] **Step 1: Add an optional `headers` override to `BaseApi.downloadFile`**

In `src/api/baseApi.ts`, change the `downloadFile` method to accept and forward a
`headers` option (backward compatible — existing callers like `FileDownload.tsx` don't
pass it and are unaffected):

```typescript
    async downloadFile(
        url: string,
        options?: {
            onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void;
            headers?: Record<string, string>;
        }
    ): Promise<{ status: number; data: Blob; headers: Record<string, string> }> {
        const { status, chunks, headers, errorMessage, incomplete } = await this.streamRequest({
            method: 'GET',
            urlString: url,
            responseMode: 'binary',
            onProgress: options?.onProgress,
            headers: options?.headers,
        });
        if (!status || status < 200 || status >= 300) {
            throw Object.assign(new Error(errorMessage || `Request failed with status ${status}`), { status });
        }
        if (incomplete) {
            throw Object.assign(new Error('Connection interrupted before the download finished'), {
                status,
                incomplete: true,
            });
        }
        const contentType = headers['content-type'] || 'application/octet-stream';
        return {
            status,
            data: new Blob(chunks as Uint8Array<ArrayBuffer>[], { type: contentType }),
            headers,
        };
    }
```

(Only the signature and the `headers: options?.headers` line passed into `streamRequest`
are new — the rest of the method body is unchanged from today.)

- [ ] **Step 2: Create `src/utils/attachment.utils.ts`**

```typescript
import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';

export interface ResolvedAttachmentContent {
    blob: Blob;
    contentType: string;
}

export type ResolveAttachmentResult =
    | { kind: 'resolved'; content: ResolvedAttachmentContent }
    | { kind: 'external'; externalUrl: string }
    | { kind: 'unavailable' };

const BINARY_REFERENCE_PATTERN = /^Binary\/([^/?]+)/;

// FHIR content negotiation: requesting the attachment's own contentType (rather than
// application/fhir+json) makes the server return raw bytes directly, so a Binary's
// content can flow through the same Blob pipeline as inline base64 data below, with no
// intermediate base64 decode step.
export async function resolveAttachmentContent(
    attachment: TAttachment,
    baseApi: BaseApi
): Promise<ResolveAttachmentResult> {
    const contentType = String(attachment.contentType || 'application/octet-stream');

    if (attachment.data) {
        try {
            const bytes = Uint8Array.from(
                atob(String(attachment.data).replace(/\s/g, '')),
                (c) => c.charCodeAt(0)
            );
            return { kind: 'resolved', content: { blob: new Blob([bytes], { type: contentType }), contentType } };
        } catch {
            return { kind: 'unavailable' };
        }
    }

    const url = attachment.url ? String(attachment.url) : undefined;
    const binaryMatch = url?.match(BINARY_REFERENCE_PATTERN);
    if (binaryMatch) {
        const binaryId = binaryMatch[1];
        const response = await baseApi.downloadFile(`/4_0_0/Binary/${binaryId}`, {
            headers: { Accept: contentType },
        });
        return { kind: 'resolved', content: { blob: response.data, contentType } };
    }

    if (url) {
        return { kind: 'external', externalUrl: url };
    }

    return { kind: 'unavailable' };
}

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
    'text/html': 'html',
    'text/plain': 'txt',
    'text/xml': 'xml',
    'application/xml': 'xml',
    'application/pdf': 'pdf',
    'text/rtf': 'rtf',
    'application/rtf': 'rtf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'application/json': 'json',
};

export function extensionForContentType(contentType: string | undefined): string {
    const ct = String(contentType || '').toLowerCase().split(';')[0].trim();
    // eslint-disable-next-line security/detect-object-injection
    return CONTENT_TYPE_EXTENSIONS[ct] || 'bin';
}
```

- [ ] **Step 3: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 4: Commit**

```bash
git add src/api/baseApi.ts src/utils/attachment.utils.ts
git commit -m "Add attachment content resolver and downloadFile headers override"
```

---

### Task 2: `AttachmentPreview` component (content-type-aware render + download)

**Files:**
- Modify: `package.json` (add `rtf.js` dependency)
- Create: `src/types/rtf.d.ts` (no bundled TypeScript types for `rtf.js`)
- Create: `src/components/AttachmentPreview.tsx`

**Interfaces:**
- Consumes: `resolveAttachmentContent`, `extensionForContentType` (Task 1); `TAttachment`
  from `src/types/partials/Attachment.ts`; `BaseApi`.
- Produces: `AttachmentPreview` (default export), props `{ attachment: TAttachment }`,
  from `src/components/AttachmentPreview.tsx`. Task 3's `DocumentViewer` and Task 4/5's
  inline partials all render it per attachment.

- [ ] **Step 1: Add the `rtf.js` dependency**

In `package.json`'s `dependencies`, add (alphabetical, matching the existing list):

```json
    "rtf.js": "^3.0.9",
```

Run `yarn install` (or whatever this repo's lockfile-update command is — check
`README.md`'s package-management section; `make update` regenerates `yarn.lock` per the
constraint in that section) so `yarn.lock` picks up the new dependency.

- [ ] **Step 2: Declare minimal types for `rtf.js`**

`rtf.js` ships no TypeScript types. Create `src/types/rtf.d.ts`:

```typescript
declare module 'rtf.js' {
    export namespace RTFJS {
        function loggingEnabled(enabled: boolean): void;
        class Document {
            constructor(buffer: ArrayBuffer);
            metadata(): Record<string, unknown>;
            render(): Promise<HTMLElement[]>;
        }
    }
}
```

- [ ] **Step 3: Create `AttachmentPreview.tsx`**

```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Link, Paper, Tooltip, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DOMPurify from 'dompurify';
import { saveAs } from 'file-saver';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';
import { extensionForContentType, resolveAttachmentContent } from '../utils/attachment.utils';

interface AttachmentPreviewProps {
    attachment: TAttachment;
}

const isTextLike = (contentType: string) =>
    contentType === 'text/plain' || contentType === 'application/xml' || contentType === 'text/xml';

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment }) => {
    const { fhirUrl } = React.useContext(EnvironmentContext);
    const { setUserDetails } = React.useContext(UserContext);
    const baseApi = useMemo(() => new BaseApi({ fhirUrl, setUserDetails }), [fhirUrl, setUserDetails]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [blob, setBlob] = useState<Blob | null>(null);
    const [externalUrl, setExternalUrl] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string>('');
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [rtfError, setRtfError] = useState<string | null>(null);
    const rtfContainerRef = useRef<HTMLDivElement>(null);

    const contentType = String(attachment.contentType || 'application/octet-stream')
        .toLowerCase()
        .split(';')[0]
        .trim();

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setErrorMessage(null);
        setBlob(null);
        setExternalUrl(null);

        resolveAttachmentContent(attachment, baseApi)
            .then((result) => {
                if (cancelled) {
                    return;
                }
                if (result.kind === 'resolved') {
                    setBlob(result.content.blob);
                } else if (result.kind === 'external') {
                    setExternalUrl(result.externalUrl);
                } else {
                    setErrorMessage('This attachment has no retrievable content.');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setErrorMessage('Failed to load the attachment content.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attachment.data, attachment.url, attachment.contentType]);

    // Object URL for image/PDF preview — must be revoked on cleanup or attachment change
    // to avoid leaking memory across repeated views.
    useEffect(() => {
        if (!blob || !(contentType === 'application/pdf' || contentType.startsWith('image/'))) {
            setObjectUrl(null);
            return;
        }
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [blob, contentType]);

    // Decoded text for html/plain/xml preview.
    useEffect(() => {
        if (!blob || !(contentType === 'text/html' || isTextLike(contentType))) {
            setTextContent('');
            return;
        }
        let cancelled = false;
        blob.text().then((text) => {
            if (!cancelled) {
                setTextContent(text);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [blob, contentType]);

    // RTF preview via rtf.js — renders directly into the DOM (not React elements), so it
    // owns its own ref rather than going through JSX.
    useEffect(() => {
        setRtfError(null);
        if (!blob || (contentType !== 'text/rtf' && contentType !== 'application/rtf')) {
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const buffer = await blob.arrayBuffer();
                const { RTFJS } = await import('rtf.js');
                RTFJS.loggingEnabled(false);
                const doc = new RTFJS.Document(buffer);
                const elements = await doc.render();
                if (!cancelled && rtfContainerRef.current) {
                    rtfContainerRef.current.replaceChildren(...elements);
                }
            } catch {
                if (!cancelled) {
                    setRtfError('Failed to render this RTF document — use Download instead.');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [blob, contentType]);

    const handleDownload = () => {
        if (!blob) {
            return;
        }
        const filename = attachment.title
            ? String(attachment.title)
            : `document.${extensionForContentType(contentType)}`;
        saveAs(blob, filename);
    };

    const renderPreview = () => {
        if (!blob) {
            return null;
        }
        if (contentType === 'text/html') {
            return <Box sx={{ '& a': { color: 'primary.main' } }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(textContent) }} />;
        }
        if (isTextLike(contentType)) {
            return (
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '80vh' }}>
                    {textContent}
                </Box>
            );
        }
        if (contentType === 'application/pdf' && objectUrl) {
            return <Box component="iframe" src={objectUrl} sx={{ width: '100%', height: '80vh', border: 'none' }} />;
        }
        if (contentType.startsWith('image/') && objectUrl) {
            return <Box component="img" src={objectUrl} sx={{ maxWidth: '100%' }} />;
        }
        if (contentType === 'text/rtf' || contentType === 'application/rtf') {
            return rtfError ? <Alert severity="warning">{rtfError}</Alert> : <div ref={rtfContainerRef} />;
        }
        return <Alert severity="info">Preview not available for {contentType} — use Download to save the file.</Alert>;
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Typography variant="subtitle1">{attachment.title ? String(attachment.title) : 'Untitled document'}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {contentType}
                    {attachment.size ? ` · ${attachment.size} bytes` : ''}
                    {attachment.creation ? ` · ${attachment.creation}` : ''}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {blob && (
                    <Tooltip title="Download">
                        <Link component="button" onClick={handleDownload} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DownloadIcon fontSize="small" /> Download
                        </Link>
                    </Tooltip>
                )}
                {externalUrl && (
                    <Link href={externalUrl} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Open externally <OpenInNewIcon fontSize="small" />
                    </Link>
                )}
            </Box>
            {isLoading && <Typography color="text.secondary">Loading…</Typography>}
            {!isLoading && errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {!isLoading && !errorMessage && renderPreview()}
        </Paper>
    );
};

export default AttachmentPreview;
```

- [ ] **Step 4: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock src/types/rtf.d.ts src/components/AttachmentPreview.tsx
git commit -m "Add AttachmentPreview: content-type-aware attachment render/download"
```

---

### Task 3: `DocumentViewer` + `DocumentViewerPage` + route

**Files:**
- Create: `src/components/DocumentViewer.tsx`
- Create: `src/pages/DocumentViewerPage.tsx`
- Modify: `src/routes/fhirRoutes.tsx`

**Interfaces:**
- Consumes: `AttachmentPreview` (Task 2); `BaseApi`; `TDocumentReference` from
  `src/types/resources/DocumentReference.ts`; `TBinary` from
  `src/types/resources/Binary.ts`.
- Produces: `DocumentViewer` (default export), props `{ relativeUrl: string }`, from
  `src/components/DocumentViewer.tsx`. `DocumentViewerPage` is its only consumer today;
  Task 6's `ResourceCard` link and Task 4/5's inline "View" links both navigate to the
  page, not the component directly.

- [ ] **Step 1: Create `DocumentViewer.tsx`**

```tsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import AttachmentPreview from './AttachmentPreview';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';

interface DocumentViewerProps {
    relativeUrl: string;
}

interface FhirResource {
    resourceType?: string;
    id?: string;
    contentType?: string;
    data?: string;
    content?: Array<{ attachment: TAttachment }>;
    [key: string]: unknown;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ relativeUrl }) => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const baseApi = useMemo(() => new BaseApi({ fhirUrl, setUserDetails }), [fhirUrl, setUserDetails]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [resource, setResource] = useState<FhirResource | null>(null);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setErrorMessage(null);
        baseApi
            .getData({ urlString: relativeUrl })
            .then(({ json }) => {
                if (cancelled) {
                    return;
                }
                if (json?.resourceType === 'DocumentReference' || json?.resourceType === 'Binary') {
                    setResource(json);
                } else {
                    setErrorMessage('The requested resource is not a DocumentReference or Binary.');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setErrorMessage('Failed to load the resource.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [relativeUrl, baseApi]);

    if (isLoading) {
        return <Typography color="text.secondary">Loading…</Typography>;
    }
    if (errorMessage || !resource) {
        return <Alert severity="error">{errorMessage || 'Resource not found.'}</Alert>;
    }

    if (resource.resourceType === 'Binary') {
        const attachment: TAttachment = {
            contentType: resource.contentType,
            data: resource.data,
            url: resource.data ? undefined : `Binary/${resource.id}`,
            title: `Binary/${resource.id}`,
        };
        return (
            <Box>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    {`Binary/${resource.id}`}
                </Typography>
                <AttachmentPreview attachment={attachment} />
            </Box>
        );
    }

    const content = resource.content || [];
    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
                {`DocumentReference/${resource.id}`}
            </Typography>
            {content.length === 0 && <Alert severity="warning">This DocumentReference has no content entries.</Alert>}
            {content.map((entry, index) => (
                <AttachmentPreview key={index} attachment={entry.attachment} />
            ))}
        </Box>
    );
};

export default DocumentViewer;
```

- [ ] **Step 2: Create `DocumentViewerPage.tsx`**

```tsx
import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import { Box } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DocumentViewer from '../components/DocumentViewer';

const DocumentViewerPage: React.FC = () => {
    const { resourceType, id, operation } = useParams<{
        resourceType: string;
        id?: string;
        operation?: string;
    }>();

    const relativeUrl = useMemo(() => {
        if (!resourceType) {
            return '';
        }
        let url = `/4_0_0/${resourceType}`;
        if (id) {
            url += `/${id}`;
        }
        if (operation) {
            url += `/${operation}`;
        }
        return url;
    }, [resourceType, id, operation]);

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <Box sx={{ flex: 1, width: '100%', padding: '20px', boxSizing: 'border-box' }}>
                {relativeUrl && <DocumentViewer relativeUrl={relativeUrl} />}
            </Box>
            <Footer />
        </Box>
    );
};

export default DocumentViewerPage;
```

- [ ] **Step 3: Add the route**

In `src/routes/fhirRoutes.tsx`, add the lazy import next to the other viewer pages:

```tsx
const DocumentViewerPage = lazy(() => import('../pages/DocumentViewerPage'));
```

and add two routes next to the existing `/composition-summary` pair:

```tsx
    <Route
        key="documentViewerIdOperation"
        path="/document-viewer/4_0_0/:resourceType/:id?/:operation?/*"
        element={<DocumentViewerPage />}
    />,
    <Route
        key="documentViewerOperation"
        path="/document-viewer/4_0_0/:resourceType/:operation?/*"
        element={<DocumentViewerPage />}
    />,
```

- [ ] **Step 4: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 5: Manually verify**

Run `yarn dev`, then in a browser visit `/document-viewer/4_0_0/DocumentReference/<a
real id with content>` directly. Confirm it loads, renders each content entry via
`AttachmentPreview`, and Download works. Visit `/document-viewer/4_0_0/Binary/<a real
id>` directly and confirm the same for a bare Binary. Visit a bogus id and confirm the
error state.

- [ ] **Step 6: Commit**

```bash
git add src/components/DocumentViewer.tsx src/pages/DocumentViewerPage.tsx src/routes/fhirRoutes.tsx
git commit -m "Add DocumentViewer page and /document-viewer route"
```

---

### Task 4: DocumentReference field gaps — `content`, `context`, `description`, `relatesTo.code`

**Files:**
- Create: `src/partials/DocumentContent.tsx`
- Create: `src/partials/DocumentReferenceContext.tsx`
- Create: `src/partials/DocumentReferenceRelatesTo.tsx`
- Modify: `src/partials/index.tsx`
- Modify: `src/generator/partials_mapping_for_fields.py`
- Modify: `src/generator/template.javascript.component.jinja2`
- Regenerate: `src/pages/resources/DocumentReference.tsx` (via `make generate_components`)

**Interfaces:**
- Consumes: `Partials.Reference`, `Partials.CodeableConcept`, `Partials.Period`
  (existing); `TDocumentReferenceContent`, `TDocumentReferenceContext`,
  `TDocumentReferenceRelatesTo` (existing generated types).
- Produces: `DocumentContent`, `DocumentReferenceContext`, `DocumentReferenceRelatesTo`
  default exports, registered on the shared `Partials` object
  (`src/partials/index.tsx`) so the jinja template can reference
  `Partials.DocumentContent` / `Partials.DocumentReferenceContext` /
  `Partials.DocumentReferenceRelatesTo` by name, exactly like every other partial.

- [ ] **Step 1: Create `DocumentContent.tsx` (the inline attachment list — Document Viewer's second entry point)**

```tsx
import React from 'react';
import { Box, Link, Paper, Tooltip, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDocumentReferenceContent } from '../types/partials/DocumentReferenceContent';

type TDocumentContentProps = TBaseResourceProps & {
    content: TDocumentReferenceContent | TDocumentReferenceContent[] | undefined;
};

const DocumentContent = ({ content, name, id }: TDocumentContentProps) => {
    const entries = content ? (Array.isArray(content) ? content : [content]) : [];
    if (entries.length === 0) {
        return null;
    }

    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {entries.map((entry, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ flexGrow: 1 }}>
                        {entry.attachment?.title ? String(entry.attachment.title) : `Content ${index + 1}`}
                        {entry.attachment?.contentType ? ` (${entry.attachment.contentType})` : ''}
                    </Typography>
                    <Tooltip title="View in Document Viewer">
                        <Link
                            component={RouterLink}
                            to={`/document-viewer/4_0_0/DocumentReference/${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            <DescriptionIcon fontSize="small" /> View <OpenInNewIcon fontSize="small" />
                        </Link>
                    </Tooltip>
                </Paper>
            ))}
        </Box>
    );
};

export default DocumentContent;
```

(This inline list links to the full `DocumentViewerPage` for both preview and download,
rather than duplicating `AttachmentPreview` inline — the resource detail page already
renders a large per-field dump, and centralizing the actual content rendering in one
place keeps this partial small.)

- [ ] **Step 2: Create `DocumentReferenceContext.tsx`**

```tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import Reference from './Reference';
import CodeableConcept from './CodeableConcept';
import Period from './Period';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDocumentReferenceContext } from '../types/partials/DocumentReferenceContext';

type TDocumentReferenceContextProps = TBaseResourceProps & {
    context: TDocumentReferenceContext | undefined;
};

const DocumentReferenceContextPartial = ({ context, name, resourceType, id }: TDocumentReferenceContextProps) => {
    if (!context) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {context.encounter && (
                <Reference reference={context.encounter} name="Encounter" resourceType={resourceType} id={id} searchParameter="encounter" />
            )}
            {context.event && <CodeableConcept codeableConcept={context.event} name="Event" resourceType={resourceType} id={id} />}
            {context.period && <Period period={context.period} name="Period" resourceType={resourceType} id={id} />}
            {context.facilityType && (
                <CodeableConcept codeableConcept={context.facilityType} name="Facility Type" resourceType={resourceType} id={id} />
            )}
            {context.practiceSetting && (
                <CodeableConcept codeableConcept={context.practiceSetting} name="Practice Setting" resourceType={resourceType} id={id} />
            )}
            {context.related && (
                <Reference reference={context.related} name="Related" resourceType={resourceType} id={id} searchParameter="related" />
            )}
        </Box>
    );
};

export default DocumentReferenceContextPartial;
```

(Imports the individual partials directly — `Reference`, `CodeableConcept`, `Period` —
rather than the `Partials` barrel object, avoiding a self-import of `src/partials/index.tsx`
from within its own directory. Task 7's new Encounter partials follow the same
direct-import approach.)

- [ ] **Step 3: Create `DocumentReferenceRelatesTo.tsx`**

```tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import Reference from './Reference';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDocumentReferenceRelatesTo } from '../types/partials/DocumentReferenceRelatesTo';

type TDocumentReferenceRelatesToProps = TBaseResourceProps & {
    relatesTo: TDocumentReferenceRelatesTo | TDocumentReferenceRelatesTo[] | undefined;
    resourceType?: String;
    id?: String;
};

const DocumentReferenceRelatesToPartial = ({ relatesTo, name, resourceType, id }: TDocumentReferenceRelatesToProps) => {
    const entries = relatesTo ? (Array.isArray(relatesTo) ? relatesTo : [relatesTo]) : [];
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {entries.map((entry, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Relationship: {String(entry.code)}
                    </Typography>
                    <Reference reference={entry} field="target" resourceType={resourceType} id={id} searchParameter="relates-to" />
                </Box>
            ))}
        </Box>
    );
};

export default DocumentReferenceRelatesToPartial;
```

- [ ] **Step 4: Register the new partials in `src/partials/index.tsx`**

Add imports and entries for `DocumentContent`, `DocumentReferenceContext` (imported as
`DocumentReferenceContextPartial` to avoid a name clash with the type import elsewhere,
exported as `DocumentReferenceContext`), and `DocumentReferenceRelatesTo`:

```tsx
import DocumentContent from './DocumentContent';
import DocumentReferenceContextPartial from './DocumentReferenceContext';
import DocumentReferenceRelatesTo from './DocumentReferenceRelatesTo';
```

and in the exported object (alongside the other entries, alphabetically):

```tsx
  DocumentContent,
  DocumentReferenceContext: DocumentReferenceContextPartial,
  DocumentReferenceRelatesTo,
```

- [ ] **Step 5: Update `partials_mapping_for_fields.py`**

In `src/generator/partials_mapping_for_fields.py`, change the existing
`DocumentReferenceRelatesTo` entry and add two new ones:

```python
    'DocumentReferenceRelatesTo': {
        'partial': 'DocumentReferenceRelatesTo',
        'field': '',
        'prop_name': 'relatesTo'
    },
```

(replacing the old `{'partial': 'Reference', 'field': 'target', 'prop_name': 'reference'}`
entry), and add:

```python
    'DocumentReferenceContent': {
        'partial': 'DocumentContent',
        'field': '',
        'prop_name': 'content'
    },
    'DocumentReferenceContext': {
        'partial': 'DocumentReferenceContext',
        'field': '',
        'prop_name': 'context'
    },
```

(`field: ''` is a harmless unused prop for these three — the jinja template always
passes a `field=` prop for every `partials_mapping` entry, and none of these three new
components read it.)

- [ ] **Step 6: Add the `description` special case to the jinja template**

In `src/generator/template.javascript.component.jinja2`, add a new `{% elif %}` branch
right after the existing `Organization`/`name` special case (same indentation level,
inside the `{% for property in fhir_entity.properties %}` loop):

```jinja2
        {% elif fhir_entity.cleaned_name == "DocumentReference" and property.javascript_clean_name == "description" %}
            {
                resource.description &&
                <Partials.NameValue
                    name='Description'
                    value={resource.description}
                    searchParameter='description'
                />
            }
```

- [ ] **Step 7: Regenerate**

```bash
make generate_components
```

Confirm via `git diff src/pages/resources/DocumentReference.tsx` that: `content`,
`context`, and `description` now render (via the new partials/special-case), `relatesTo`
now renders via `Partials.DocumentReferenceRelatesTo` instead of the old bare
`Partials.Reference`, and no *other* resource page under `src/pages/resources/` changed
(`git status` should show only `DocumentReference.tsx` modified, plus the new/edited
generator and partial files staged separately).

- [ ] **Step 8: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 9: Manually verify**

Run `yarn dev`, open a DocumentReference resource with `content`, `context.encounter`,
`description`, and `relatesTo` populated. Confirm: the content list appears with a
working "View" link into the Document Viewer; the Encounter link under Context
navigates to the right Encounter; the description text renders; relatesTo shows both
the relationship code and the target link.

- [ ] **Step 10: Commit**

```bash
git add src/partials/DocumentContent.tsx src/partials/DocumentReferenceContext.tsx \
  src/partials/DocumentReferenceRelatesTo.tsx src/partials/index.tsx \
  src/generator/partials_mapping_for_fields.py src/generator/template.javascript.component.jinja2 \
  src/pages/resources/DocumentReference.tsx
git commit -m "Render DocumentReference content/context/description/relatesTo.code"
```

---

### Task 5: Binary content gap — inline view/download on `Binary.tsx`

**Files:**
- Create: `src/partials/BinaryContent.tsx`
- Modify: `src/partials/index.tsx`
- Modify: `src/generator/template.javascript.component.jinja2`
- Regenerate: `src/pages/resources/Binary.tsx` (via `make generate_components`)

**Interfaces:**
- Consumes: nothing new — just needs the whole `resource` (`contentType`, `data`, `id`),
  not a single field, which is why this goes through a jinja special case (like
  `DocumentReference.description` in Task 4) rather than `partials_mapping` (which only
  ever receives one field's value).
- Produces: `BinaryContent` default export, registered on `Partials`.

- [ ] **Step 1: Create `BinaryContent.tsx`**

```tsx
import React from 'react';
import { Box, Link, Tooltip, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router';

type TBinaryContentProps = {
    contentType: String | undefined;
    id: String | undefined;
};

const BinaryContent = ({ contentType, id }: TBinaryContentProps) => {
    if (!id) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                Content
            </Typography>
            <Typography sx={{ mb: 1 }}>{contentType ? String(contentType) : 'Unknown content type'}</Typography>
            <Tooltip title="View in Document Viewer">
                <Link
                    component={RouterLink}
                    to={`/document-viewer/4_0_0/Binary/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 'fit-content' }}
                >
                    <DescriptionIcon fontSize="small" /> View <OpenInNewIcon fontSize="small" />
                </Link>
            </Tooltip>
        </Box>
    );
};

export default BinaryContent;
```

- [ ] **Step 2: Register in `src/partials/index.tsx`**

```tsx
import BinaryContent from './BinaryContent';
```

and in the exported object:

```tsx
  BinaryContent,
```

- [ ] **Step 3: Add the jinja special case**

In `src/generator/template.javascript.component.jinja2`, add another `{% elif %}`
branch next to the `DocumentReference.description` one from Task 4:

```jinja2
        {% elif fhir_entity.cleaned_name == "Binary" and property.javascript_clean_name == "data" %}
            <Partials.BinaryContent contentType={resource.contentType} id={uuid} />
```

(Keyed on the `data` property specifically so this renders exactly once per `Binary`
page, regardless of whether `data` itself is present — `BinaryContent` only needs
`contentType` + `id`, and always offers the "View" link, which itself handles the
missing-content case inside `DocumentViewer`.)

- [ ] **Step 4: Regenerate**

```bash
make generate_components
```

Confirm via `git diff src/pages/resources/Binary.tsx` that the new `Partials.BinaryContent`
call appears where `data` used to render nothing, and no other resource page changed.

- [ ] **Step 5: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 6: Manually verify**

Run `yarn dev`, open a Binary resource directly. Confirm the "View" link appears and
opens the Document Viewer showing that Binary's content.

- [ ] **Step 7: Commit**

```bash
git add src/partials/BinaryContent.tsx src/partials/index.tsx \
  src/generator/template.javascript.component.jinja2 src/pages/resources/Binary.tsx
git commit -m "Render Binary content via a View link into the Document Viewer"
```

---

### Task 6: `ResourceCard` header-action link into the Document Viewer

**Files:**
- Modify: `src/components/ResourceCard.tsx`

**Interfaces:**
- No new exports — purely additive to the existing component, following the exact
  shape of `getIPSLink`/`getCompositionSummaryLink`.

- [ ] **Step 1: Add `getDocumentViewerLink` and wire it in**

In `src/components/ResourceCard.tsx`, add a new helper next to `getCompositionSummaryLink`:

```tsx
const getDocumentViewerLink = ({ resource, uuid }: TGetIPSLinkProps) => {
    return (
        <Tooltip title="View Document Content">
            <Link
                to={`/document-viewer/4_0_0/${resource.resourceType}/${uuid}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                    color: 'inherit',
                }}
            >
                <DescriptionIcon color="primary" fontSize="small" />
                <Typography variant="body2" color="primary">
                    Document Viewer
                </Typography>
                <OpenInNewIcon color="primary" fontSize="small" />
            </Link>
        </Tooltip>
    );
};
```

Add the resource-type list next to the other three (`spreadSheetResourceTypes` etc.):

```tsx
    const documentViewerResourceTypes = ['DocumentReference', 'Binary'];
```

Wire it into both the collapsed `CardHeader` `action` box (next to the existing
`getCompositionSummaryLink` call) and the expanded `CardContent` block, following the
identical pattern already used for `compositionSummaryResourceTypes`:

In the `CardHeader`'s `action`:

```tsx
                        {resource.resourceType &&
                            documentViewerResourceTypes.includes(resource.resourceType.toString()) &&
                            getDocumentViewerLink({ resource, uuid: uuid?.toString() })}
```

In `CardContent`, extend the existing conditional block's `Box` (the one currently
gated on `spreadSheetResourceTypes.includes(...) || compositionSummaryResourceTypes.includes(...)`)
to also include `documentViewerResourceTypes`, and add the corresponding rendering
branch alongside the `summaryResourceTypes`/`compositionSummaryResourceTypes` branches
already there:

```tsx
                    {resource.resourceType &&
                        (spreadSheetResourceTypes.includes(resource.resourceType.toString()) ||
                            compositionSummaryResourceTypes.includes(resource.resourceType.toString()) ||
                            documentViewerResourceTypes.includes(resource.resourceType.toString())) && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                {/* ...existing spreadSheetResourceTypes and compositionSummaryResourceTypes blocks, unchanged... */}
                                {documentViewerResourceTypes.includes(resource.resourceType.toString()) && (
                                    <Box>{getDocumentViewerLink({ resource, uuid: uuid?.toString() })}</Box>
                                )}
                            </Box>
                        )}
```

- [ ] **Step 2: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 3: Manually verify**

Run `yarn dev`, browse to a list of `DocumentReference` or `Binary` resources. Confirm
the "Document Viewer" link appears both in the collapsed card header and in the
expanded card content, and opens `/document-viewer/4_0_0/...` in a new tab. Confirm it
does *not* appear for unrelated resource types (e.g. `Patient`).

- [ ] **Step 4: Commit**

```bash
git add src/components/ResourceCard.tsx
git commit -m "Add Document Viewer link to ResourceCard for DocumentReference/Binary"
```

---

### Task 7: Encounter ↔ DocumentReference reverse link + Encounter field gaps

**Files:**
- Create: `src/partials/EncounterParticipant.tsx`
- Create: `src/partials/EncounterHospitalization.tsx`
- Create: `src/partials/EncounterDiagnosis.tsx`
- Create: `src/partials/EncounterLocation.tsx`
- Create: `src/partials/EncounterStatusHistory.tsx`
- Create: `src/partials/EncounterClassHistory.tsx`
- Modify: `src/partials/index.tsx`
- Modify: `src/generator/partials_mapping_for_fields.py`
- Modify: `src/generator/reverse_references.py`
- Regenerate: `src/pages/resources/Encounter.tsx` (via `make generate_components`)

**Interfaces:**
- Consumes: `Partials.Reference`, `Partials.CodeableConcept`, `Partials.Period`
  (existing).
- Produces: six new partial default exports, registered on `Partials`.

- [ ] **Step 1: Create `EncounterParticipant.tsx`**

```tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Period from './Period';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterParticipant } from '../types/partials/EncounterParticipant';

type TEncounterParticipantProps = TBaseResourceProps & {
    participant: TEncounterParticipant | TEncounterParticipant[] | undefined;
};

const EncounterParticipantPartial = ({ participant, name, resourceType, id }: TEncounterParticipantProps) => {
    const entries = participant ? (Array.isArray(participant) ? participant : [participant]) : [];
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {entries.map((entry, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                    {entry.type && <CodeableConcept codeableConcept={entry.type} name="Type" resourceType={resourceType} id={id} />}
                    {entry.period && <Period period={entry.period} name="Period" resourceType={resourceType} id={id} />}
                    {entry.individual && (
                        <Reference reference={entry} field="individual" resourceType={resourceType} id={id} searchParameter="participant" />
                    )}
                </Box>
            ))}
        </Box>
    );
};

export default EncounterParticipantPartial;
```

- [ ] **Step 2: Create `EncounterHospitalization.tsx`**

```tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterHospitalization } from '../types/partials/EncounterHospitalization';

type TEncounterHospitalizationProps = TBaseResourceProps & {
    hospitalization: TEncounterHospitalization | undefined;
};

const EncounterHospitalizationPartial = ({ hospitalization, name, resourceType, id }: TEncounterHospitalizationProps) => {
    if (!hospitalization) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {hospitalization.origin && (
                <Reference reference={hospitalization} field="origin" resourceType={resourceType} id={id} searchParameter="hospitalization" />
            )}
            {hospitalization.admitSource && (
                <CodeableConcept codeableConcept={hospitalization.admitSource} name="Admit Source" resourceType={resourceType} id={id} />
            )}
            {hospitalization.reAdmission && (
                <CodeableConcept codeableConcept={hospitalization.reAdmission} name="Re-Admission" resourceType={resourceType} id={id} />
            )}
            {hospitalization.dietPreference && (
                <CodeableConcept codeableConcept={hospitalization.dietPreference} name="Diet Preference" resourceType={resourceType} id={id} />
            )}
            {hospitalization.specialCourtesy && (
                <CodeableConcept codeableConcept={hospitalization.specialCourtesy} name="Special Courtesy" resourceType={resourceType} id={id} />
            )}
            {hospitalization.specialArrangement && (
                <CodeableConcept codeableConcept={hospitalization.specialArrangement} name="Special Arrangement" resourceType={resourceType} id={id} />
            )}
            {hospitalization.destination && (
                <Reference reference={hospitalization} field="destination" resourceType={resourceType} id={id} searchParameter="hospitalization" />
            )}
            {hospitalization.dischargeDisposition && (
                <CodeableConcept codeableConcept={hospitalization.dischargeDisposition} name="Discharge Disposition" resourceType={resourceType} id={id} />
            )}
        </Box>
    );
};

export default EncounterHospitalizationPartial;
```

- [ ] **Step 3: Create `EncounterDiagnosis.tsx`**

```tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterDiagnosis } from '../types/partials/EncounterDiagnosis';

type TEncounterDiagnosisProps = TBaseResourceProps & {
    diagnosis: TEncounterDiagnosis | TEncounterDiagnosis[] | undefined;
};

const EncounterDiagnosisPartial = ({ diagnosis, name, resourceType, id }: TEncounterDiagnosisProps) => {
    const entries = diagnosis ? (Array.isArray(diagnosis) ? diagnosis : [diagnosis]) : [];
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {entries.map((entry, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                    {entry.rank !== undefined && (
                        <Typography variant="body2" color="text.secondary">
                            Rank: {entry.rank}
                        </Typography>
                    )}
                    {entry.use && <CodeableConcept codeableConcept={entry.use} name="Use" resourceType={resourceType} id={id} />}
                    <Reference reference={entry} field="condition" resourceType={resourceType} id={id} searchParameter="diagnosis" />
                </Box>
            ))}
        </Box>
    );
};

export default EncounterDiagnosisPartial;
```

- [ ] **Step 4: Create `EncounterLocation.tsx`**

```tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Period from './Period';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterLocation } from '../types/partials/EncounterLocation';

type TEncounterLocationProps = TBaseResourceProps & {
    location: TEncounterLocation | TEncounterLocation[] | undefined;
};

const EncounterLocationPartial = ({ location, name, resourceType, id }: TEncounterLocationProps) => {
    const entries = location ? (Array.isArray(location) ? location : [location]) : [];
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {entries.map((entry, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                    {entry.status && (
                        <Typography variant="body2" color="text.secondary">
                            Status: {String(entry.status)}
                        </Typography>
                    )}
                    {entry.physicalType && (
                        <CodeableConcept codeableConcept={entry.physicalType} name="Physical Type" resourceType={resourceType} id={id} />
                    )}
                    {entry.period && <Period period={entry.period} name="Period" resourceType={resourceType} id={id} />}
                    <Reference reference={entry} field="location" resourceType={resourceType} id={id} searchParameter="location" />
                </Box>
            ))}
        </Box>
    );
};

export default EncounterLocationPartial;
```

- [ ] **Step 5: Create `EncounterStatusHistory.tsx`**

```tsx
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterStatusHistory } from '../types/partials/EncounterStatusHistory';

type TEncounterStatusHistoryProps = TBaseResourceProps & {
    statusHistory: TEncounterStatusHistory | TEncounterStatusHistory[] | undefined;
};

const EncounterStatusHistoryPartial = ({ statusHistory, name }: TEncounterStatusHistoryProps) => {
    const entries = statusHistory ? (Array.isArray(statusHistory) ? statusHistory : [statusHistory]) : [];
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell>Start</TableCell>
                            <TableCell>End</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{String(entry.status)}</TableCell>
                                <TableCell>{entry.period?.start}</TableCell>
                                <TableCell>{entry.period?.end}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default EncounterStatusHistoryPartial;
```

- [ ] **Step 6: Create `EncounterClassHistory.tsx`**

```tsx
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterClassHistory } from '../types/partials/EncounterClassHistory';

type TEncounterClassHistoryProps = TBaseResourceProps & {
    classHistory: TEncounterClassHistory | TEncounterClassHistory[] | undefined;
};

const EncounterClassHistoryPartial = ({ classHistory, name }: TEncounterClassHistoryProps) => {
    const entries = classHistory ? (Array.isArray(classHistory) ? classHistory : [classHistory]) : [];
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Class Code</TableCell>
                            <TableCell>Start</TableCell>
                            <TableCell>End</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{entry.class_?.code}</TableCell>
                                <TableCell>{entry.period?.start}</TableCell>
                                <TableCell>{entry.period?.end}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default EncounterClassHistoryPartial;
```

- [ ] **Step 7: Register all six in `src/partials/index.tsx`**

```tsx
import EncounterParticipantPartial from './EncounterParticipant';
import EncounterHospitalizationPartial from './EncounterHospitalization';
import EncounterDiagnosisPartial from './EncounterDiagnosis';
import EncounterLocationPartial from './EncounterLocation';
import EncounterStatusHistoryPartial from './EncounterStatusHistory';
import EncounterClassHistoryPartial from './EncounterClassHistory';
```

and in the exported object:

```tsx
  EncounterParticipant: EncounterParticipantPartial,
  EncounterHospitalization: EncounterHospitalizationPartial,
  EncounterDiagnosis: EncounterDiagnosisPartial,
  EncounterLocation: EncounterLocationPartial,
  EncounterStatusHistory: EncounterStatusHistoryPartial,
  EncounterClassHistory: EncounterClassHistoryPartial,
```

- [ ] **Step 8: Update `partials_mapping_for_fields.py`**

Change the existing `EncounterDiagnosis` and `EncounterLocation` entries, and add four
new ones:

```python
    'EncounterDiagnosis': {
        'partial': 'EncounterDiagnosis',
        'field': '',
        'prop_name': 'diagnosis'
    },
    'EncounterLocation': {
        'partial': 'EncounterLocation',
        'field': '',
        'prop_name': 'location'
    },
    'EncounterParticipant': {
        'partial': 'EncounterParticipant',
        'field': '',
        'prop_name': 'participant'
    },
    'EncounterHospitalization': {
        'partial': 'EncounterHospitalization',
        'field': '',
        'prop_name': 'hospitalization'
    },
    'EncounterStatusHistory': {
        'partial': 'EncounterStatusHistory',
        'field': '',
        'prop_name': 'statusHistory'
    },
    'EncounterClassHistory': {
        'partial': 'EncounterClassHistory',
        'field': '',
        'prop_name': 'classHistory'
    },
```

(`EncounterDiagnosis`/`EncounterLocation` replace their old
`{'partial': 'Reference', 'field': 'condition'/'location', 'prop_name': 'reference'}`
entries — same key, new value.)

- [ ] **Step 9: Add the reverse-reference entry in `reverse_references.py`**

In `src/generator/reverse_references.py`, add a new top-level key:

```python
    "Encounter": [
        {"reverseReferences": [{"target":'DocumentReference', "property":'encounter'}], "name": "DocumentReference"}
    ],
```

- [ ] **Step 10: Regenerate**

```bash
make generate_components
```

Confirm via `git diff src/pages/resources/Encounter.tsx` that: `participant`,
`hospitalization`, `statusHistory`, `classHistory` now render; `diagnosis` and
`location` now render via the new full partials instead of the old bare
`Partials.Reference`; a "Related Resources" section with a DocumentReference
reverse-search link now appears at the bottom (matching the existing pattern used on
`Patient.tsx`/`Location.tsx`/etc.). Confirm `contained` is still unrendered (out of
scope per the design) and no other resource page changed.

- [ ] **Step 11: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 12: Manually verify**

Run `yarn dev`, open an Encounter resource with `participant`, `hospitalization`,
`diagnosis`, `location`, `statusHistory`, `classHistory` populated, and at least one
`DocumentReference` whose `context.encounter` points at it. Confirm all six new/updated
sections render with the expected sub-fields, and the "DocumentReference" reverse link
at the bottom opens a search page that actually returns that DocumentReference.

- [ ] **Step 13: Commit**

```bash
git add src/partials/EncounterParticipant.tsx src/partials/EncounterHospitalization.tsx \
  src/partials/EncounterDiagnosis.tsx src/partials/EncounterLocation.tsx \
  src/partials/EncounterStatusHistory.tsx src/partials/EncounterClassHistory.tsx \
  src/partials/index.tsx src/generator/partials_mapping_for_fields.py \
  src/generator/reverse_references.py src/pages/resources/Encounter.tsx
git commit -m "Render Encounter participant/hospitalization/diagnosis/location/history + DocumentReference reverse link"
```

---

### Task 8: Full regression pass

- [ ] **Step 1: Full regenerate + diff review**

```bash
make generate_components
git status
```

Confirm the working tree is clean after this (i.e. Tasks 4/5/7's committed generated
output already matches what a full regen produces — no drift).

- [ ] **Step 2: Full lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings beyond the pre-existing baseline noted in Global
Constraints.

- [ ] **Step 3: Manual end-to-end pass**

Run `yarn dev` and walk through, on real (dev-environment) data:
- A DocumentReference with inline base64 `content[].attachment.data` of `text/html` —
  confirm sanitized inline HTML preview + download.
- A DocumentReference with `content[].attachment.url` pointing at a `Binary/{id}` of
  `application/pdf` — confirm inline PDF preview + download.
- A DocumentReference with `text/rtf` content — confirm RTF renders via `rtf.js` (or
  gracefully falls back to the download-only message on failure).
- A DocumentReference with an `image/*` attachment — confirm inline image preview.
- A DocumentReference with a non-`Binary` external `attachment.url` — confirm it shows
  as an "Open externally" link, not a failed fetch.
- A bare `Binary` resource opened directly — confirm the "View" link and viewer work.
- An Encounter linked to DocumentReferences via `context.encounter` — confirm the
  reverse "DocumentReference" search link, and confirm the forward link on the
  DocumentReference's own Context section resolves back to that Encounter.
- Confirm the `ResourceCard` "Document Viewer" link appears only for `DocumentReference`
  and `Binary`, in both collapsed and expanded card states.

- [ ] **Step 4: Update `docs/superpowers/plans/`**

Mark all checkboxes in this file complete (already done incrementally per task, confirm
none were missed).
