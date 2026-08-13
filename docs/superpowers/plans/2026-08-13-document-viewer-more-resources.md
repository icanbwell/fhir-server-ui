# Document Viewer — Additional Resource Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Document Viewer (`/document-viewer/4_0_0/:resourceType/:id?/:operation?`) so it can preview/download attachments from six more FHIR resource types — `DiagnosticReport.presentedForm`, `Media.content`, `Patient`/`Practitioner`/`RelatedPerson.photo`, `Consent.sourceAttachment`, and `Contract.legallyBindingAttachment` — on top of its current `DocumentReference`/`Binary` support.

**Architecture:** Generalize `DocumentViewer.tsx`'s hardcoded `resourceType` gate into a small per-resourceType config table describing which field holds the attachment(s) and in which of three shapes (`wrapped-array`, `bare-array`, `single`); normalize whichever shape into one `TAttachment[]` list and reuse the existing content-index isolation/rendering logic generically over it. Add the "View in Document Viewer" link exactly once, inside the shared, hand-written `src/partials/Attachment.tsx` partial — every one of the 7 new call sites (`DiagnosticReport.tsx`, `Media.tsx`, `Patient.tsx`, `Practitioner.tsx`, `RelatedPerson.tsx`, `Consent.tsx`, `Contract.tsx`) already renders through that shared partial and already passes it `resourceType`/`id`, so no generated page needs to change. Widen `DocumentViewerLink`'s `resourceType` prop to match, and export the type so both `DocumentViewer.tsx` and `Attachment.tsx` share one source of truth for "which resource types does the viewer support."

**Tech Stack:** React + TypeScript, MUI, react-router v8 (`MemoryRouter`/`Link`), vitest + `@testing-library/react` for tests, yarn as the package manager (`yarn.lock` present).

**Spec:** None — this is a bounded-path change to an existing flow (`DocumentViewer.tsx`/`DocumentViewerLink.tsx`/`DocumentViewerPage.tsx` already exist and already work for `DocumentReference`/`Binary`). The design below was agreed directly in chat during brainstorming rather than written up as a separate spec doc.

## Global Constraints

- **Never modify a generated file.** `make generate_components` rewrites everything under `src/pages/resources/*.tsx`, `src/components/ResourceItem.tsx`, and `src/utils/resourceDefinitions.ts` — any hand-edit there is silently lost on the next regen. This plan's 3 touched files (`DocumentViewerLink.tsx`, `DocumentViewer.tsx`, `Attachment.tsx`) are all under `src/partials/` or `src/components/` and are hand-written; codegen never writes to `src/partials/`. Do not touch any file under `src/pages/resources/`.
- **`Binary` is not a config-table entry.** It is the fetched resource itself (its own `contentType`/`data`), not a field on some other resource, so `DocumentViewer.tsx` keeps its existing explicit `if (resource.resourceType === 'Binary')` branch untouched.
- **Field names must match the generated pages exactly:** `presentedForm` (DiagnosticReport), `content` (Media — note this is a different field/shape than `DocumentReference.content`), `photo` (Patient/Practitioner/RelatedPerson), `sourceAttachment` (Consent), `legallyBindingAttachment` (Contract). These were confirmed via `grep -n "Partials.Attachment" -B4 src/pages/resources/*.tsx` against the current generated pages.
- **`contentIndex` is only ever passed for array-shaped fields with more than one entry.** Single-attachment fields (`Media.content`, `Consent.sourceAttachment`, `Contract.legallyBindingAttachment`, and `Binary`) never get an index path segment — this matches Binary's existing no-index convention today.
- **Commit messages and the PR title must start with a Jira key for project PHR** (e.g. `PHR-XXXX`), enforced by `.github/workflows/check-commit-message.yml`. Replace `PHR-XXXX` in every commit message below with a real ticket key before pushing — create one first if none exists yet.
- Package manager is **yarn** (`yarn.lock` is present, not `package-lock.json`) — use `yarn <script>`, not `npm run <script>`, for every command below.

---

### Task 1: Widen `DocumentViewerLink`'s supported resource types

**Files:**
- Modify: `src/partials/DocumentViewerLink.tsx`
- Test: `src/partials/DocumentViewerLink.test.tsx` (new)

