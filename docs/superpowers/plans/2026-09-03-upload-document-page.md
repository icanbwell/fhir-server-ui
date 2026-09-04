# Upload Document Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Upload Document" page that lets a dev/QA user attach a file to an existing Patient or Person by creating a `Binary` + `DocumentReference` resource pair, reachable via a new action link on that Patient/Person's `ResourceCard`.

**Architecture:** A new standalone page (`UploadDocumentPage`) reads the subject (Patient/Person `resourceType`+`id`) from its route, validates a user-picked file against a fixed extension allow-list, base64-encodes it client-side, and writes it via two sequential `FhirApi.mergeResource` calls (`Binary` then `DocumentReference`, the latter referencing the former by `Binary/{id}`). A new action link on `ResourceCard` (gated the same way the existing IPS/Composition links are) is the only entry point.

**Tech Stack:** React + TypeScript, MUI, `react-router`, `vitest` + `@testing-library/react`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-03-upload-document-page-design.md`

## Global Constraints

- Accepted file extensions: `pdf`, `jpg`, `jpeg`, `png`, `heic`, `txt`, `json`, `xml`. Content type is resolved from the extension via a fixed lookup table — `file.type` (browser-reported MIME) is never trusted or used.
- Max upload size: 10 MB (`10 * 1024 * 1024` bytes).
- The upload link on `ResourceCard` only appears for `resourceType` `Patient` or `Person` (the existing `summaryResourceTypes` list).
- Subject reference format: `Patient/{id}` for a `Patient`, `Patient/person.{id}` for a `Person`.
- Route: `/document-upload/4_0_0/:resourceType/:id`.
- Sequential writes only (Binary must succeed before DocumentReference is attempted). No automatic rollback of the Binary if the DocumentReference write fails — surface the orphaned Binary as a link instead.
- No `DocumentReference.type`/`category` field. No manual subject entry.

---

### Task 1: Upload validation/encoding utilities

**Files:**
- Create: `src/utils/uploadDocument.utils.ts`
- Test: `src/utils/uploadDocument.utils.test.ts`

**Interfaces:**
- Produces (used by Task 2):
  - `ACCEPTED_UPLOAD_ACCEPT_ATTR: string` — comma-joined `.ext` list for an `<input accept>` attribute.
  - `MAX_UPLOAD_SIZE_BYTES: number`
  - `type ValidateUploadFileResult = { contentType: string } | { error: string }`
  - `validateUploadFile(file: { name: string; size: number }): ValidateUploadFileResult`
  - `fileToBase64(file: File): Promise<string>`
  - `buildSubjectReference(args: { resourceType: string; id: string }): string`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/uploadDocument.utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
    ACCEPTED_UPLOAD_ACCEPT_ATTR,
    MAX_UPLOAD_SIZE_BYTES,
    buildSubjectReference,
    fileToBase64,
    validateUploadFile,
} from './uploadDocument.utils';

describe('validateUploadFile', () => {
    it('accepts a supported extension and returns its content type', () => {
        expect(validateUploadFile({ name: 'scan.pdf', size: 1024 })).toEqual({ contentType: 'application/pdf' });
    });

    it('is case-insensitive on extension', () => {
        expect(validateUploadFile({ name: 'PHOTO.JPG', size: 1024 })).toEqual({ contentType: 'image/jpeg' });
    });

    it('rejects an unsupported extension', () => {
        const result = validateUploadFile({ name: 'archive.zip', size: 1024 });
        expect('error' in result).toBe(true);
    });

    it('rejects a file with no extension', () => {
        const result = validateUploadFile({ name: 'noext', size: 1024 });
        expect('error' in result).toBe(true);
    });

    it('rejects a file over the size cap', () => {
        const result = validateUploadFile({ name: 'big.pdf', size: MAX_UPLOAD_SIZE_BYTES + 1 });
        expect('error' in result).toBe(true);
    });

    it('accepts a file exactly at the size cap', () => {
        expect(validateUploadFile({ name: 'exact.pdf', size: MAX_UPLOAD_SIZE_BYTES })).toEqual({
            contentType: 'application/pdf',
        });
    });
});

describe('ACCEPTED_UPLOAD_ACCEPT_ATTR', () => {
    it('lists every accepted extension for the file input accept attribute', () => {
        expect(ACCEPTED_UPLOAD_ACCEPT_ATTR).toBe('.pdf,.jpg,.jpeg,.png,.heic,.txt,.json,.xml');
    });
});

describe('fileToBase64', () => {
    it('resolves to the base64 payload without the data-URL prefix', async () => {
        const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        await expect(fileToBase64(file)).resolves.toBe('aGVsbG8=');
    });
});

describe('buildSubjectReference', () => {
    it('builds a plain Patient reference for a Patient resourceType', () => {
        expect(buildSubjectReference({ resourceType: 'Patient', id: 'abc123' })).toBe('Patient/abc123');
    });

    it('builds a person-compartment Patient reference for a Person resourceType', () => {
        expect(buildSubjectReference({ resourceType: 'Person', id: 'abc123' })).toBe('Patient/person.abc123');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn vitest run src/utils/uploadDocument.utils.test.ts`
