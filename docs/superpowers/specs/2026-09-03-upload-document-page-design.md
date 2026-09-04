# Upload Document Page — DocumentReference/Binary Creation — Design

## Problem

This app is a FHIR resource browser/console: every `pages/resources/*.tsx` page is an
auto-generated read-only viewer, and the only way to *create* a resource today is
`APIConsolePage`'s raw JSON `$merge` console (reached via the pencil "Edit Resource"
icon on `ResourceCard`). There is no guided way to attach a document or photo to a
Patient/Person as test data — a developer or QA engineer who wants a synthetic
DocumentReference has to hand-author the JSON (including base64-encoding a file
themselves) in that console.

## Goal

A dedicated **Upload Document** page that lets an internal user (dev/QA) pick a file
for an existing Patient or Person and creates a `Binary` + `DocumentReference` pair for
it, without hand-writing FHIR JSON or base64-encoding anything by hand.

## Non-goals

- Not a member/patient-facing upload feature — this is an internal test-data tool,
  consistent with this app's existing role as a FHIR console (matches the audience of
  `create-hedis-test-data`/`create-uscore-test-data`-style tooling elsewhere in this
  org, not a production member journey).
- No manual subject entry/search — the page is only reachable contextually from an
  existing Patient/Person's `ResourceCard`, which supplies the subject.
- No `DocumentReference.type`/`category` picker — kept to file + optional description
  to avoid introducing a CodeableConcept-picker UI for a field that isn't load-bearing
  for test data. Can be added later if a real need shows up.
- No automatic rollback (deleting the Binary) if the DocumentReference write fails
  after the Binary write succeeds — low-stakes internal tool; an orphaned Binary is
  cheap to find and delete manually via the existing Edit/$merge flow.
- Inline `content.attachment.data` (skipping the Binary resource) was considered and
  rejected: real documents in this system are DocumentReference+Binary pairs, and test
  data created here should mirror that shape rather than diverge from it.

## Existing precedent