**Interfaces:**
- Produces: `export type TDocumentViewerResourceType = 'DocumentReference' | 'Binary' | 'DiagnosticReport' | 'Media' | 'Patient' | 'Practitioner' | 'RelatedPerson' | 'Consent' | 'Contract'` — consumed by Task 2 (`DocumentViewer.tsx`) and Task 3 (`Attachment.tsx`).
- Produces: `DocumentViewerLink` component's `resourceType` prop now accepts any `TDocumentViewerResourceType` (previously only `'DocumentReference' | 'Binary'`). `id`, `contentIndex`, `sx` props are unchanged.

- [ ] **Step 1: Write the failing tests**

Create `src/partials/DocumentViewerLink.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import DocumentViewerLink from './DocumentViewerLink';

describe('DocumentViewerLink', () => {
    it('links to the resource without a content index when none is given', () => {
        render(
            <MemoryRouter>
                <DocumentViewerLink resourceType="Media" id="abc123" />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute(
            'href',
            '/document-viewer/4_0_0/Media/abc123'
        );
    });

    it('appends the content index for array-shaped attachment fields', () => {
        render(
            <MemoryRouter>
                <DocumentViewerLink resourceType="DiagnosticReport" id="abc123" contentIndex={2} />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute(
            'href',
            '/document-viewer/4_0_0/DiagnosticReport/abc123/2'
        );
    });

    it('renders nothing when id is undefined', () => {
        const { container } = render(
            <MemoryRouter>
                <DocumentViewerLink resourceType="Patient" id={undefined} />
            </MemoryRouter>
        );

        expect(container).toBeEmptyDOMElement();
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn vitest run src/partials/DocumentViewerLink.test.tsx`
Expected: FAIL — TypeScript error, because `resourceType="Media"` / `"DiagnosticReport"` / `"Patient"` are not yet valid values for the current `'DocumentReference' | 'Binary'` prop type.

- [ ] **Step 3: Widen the prop type and export it**

Replace the top of `src/partials/DocumentViewerLink.tsx` (everything before the component definition) with:

```tsx
import { Link, Tooltip } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router';

// Every FHIR resource type the Document Viewer (DocumentViewer.tsx) knows how to render —
// either the resource itself (Binary) or a field on it that carries Attachment(s) (all others;
// see ATTACHMENT_FIELD_BY_RESOURCE_TYPE in DocumentViewer.tsx for which field on each).
export type TDocumentViewerResourceType =
    | 'DocumentReference'
    | 'Binary'
    | 'DiagnosticReport'
    | 'Media'
    | 'Patient'
    | 'Practitioner'
    | 'RelatedPerson'
    | 'Consent'
    | 'Contract';

type TDocumentViewerLinkProps = {
    resourceType: TDocumentViewerResourceType;
    id: String | undefined;
    // Selects a specific attachment entry for resource types whose attachment field is an
    // array (DocumentReference.content, DiagnosticReport.presentedForm, Patient/Practitioner/
    // RelatedPerson.photo) — see DocumentViewerPage's path-segment convention. Omitted entirely
    // for single-attachment fields (Binary, Media.content, Consent.sourceAttachment,
    // Contract.legallyBindingAttachment), which have no array to index into.
    contentIndex?: number;
    sx?: SxProps<Theme>;
};
```

Leave the rest of the file (the `DocumentViewerLink` component body and `export default DocumentViewerLink;`) exactly as-is — only the type above it changes.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn vitest run src/partials/DocumentViewerLink.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/partials/DocumentViewerLink.tsx src/partials/DocumentViewerLink.test.tsx
git commit -m "PHR-XXXX Widen DocumentViewerLink to support more resource types"
```

---

### Task 2: Generalize `DocumentViewer.tsx` to render any supported resource type

**Files:**
- Modify: `src/components/DocumentViewer.tsx`
- Test: `src/components/DocumentViewer.test.tsx` (new)

**Interfaces:**
- Consumes: `TDocumentViewerResourceType` from `../partials/DocumentViewerLink` (Task 1).
- Produces: `DocumentViewer`'s rendering behavior generalizes from "DocumentReference or Binary only" to all 8 types in `TDocumentViewerResourceType`. Its own props (`relativeUrl: string`, `contentIndex?: number`) are unchanged — Task 3 does not depend on anything new from this task.

- [ ] **Step 1: Write the failing tests**

Create `src/components/DocumentViewer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentViewer from './DocumentViewer';
import BaseApi from '../api/baseApi';