Expected: FAIL — `src/utils/uploadDocument.utils.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `src/utils/uploadDocument.utils.ts`:

```ts
export const ACCEPTED_UPLOAD_EXTENSIONS: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    heic: 'image/heic',
    txt: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
};

export const ACCEPTED_UPLOAD_ACCEPT_ATTR = Object.keys(ACCEPTED_UPLOAD_EXTENSIONS)
    .map((ext) => `.${ext}`)
    .join(',');

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export type ValidateUploadFileResult = { contentType: string } | { error: string };

// file.type (the browser-reported MIME type) is deliberately never consulted here — it's
// frequently empty for HEIC and inconsistent across OS file associations for txt/json/xml.
// The file extension is the only source of truth for both the allow-list and the resolved
// contentType, so Binary.contentType and DocumentReference.content[0].attachment.contentType
// always agree with each other and with what was actually validated.
export function validateUploadFile(file: { name: string; size: number }): ValidateUploadFileResult {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const contentType = extension ? ACCEPTED_UPLOAD_EXTENSIONS[extension] : undefined;
    if (!contentType) {
        return {
            error: `Unsupported file type. Accepted extensions: ${Object.keys(ACCEPTED_UPLOAD_EXTENSIONS).join(', ')}.`,
        };
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return { error: `File is too large. Maximum size is ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)} MB.` };
    }
    return { contentType };
}