- `ResourceCard.tsx` already gates header-action links by resource type
  (`getIPSLink`, `getCompositionIndexLink`, `getCompositionSummaryLink`, the "Edit
  Resource" pencil) using a `summaryResourceTypes = ['Patient', 'Person']`-style list.
  The new "Upload Document" link follows the identical pattern and list.
- Subject/compartment references for a `Person` are built as `Patient/person.<uuid>`
  and for a `Patient` as `Patient/<uuid>` — this exact construction appears three times
  already (`getIPSLink`, `getCompositionIndexLink`, `ReverseReference.tsx`). The new
  page reuses it rather than re-deriving it.
- `FhirApi.mergeResource({ resourceType, id, resource })` (`POST
  /4_0_0/{resourceType}/{id}/$merge`) already exists in `src/api/fhirApi.ts` and is the
  upsert-by-client-id primitive this design needs — it currently has no callers, so
  this page is its first consumer.
- `DocumentViewer`/`AttachmentPreview` (see
  `2026-08-12-document-viewer-and-encounter-links-design.md`) already renders both
  `attachment.url` (`Binary/{id}`) and `attachment.data` (inline) content, so the
  created DocumentReference is immediately viewable through the existing viewer with no
  changes needed there.
- Route shape follows `/document-viewer/4_0_0/:resourceType/:id?/:operation?/*` —
  the new route is `/document-upload/4_0_0/:resourceType/:id`.

## Design

### 1. Entry point (`ResourceCard.tsx`)

A new header-action link, gated on `resource.resourceType` being `Patient` or
`Person` (same list used for the IPS/Composition links), styled like
`getResourceLinkAction` (icon + label + external-link glyph). It routes to:

```
/document-upload/4_0_0/${resourceType}/${uuid}
```

### 2. `UploadDocumentPage` (`src/pages/UploadDocumentPage.tsx`, new)

Standard `Header`/`Footer` page shell. Reads `resourceType`/`id` via `useParams()` and
computes:

```ts
const subjectReference = `Patient/${resourceType === 'Person' ? 'person.' : ''}${id}`;
```

displayed read-only (e.g. "Uploading for: Patient/person.abc123").

Form fields:

- File picker: MUI `Button` wrapping a hidden `<input type="file"
  accept=".pdf,.jpg,.jpeg,.png,.heic,.txt,.json,.xml" />`.
- Optional `description` text field (`DocumentReference.description`).
- Submit button, disabled while a file is invalid or a request is in flight.

### 3. Content-type resolution and validation (`src/utils/uploadDocument.utils.ts`, new)

Browser-reported `file.type` is not trusted — it's frequently empty or wrong for HEIC,
and inconsistent across OS file associations for `txt`/`json`/`xml`. Content type is
instead resolved from the file's extension via a fixed lookup table, which is also the
single source of truth for the accepted-extensions allow-list:

```ts
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  txt: 'text/plain',
  json: 'application/json',
  xml: 'application/xml',
};
```

Validation, run client-side before any network call:

1. Extract the extension from `file.name`, lower-cased; reject (inline `Alert`, no
   request sent) if it's not a key in `EXTENSION_CONTENT_TYPES`.
2. Reject if `file.size` exceeds a 10 MB cap (inline `Alert`).

The resolved `contentType` from step 1 is used everywhere downstream — both
`Binary.contentType` and `DocumentReference.content[0].attachment.contentType` — so the
two resources always agree with each other and with the allow-list, regardless of what
the browser reported.

### 4. Write sequence

Sequential, not parallel: the DocumentReference must reference the Binary's id, so the
Binary write must complete before the DocumentReference write is attempted.

1. Convert the file to base64 via `FileReader.readAsDataURL(file)`, then strip the
   `data:<mime>;base64,` prefix (FHIR's `Binary.data` is a `base64Binary`, not a data
   URL).
2. `binaryId = crypto.randomUUID()`.
3. `fhirApi.mergeResource({ resourceType: 'Binary', id: binaryId, resource: { resourceType: 'Binary', id: binaryId, contentType, data } })`.
4. On success: `docRefId = crypto.randomUUID()`.
5. `fhirApi.mergeResource({ resourceType: 'DocumentReference', id: docRefId, resource: { resourceType: 'DocumentReference', id: docRefId, status: 'current', subject: { reference: subjectReference }, date: new Date().toISOString(), description, content: [{ attachment: { contentType, url: `Binary/${binaryId}`, title: file.name } }] } })`.
6. On success, navigate to `/4_0_0/DocumentReference/${docRefId}` — the existing
   generated `DocumentReference.tsx` page renders it immediately.

### 5. Error handling

- Client-side validation failures (bad extension, oversized file): inline `Alert`,
  no request sent.
- Binary write failure: surface the FHIR error (status + response body, matching how
  `IndexPage`/`APIConsolePage` already surface `{status, json}` from `FhirApi`); stop —
  no DocumentReference attempt.
- DocumentReference write failure after the Binary write succeeded: surface the error
  plus a link to the orphaned `Binary/${binaryId}` so it can be inspected/deleted
  manually via the existing Edit/$merge flow. No automatic rollback (see Non-goals).

### 6. Route registration (`src/routes/fhirRoutes.tsx`)

```tsx
const UploadDocumentPage = lazy(() => import('../pages/UploadDocumentPage'));
// ...
<Route
    key="documentUpload"
    path="/document-upload/4_0_0/:resourceType/:id"
    element={<UploadDocumentPage />}
/>,
```

## Testing

Unit tests (React Testing Library, matching `DocumentViewerLink.test.tsx`
conventions):

- Extension/size validation rejects disallowed extensions and oversized files without
  calling `FhirApi`.
- Happy path: mocked `FhirApi.mergeResource` is called twice with the expected
  `Binary` then `DocumentReference` payloads (including matching `contentType` on
  both), and the page navigates to the new DocumentReference on success.
- Binary-write failure stops before any DocumentReference call and surfaces the error.
- DocumentReference-write failure (after Binary success) surfaces the error and the
  orphaned-Binary link.

No new Karate/e2e coverage — this is a UI-only internal tool, not a CQL/task workflow,
so it's out of scope for that suite.