// Inline base64 for "hello" — lets AttachmentPreview resolve content synchronously with no
// network call, so these tests only need to mock DocumentViewer's own resource fetch below.
const textAttachment = (title: string) => ({
    contentType: 'text/plain',
    data: 'aGVsbG8=',
    title,
});

describe('DocumentViewer', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders every content[] entry for a DocumentReference (wrapped-array shape)', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: {
                resourceType: 'DocumentReference',
                id: 'doc-1',
                content: [{ attachment: textAttachment('First') }, { attachment: textAttachment('Second') }],
            },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/DocumentReference/doc-1" />);

        expect(await screen.findByText('DocumentReference/doc-1')).toBeInTheDocument();
        expect(await screen.findByText('First')).toBeInTheDocument();
        expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('renders a Binary resource directly (whole-resource shape)', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: { resourceType: 'Binary', id: 'bin-1', contentType: 'text/plain', data: 'aGVsbG8=' },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/Binary/bin-1" />);

        expect(await screen.findByText('Binary/bin-1')).toBeInTheDocument();
    });

    it('isolates one entry of a bare-array field (DiagnosticReport.presentedForm) by contentIndex', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: {
                resourceType: 'DiagnosticReport',
                id: 'dr-1',
                presentedForm: [textAttachment('Page 1'), textAttachment('Page 2')],
            },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/DiagnosticReport/dr-1" contentIndex={1} />);

        expect(await screen.findByText(/DiagnosticReport\/dr-1.*content 2 of 2/)).toBeInTheDocument();
        expect(screen.getByText('Page 2')).toBeInTheDocument();
        expect(screen.queryByText('Page 1')).not.toBeInTheDocument();
    });

    it('renders a single-attachment field (Media.content) without requiring a content index', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: { resourceType: 'Media', id: 'media-1', content: textAttachment('Recording') },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/Media/media-1" />);

        expect(await screen.findByText('Media/media-1')).toBeInTheDocument();
        expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    it('shows an error for a resource type the Document Viewer does not support', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: { resourceType: 'Observation', id: 'obs-1' },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/Observation/obs-1" />);

        expect(await screen.findByText(/does not support resource type "Observation"/i)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn vitest run src/components/DocumentViewer.test.tsx`
Expected: FAIL on the `DiagnosticReport`, `Media`, and `Observation`-error tests (current code only recognizes `DocumentReference`/`Binary` and rejects everything else); the `DocumentReference` and `Binary` tests should already pass since that behavior is unchanged.

- [ ] **Step 3: Replace `DocumentViewer.tsx` with the generalized version**

Replace the full contents of `src/components/DocumentViewer.tsx` with:

```tsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import AttachmentPreview from './AttachmentPreview';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';
import { TDocumentViewerResourceType } from '../partials/DocumentViewerLink';

interface DocumentViewerProps {
    relativeUrl: string;
    // Isolates this one attachment entry instead of stacking all of them. DocumentViewerPage
    // defaults this to 0 when the URL carries no explicit index, so undefined here only occurs
    // for a non-numeric trailing path segment (a real FHIR sub-operation) — in which case every
    // entry is shown, since no single one was requested.
    contentIndex?: number;
}

interface FhirResource {
    resourceType?: string;
    id?: string;
    contentType?: string;
    data?: string;
    [key: string]: unknown;
}

// Every resource type the Document Viewer supports, other than Binary (handled as its own
// special case below, since it IS the fetched resource rather than a field on it), carries its
// attachment(s) in exactly one field, in one of three shapes:
//  - 'wrapped-array': entries are `{ attachment: TAttachment }` (DocumentReference.content)
//  - 'bare-array': entries are TAttachment directly (DiagnosticReport.presentedForm, *.photo)
//  - 'single': the field itself is one TAttachment, not an array (Media.content, etc.)
type TAttachmentFieldShape = 'wrapped-array' | 'bare-array' | 'single';

type TAttachmentFieldConfig = {
    field: string;
    shape: TAttachmentFieldShape;
};

const ATTACHMENT_FIELD_BY_RESOURCE_TYPE: Record<
    Exclude<TDocumentViewerResourceType, 'Binary'>,
    TAttachmentFieldConfig
> = {
    DocumentReference: { field: 'content', shape: 'wrapped-array' },
    DiagnosticReport: { field: 'presentedForm', shape: 'bare-array' },
    Media: { field: 'content', shape: 'single' },
    Patient: { field: 'photo', shape: 'bare-array' },
    Practitioner: { field: 'photo', shape: 'bare-array' },
    RelatedPerson: { field: 'photo', shape: 'bare-array' },
    Consent: { field: 'sourceAttachment', shape: 'single' },
    Contract: { field: 'legallyBindingAttachment', shape: 'single' },
};

const isSupportedResourceType = (resourceType: string | undefined): resourceType is TDocumentViewerResourceType =>
    resourceType === 'Binary' ||
    Object.prototype.hasOwnProperty.call(ATTACHMENT_FIELD_BY_RESOURCE_TYPE, resourceType ?? '');

const extractAttachments = (resource: FhirResource, config: TAttachmentFieldConfig): TAttachment[] => {
    const raw = resource[config.field];
    if (!raw) {
        return [];
    }
    switch (config.shape) {
        case 'wrapped-array':
            return (raw as Array<{ attachment: TAttachment }>).map((entry) => entry.attachment);
        case 'bare-array':
            return raw as TAttachment[];
        case 'single':
            return [raw as TAttachment];
    }
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({ relativeUrl, contentIndex }) => {
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
                if (isSupportedResourceType(json?.resourceType)) {
                    setResource(json);
                } else {
                    setErrorMessage(`The Document Viewer does not support resource type "${json?.resourceType}".`);
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
        // No title here: the heading below already reads "Binary/{id}" — repeating it as
        // AttachmentPreview's own subtitle would just duplicate the same text, and using it as
        // a download filename (which AttachmentPreview falls back to when title is unset) would
        // put a literal "/" in the suggested filename.
        const attachment: TAttachment = {
            contentType: resource.contentType,
            data: resource.data,
            url: resource.data ? undefined : `Binary/${resource.id}`,
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

    const config = ATTACHMENT_FIELD_BY_RESOURCE_TYPE[resource.resourceType as Exclude<TDocumentViewerResourceType, 'Binary'>];
    const attachments = extractAttachments(resource, config);
    // Isolate the requested entry when its index is valid; otherwise (no index given, or a
    // stale/out-of-range one) fall back to showing every entry rather than a dead end.
    // contentIndex is a regex-validated (\d+) number from the URL, used only as an array index.
    // eslint-disable-next-line security/detect-object-injection
    const isolated = contentIndex !== undefined ? attachments[contentIndex] : undefined;
    const entriesToShow = isolated ? [isolated] : attachments;

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
                {`${resource.resourceType}/${resource.id}`}
                {isolated ? ` — content ${contentIndex! + 1} of ${attachments.length}` : ''}
            </Typography>
            {attachments.length === 0 && (
                <Alert severity="warning">This {resource.resourceType} has no attachment entries.</Alert>
            )}
            {!isolated && contentIndex !== undefined && attachments.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Content entry {contentIndex + 1} was requested but no longer exists — showing all entries
                    instead.
                </Alert>
            )}
            {entriesToShow.map((attachment, index) => (
                <AttachmentPreview key={isolated ? contentIndex : index} attachment={attachment} />
            ))}
        </Box>
    );
};

export default DocumentViewer;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn vitest run src/components/DocumentViewer.test.tsx`
Expected: PASS (5 tests)

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `yarn test`
Expected: PASS — no other suite references `DocumentViewer.tsx`'s internals directly, but this confirms nothing else broke.

- [ ] **Step 6: Commit**

```bash
git add src/components/DocumentViewer.tsx src/components/DocumentViewer.test.tsx
git commit -m "PHR-XXXX Generalize DocumentViewer to support more resource types"
```

---

### Task 3: Wire the "View in Document Viewer" link into the shared `Attachment.tsx` partial

**Files:**
- Modify: `src/partials/Attachment.tsx`
- Test: `src/partials/Attachment.test.tsx` (new)

**Interfaces:**
- Consumes: `TDocumentViewerResourceType` and `DocumentViewerLink` from `./DocumentViewerLink` (Task 1).
- Produces: no new exports — `Attachment`'s existing props (`attachment`, `name`, plus `resourceType`/`id` from `TBaseResourceProps`) are unchanged; this task only changes what it renders.

- [ ] **Step 1: Write the failing tests**

Create `src/partials/Attachment.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Attachment from './Attachment';

const renderAttachment = (props: React.ComponentProps<typeof Attachment>) =>
    render(
        <MemoryRouter>
            <Attachment {...props} />
        </MemoryRouter>
    );

describe('Attachment', () => {
    it('renders a "View in Document Viewer" link for a supported resource type', () => {
        renderAttachment({
            attachment: { contentType: 'application/pdf', title: 'Report' },
            name: 'Presented Form',
            resourceType: 'DiagnosticReport',
            id: 'dr-1',
        });

        expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute(
            'href',
            '/document-viewer/4_0_0/DiagnosticReport/dr-1'
        );
    });

    it('omits the content index when there is only one attachment entry', () => {
        renderAttachment({
            attachment: { contentType: 'image/png', title: 'Photo' },
            name: 'Photo',
            resourceType: 'Patient',
            id: 'pat-1',
        });

        expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute(
            'href',
            '/document-viewer/4_0_0/Patient/pat-1'
        );
    });

    it('includes a per-entry content index when there are multiple attachment entries', () => {
        renderAttachment({
            attachment: [
                { contentType: 'image/png', title: 'Photo 1' },
                { contentType: 'image/png', title: 'Photo 2' },
            ],
            name: 'Photo',
            resourceType: 'Practitioner',
            id: 'prac-1',
        });

        const links = screen.getAllByRole('link', { name: /view/i });
        expect(links[0]).toHaveAttribute('href', '/document-viewer/4_0_0/Practitioner/prac-1/0');
        expect(links[1]).toHaveAttribute('href', '/document-viewer/4_0_0/Practitioner/prac-1/1');
    });

    it('renders no Document Viewer link for a resource type outside the supported list', () => {
        renderAttachment({
            attachment: { contentType: 'text/plain' },
            name: 'Note',
            resourceType: 'Observation',
            id: 'obs-1',
        });

        expect(screen.queryByRole('link', { name: /view/i })).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn vitest run src/partials/Attachment.test.tsx`
Expected: FAIL — no "View in Document Viewer" link exists yet, so every `getByRole('link', ...)` assertion fails to find one.

- [ ] **Step 3: Add the link to `Attachment.tsx`**

Add the import and the resource-type allowlist near the top of `src/partials/Attachment.tsx` (after the existing imports):

```tsx
import DocumentViewerLink, { TDocumentViewerResourceType } from './DocumentViewerLink';

// Resource types whose attachment-bearing field renders through this shared partial and is
// also viewable via the Document Viewer. DocumentReference.content and Binary go through their
// own dedicated partial/route instead (see DocumentContent.tsx), so they're deliberately not
// listed here — this partial never receives those two.
const DOCUMENT_VIEWER_RESOURCE_TYPES: ReadonlyArray<TDocumentViewerResourceType> = [
    'DiagnosticReport',
    'Media',
    'Patient',
    'Practitioner',
    'RelatedPerson',
    'Consent',
    'Contract',
];
```

Change the component signature to also destructure `resourceType` and `id`:

```tsx
const Attachment = ({ attachment, name, resourceType, id }: TAttachmentProps) => {
```

Immediately after the `items` `useMemo` block (before the `isTextContentType` function), add:

```tsx
  const documentViewerResourceType = DOCUMENT_VIEWER_RESOURCE_TYPES.find(
    (supported) => supported === String(resourceType)
  );
```

Finally, inside the `<AccordionDetails>` block, add the link above the existing `<Box component="pre">`:

```tsx
              <AccordionDetails>
                {documentViewerResourceType && (
                  <Box sx={{ mb: 1 }}>
                    <DocumentViewerLink
                      resourceType={documentViewerResourceType}
                      id={id}
                      contentIndex={items.length > 1 ? Number(index) : undefined}
                    />
                  </Box>
                )}
                <Box component="pre">
                  <Box component="code">{renderAttachmentData(item)}</Box>
                </Box>
              </AccordionDetails>
```

(The link is placed in `AccordionDetails`, not `AccordionSummary`, so it isn't nested inside the accordion's own clickable toggle region.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn vitest run src/partials/Attachment.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `yarn test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/partials/Attachment.tsx src/partials/Attachment.test.tsx
git commit -m "PHR-XXXX Add Document Viewer links to the shared Attachment partial"
```

---

### Task 4: Manual live-server smoke test (do not skip — see rationale below)

**Rationale:** PR #232 (the original Document Viewer feature) shipped a PDF-preview bug to production because its Binary-fetch/PDF path was type-checked and unit-tested but never manually exercised against a real server before merge. This task exists specifically to not repeat that gap for the two new attachment *shapes* introduced here (`bare-array` with multiple entries, and `single`) — Tasks 1–3's automated tests mock the network layer entirely, so they cannot catch a real routing, CORS, or data-shape mismatch against an actual FHIR server.

**Files:** None (manual verification only — no code changes in this task).

- [ ] **Step 1: Start the dev server**

Run: `yarn dev`
Expected: Vite prints a local URL (typically `http://localhost:5173`).

- [ ] **Step 2: Find or create test data — a DiagnosticReport with 2+ `presentedForm` entries**

Query the configured dev FHIR server for an existing `DiagnosticReport` with at least two `presentedForm` entries. If none exists, create one, e.g.:

```bash
curl -X POST "$FHIR_SERVER_URL/4_0_0/DiagnosticReport" \
  -H "Content-Type: application/fhir+json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "resourceType": "DiagnosticReport",
    "status": "final",
    "code": { "text": "Smoke test report" },
    "presentedForm": [
      { "contentType": "text/plain", "data": "UGFnZSBvbmU=", "title": "Page one" },
      { "contentType": "text/plain", "data": "UGFnZSB0d28=", "title": "Page two" }
    ]
  }'
```

- [ ] **Step 3: Verify the bare-array (multi-entry) path in the browser**

1. Open the DiagnosticReport's detail page in the app (`/resources/4_0_0/DiagnosticReport/<id>` or wherever this app's routing surfaces it) and confirm two "View" links appear under "Presented Form", one per entry.
2. Click the first link. Confirm the URL is `.../document-viewer/4_0_0/DiagnosticReport/<id>/0`, the page heading reads `DiagnosticReport/<id> — content 1 of 2`, and only "Page one" is shown/previewed.
3. Click the second link from the DiagnosticReport page. Confirm it isolates "Page two" (`.../1`, `content 2 of 2`).

- [ ] **Step 4: Verify the single-attachment path in the browser**

1. Find or create a `Media` resource with a `content` attachment (single, not an array) on the dev server.
2. Open its detail page, confirm exactly one "View" link appears under "Content" with **no** trailing index in its `href`.
3. Click it, confirm the Document Viewer loads and previews/downloads that one attachment correctly.

- [ ] **Step 5: Regression-check the existing DocumentReference/Binary paths**

1. Open any existing `DocumentReference` with at least one `content` entry and confirm its "View" link still works exactly as before (heading `DocumentReference/<id>`, preview loads).
2. Open a `Binary` resource directly via `/document-viewer/4_0_0/Binary/<id>` and confirm it still renders (heading `Binary/<id>`, preview loads).

- [ ] **Step 6: Record the result**

If every check in Steps 3–5 passes, note this in the PR description (e.g. "Manually verified DiagnosticReport multi-entry isolation, Media single-attachment preview, and DocumentReference/Binary regressions against `<environment>`"). If anything fails, stop and fix it before opening the PR — do not rely on the automated tests alone, per the rationale above.

---

## Self-Review Notes

- **Spec coverage:** All 6 requested resource-type additions (DiagnosticReport, Media, Patient, Practitioner, RelatedPerson, Consent, Contract) are covered by the `ATTACHMENT_FIELD_BY_RESOURCE_TYPE` config in Task 2 and the `DOCUMENT_VIEWER_RESOURCE_TYPES` allowlist in Task 3. Existing DocumentReference/Binary support is preserved and regression-tested in Task 2 and manually re-verified in Task 4.
- **No generated files touched:** confirmed by tracing `generate_components.py`'s `open(...)` calls during design — it only writes `src/pages/resources/*.tsx`, `src/components/ResourceItem.tsx`, `src/utils/resourceDefinitions.ts`. None of this plan's files fall under those paths.
- **Type consistency:** `TDocumentViewerResourceType` is defined once in Task 1 and consumed by name (not redefined) in Tasks 2 and 3. `ATTACHMENT_FIELD_BY_RESOURCE_TYPE`'s keys use `Record<Exclude<TDocumentViewerResourceType, 'Binary'>, ...>`, so TypeScript itself enforces that every non-Binary supported type has a config entry — omitting one is a compile error, not a silent runtime gap.