// FHIR's Binary.data is a base64Binary, not a data URL — the "data:<mime>;base64," prefix
// FileReader.readAsDataURL produces has to be stripped before the result can be sent to the
// FHIR server.
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const commaIndex = result.indexOf(',');
            resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1));
        };
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export function buildSubjectReference({ resourceType, id }: { resourceType: string; id: string }): string {
    return `Patient/${resourceType === 'Person' ? 'person.' : ''}${id}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn vitest run src/utils/uploadDocument.utils.test.ts`
Expected: PASS (all cases)

- [ ] **Step 5: Commit**

```bash
git add src/utils/uploadDocument.utils.ts src/utils/uploadDocument.utils.test.ts
git commit -m "PHR-3476 Add upload document validation/encoding utils"
```

---

### Task 2: `UploadDocumentPage`

**Files:**
- Create: `src/pages/UploadDocumentPage.tsx`
- Test: `src/pages/UploadDocumentPage.test.tsx`

**Interfaces:**
- Consumes (from Task 1): `ACCEPTED_UPLOAD_ACCEPT_ATTR`, `validateUploadFile`, `fileToBase64`, `buildSubjectReference` — exact signatures above.
- Consumes (existing): `FhirApi.mergeResource({ resourceType, id, resource }): Promise<{ status: number | undefined; json: any; incomplete: boolean }>` (`src/api/fhirApi.ts`); `EnvContext` (`{ fhirUrl }`, `src/context/EnvironmentContext.ts`); `UserContext` (`{ setUserDetails }`, `src/context/UserContext.ts`); `Header`/`Footer` (`src/components/Header.tsx`, `src/components/Footer.tsx`, no required props).
- Produces (used by Task 3): default-exported React component `UploadDocumentPage`, reading route params `resourceType`/`id`.

- [ ] **Step 1: Write the failing tests**

Create `src/pages/UploadDocumentPage.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FhirApi from '../api/fhirApi';
import UploadDocumentPage from './UploadDocumentPage';

const renderPage = (initialPath = '/document-upload/4_0_0/Patient/pat-1') =>
    render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/document-upload/4_0_0/:resourceType/:id" element={<UploadDocumentPage />} />
                <Route path="/4_0_0/:resourceType/:id" element={<div>Viewing resource</div>} />
            </Routes>
        </MemoryRouter>
    );

const pdfFile = () => new File(['%PDF-1.4'], 'note.pdf', { type: 'application/pdf' });

describe('UploadDocumentPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the subject reference resolved from the route, including the Person compartment prefix', () => {
        renderPage('/document-upload/4_0_0/Person/per-1');
        expect(screen.getByText(/Patient\/person\.per-1/)).toBeInTheDocument();
    });

    it('rejects an unsupported file without calling mergeResource', () => {
        const mergeResource = vi.spyOn(FhirApi.prototype, 'mergeResource');
        renderPage();

        const input = screen.getByTestId('upload-document-file-input');
        fireEvent.change(input, { target: { files: [new File(['x'], 'bad.zip', { type: 'application/zip' })] } });

        expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
        expect(mergeResource).not.toHaveBeenCalled();
    });

    it('creates a Binary then a DocumentReference and navigates to the new DocumentReference on success', async () => {
        const mergeResource = vi
            .spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({ status: 200, json: { resourceType: 'Binary' }, incomplete: false })
            .mockResolvedValueOnce({ status: 200, json: { resourceType: 'DocumentReference' }, incomplete: false });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        await waitFor(() => expect(screen.getByText('Viewing resource')).toBeInTheDocument());

        expect(mergeResource).toHaveBeenCalledTimes(2);

        const [binaryCall, docRefCall] = mergeResource.mock.calls;
        expect(binaryCall[0]).toMatchObject({
            resourceType: 'Binary',
            resource: { resourceType: 'Binary', contentType: 'application/pdf' },
        });
        const binaryId = binaryCall[0].id;
        expect(binaryCall[0].resource).toMatchObject({ id: binaryId, data: expect.any(String) });

        expect(docRefCall[0]).toMatchObject({
            resourceType: 'DocumentReference',
            resource: {
                resourceType: 'DocumentReference',
                status: 'current',
                subject: { reference: 'Patient/pat-1' },
                content: [
                    {
                        attachment: {
                            contentType: 'application/pdf',
                            url: `Binary/${binaryId}`,
                            title: 'note.pdf',
                        },
                    },
                ],
            },
        });
    });

    it('stops before creating a DocumentReference if the Binary write fails', async () => {
        const mergeResource = vi
            .spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({ status: 500, json: { error: 'boom' }, incomplete: false });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        expect(await screen.findByText(/failed to create binary/i)).toBeInTheDocument();
        expect(mergeResource).toHaveBeenCalledTimes(1);
    });

    it('surfaces the orphaned Binary link if the DocumentReference write fails after the Binary succeeds', async () => {
        vi.spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({ status: 200, json: { resourceType: 'Binary' }, incomplete: false })
            .mockResolvedValueOnce({ status: 500, json: { error: 'boom' }, incomplete: false });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        expect(await screen.findByText(/failed to create documentreference/i)).toBeInTheDocument();
        const binaryLink = screen.getByRole('link', { name: /binary\//i });
        expect(binaryLink.getAttribute('href')).toMatch(/^\/4_0_0\/Binary\//);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn vitest run src/pages/UploadDocumentPage.test.tsx`
Expected: FAIL — `src/pages/UploadDocumentPage.tsx` does not exist yet.

- [ ] **Step 3: Write the implementation**

Create `src/pages/UploadDocumentPage.tsx`:

```tsx
import React, { useContext, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FhirApi from '../api/fhirApi';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import {
    ACCEPTED_UPLOAD_ACCEPT_ATTR,
    buildSubjectReference,
    fileToBase64,
    validateUploadFile,
} from '../utils/uploadDocument.utils';

type TSelectedFile = {
    file: File;
    contentType: string;
};

const UploadDocumentPage = (): React.ReactElement => {
    const { resourceType = '', id = '' } = useParams<{ resourceType: string; id: string }>();
    const { fhirUrl } = useContext(EnvContext);
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState<TSelectedFile | undefined>();
    const [description, setDescription] = useState('');
    const [validationError, setValidationError] = useState<string | undefined>();
    const [submitError, setSubmitError] = useState<React.ReactNode | undefined>();
    const [submitting, setSubmitting] = useState(false);

    const subjectReference = buildSubjectReference({ resourceType, id });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }
        const result = validateUploadFile(file);
        if ('error' in result) {
            setSelectedFile(undefined);
            setValidationError(result.error);
            return;
        }
        setValidationError(undefined);
        setSubmitError(undefined);
        setSelectedFile({ file, contentType: result.contentType });
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            return;
        }
        setSubmitting(true);
        setSubmitError(undefined);
        try {
            const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
            const data = await fileToBase64(selectedFile.file);
            const binaryId = crypto.randomUUID();
            const binaryResult = await fhirApi.mergeResource({
                resourceType: 'Binary',
                id: binaryId,
                resource: {
                    resourceType: 'Binary',
                    id: binaryId,
                    contentType: selectedFile.contentType,
                    data,
                },
            });
            if (!binaryResult.status || binaryResult.status < 200 || binaryResult.status >= 300) {
                setSubmitError(
                    `Failed to create Binary resource (status ${binaryResult.status ?? 'unknown'}): ${JSON.stringify(
                        binaryResult.json
                    )}`
                );
                return;
            }

            const docRefId = crypto.randomUUID();
            const docRefResult = await fhirApi.mergeResource({
                resourceType: 'DocumentReference',
                id: docRefId,
                resource: {
                    resourceType: 'DocumentReference',
                    id: docRefId,
                    status: 'current',
                    subject: { reference: subjectReference },
                    date: new Date().toISOString(),
                    description: description || undefined,
                    content: [
                        {
                            attachment: {
                                contentType: selectedFile.contentType,
                                url: `Binary/${binaryId}`,
                                title: selectedFile.file.name,
                            },
                        },
                    ],
                },
            });
            if (!docRefResult.status || docRefResult.status < 200 || docRefResult.status >= 300) {
                setSubmitError(
                    <>
                        Failed to create DocumentReference (status {docRefResult.status ?? 'unknown'}):{' '}
                        {JSON.stringify(docRefResult.json)}. The Binary resource was created and is not
                        automatically cleaned up —{' '}
                        <RouterLink to={`/4_0_0/Binary/${binaryId}`}>view/delete Binary/{binaryId}</RouterLink>.
                    </>
                );
                return;
            }

            navigate(`/4_0_0/DocumentReference/${docRefId}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2, maxWidth: 640 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Upload Document
                    </Typography>
                    <Typography sx={{ mb: 2 }}>Uploading for: {subjectReference}</Typography>

                    {validationError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {validationError}
                        </Alert>
                    )}
                    {submitError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {submitError}
                        </Alert>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <Button variant="outlined" component="label">
                            {selectedFile ? selectedFile.file.name : 'Choose File'}
                            <input
                                type="file"
                                hidden
                                accept={ACCEPTED_UPLOAD_ACCEPT_ATTR}
                                data-testid="upload-document-file-input"
                                onChange={handleFileChange}
                            />
                        </Button>
                    </Box>

                    <TextField
                        label="Description"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <Button variant="contained" disabled={!selectedFile || submitting} onClick={handleSubmit}>
                        {submitting ? 'Uploading…' : 'Upload'}
                    </Button>
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default UploadDocumentPage;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn vitest run src/pages/UploadDocumentPage.test.tsx`
Expected: PASS (all cases)

- [ ] **Step 5: Commit**

```bash
git add src/pages/UploadDocumentPage.tsx src/pages/UploadDocumentPage.test.tsx
git commit -m "PHR-3476 Add UploadDocumentPage"
```

---

### Task 3: Route registration

**Files:**
- Modify: `src/routes/fhirRoutes.tsx`

**Interfaces:**
- Consumes (from Task 2): default export `UploadDocumentPage` from `../pages/UploadDocumentPage`.
- Produces (used by Task 4): the route `/document-upload/4_0_0/:resourceType/:id` is live in the app.

No new automated test — this is router wiring around an already-tested page component, matching how `DocumentViewerPage`'s routes were added in this same file with no dedicated route test.

- [ ] **Step 1: Add the lazy import and route**

In `src/routes/fhirRoutes.tsx`, add the import alongside the other lazy page imports:

```tsx
const DocumentViewerPage = lazy(() => import('../pages/DocumentViewerPage'));
const UploadDocumentPage = lazy(() => import('../pages/UploadDocumentPage'));
const APIConsolePage = lazy(() => import('../pages/APIConsolePage'));
```

Add the route to the exported array, after the `documentViewerOperation` route:

```tsx
    <Route
        key="documentViewerOperation"
        path="/document-viewer/4_0_0/:resourceType/:operation?/*"
        element={<DocumentViewerPage />}
    />,
    <Route
        key="documentUpload"
        path="/document-upload/4_0_0/:resourceType/:id"
        element={<UploadDocumentPage />}
    />,
];
```

- [ ] **Step 2: Typecheck and build**

Run: `yarn tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/fhirRoutes.tsx
git commit -m "PHR-3476 Register /document-upload route"
```

---

### Task 4: `ResourceCard` "Upload Document" action link

**Files:**
- Modify: `src/components/ResourceCard.tsx`
- Create: `src/components/ResourceCard.test.tsx`

**Interfaces:**
- Consumes (existing, unchanged): `getResourceLinkAction({ to, label, tooltip })` (defined at the top of `ResourceCard.tsx`, returns a `Tooltip`-wrapped `Link`); `summaryResourceTypes = ['Patient', 'Person']` (defined inside the `ResourceCard` component body).
- Consumes (from Task 3): the live `/document-upload/4_0_0/:resourceType/:id` route.

- [ ] **Step 1: Write the failing tests**

Create `src/components/ResourceCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import ResourceCard from './ResourceCard';
import { TResource } from '../types/resources/Resource';

const resource = (resourceType: string, id: string) =>
    ({ resourceType, id }) as unknown as TResource;

describe('ResourceCard upload document link', () => {
    it('links to the upload page for a Patient resource', () => {
        render(
            <MemoryRouter>
                <ResourceCard index={0} resource={resource('Patient', 'pat-1')} expanded={false} />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /upload document/i })).toHaveAttribute(
            'href',
            '/document-upload/4_0_0/Patient/pat-1'
        );
    });

    it('links to the person-compartment upload page for a Person resource', () => {
        render(
            <MemoryRouter>
                <ResourceCard index={0} resource={resource('Person', 'per-1')} expanded={false} />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /upload document/i })).toHaveAttribute(
            'href',
            '/document-upload/4_0_0/Person/per-1'
        );
    });

    it('does not show the upload link for other resource types', () => {
        render(
            <MemoryRouter>
                <ResourceCard index={0} resource={resource('Observation', 'obs-1')} expanded={false} />
            </MemoryRouter>
        );

        expect(screen.queryByRole('link', { name: /upload document/i })).not.toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn vitest run src/components/ResourceCard.test.tsx`
Expected: FAIL — no "Upload Document" link exists yet.

- [ ] **Step 3: Add the link helper and render it**

In `src/components/ResourceCard.tsx`, add a new helper next to `getCompositionIndexLink` (which ends around line 87):

```tsx
const getUploadDocumentLink = ({ resource, uuid }: TGetIPSLinkProps) =>
    getResourceLinkAction({
        to: `/document-upload/4_0_0/${resource.resourceType}/${uuid}`,
        label: 'Upload Document',
        tooltip: 'Upload a document or photo for this patient',
    });
```

In the `CardHeader`'s `action` box (the block that currently reads, in order: Edit Resource icon, IPS link, Composition Index link, Composition Summary link, Open/Close button), add the new link right after the Composition Index link and before the Composition Summary link:

```tsx
                        {resource.resourceType &&
                            summaryResourceTypes.includes(resource.resourceType.toString()) &&
                            getCompositionIndexLink({ resource, uuid: uuid?.toString() })}
                        {resource.resourceType &&
                            summaryResourceTypes.includes(resource.resourceType.toString()) &&
                            getUploadDocumentLink({ resource, uuid: uuid?.toString() })}
                        {resource.resourceType &&
                            compositionSummaryResourceTypes.includes(resource.resourceType.toString()) &&
                            getCompositionSummaryLink({ uuid: uuid?.toString() })}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn vitest run src/components/ResourceCard.test.tsx`
Expected: PASS (all cases)

- [ ] **Step 5: Run the full test suite**

Run: `yarn vitest run`
Expected: PASS — no regressions in `ResourceList`/`ResourceCard` consumers.

- [ ] **Step 6: Commit**

```bash
git add src/components/ResourceCard.tsx src/components/ResourceCard.test.tsx
git commit -m "PHR-3476 Add Upload Document link to ResourceCard"
```

---

## Manual verification (after all tasks)

1. `yarn dev` (or the project's usual local-run command), log in against `dev`.
2. Navigate to any existing `Patient` (e.g. `/4_0_0/Patient/<id>`), expand its card, click "Upload Document".
3. Confirm the page shows `Uploading for: Patient/<id>`.
4. Pick a small PDF or PNG, submit, confirm it lands on `/4_0_0/DocumentReference/<new-id>` and the created `DocumentReference` and `Binary` resources are both visible/fetchable.
5. Repeat once starting from a `Person` resource and confirm the subject reads `Patient/person.<id>`.
6. Try an unsupported extension (e.g. `.docx`) and confirm it's rejected client-side with no network call (check the Network tab).
