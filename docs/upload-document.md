# Upload Document

How this app lets a developer/QA user create a `DocumentReference` for an
existing `Patient` or `Person`, from a file picked in the browser — without
hand-authoring FHIR JSON or base64-encoding anything by hand. Written so a
different project can reimplement the same approach against its own FHIR
server.

This is an **internal test-data tool**, not a member-facing upload feature:
it's reachable only from this app's FHIR resource console (the "Upload
Document" link on a `Patient`/`Person` card), and it exists so a dev/QA
person can attach realistic-shaped document data to a patient in dev/staging
without leaving the browser.

Design background (this repo): `docs/superpowers/specs/2026-09-03-upload-document-page-design.md`.
Implementation plan: `docs/superpowers/plans/2026-09-03-upload-document-page.md`.

## The problem this solves

FHIR can represent an uploaded file's bytes two ways: as a separate `Binary`
resource referenced by `content[].attachment.url`, or inlined directly on the
`DocumentReference` as `content[].attachment.data` (base64). This feature
uses the **inline** form — a single resource holds both the clinical
metadata (who it's about, what kind of document, when) and the base64
payload, which avoids the two-resource orphan/ordering problems a `Binary` +
`DocumentReference` pair introduces (see "Why inline instead of a separate
Binary" below).

Producing this resource by hand (in a raw JSON API console, say) means the
author has to: pick a client-side-generated id, base64-encode the file
themselves, and know which security tags the server expects on write.
Getting any one of those wrong produces a resource that silently doesn't
behave like a real one (invisible to reads, or rejected outright). This
feature automates all of that behind a file picker.

## Architecture overview

```
Patient/Person resource card
  └─ "Upload Document" link  →  opens a dedicated upload page
                                    └─ validate the picked file (extension + size)
                                    └─ base64-encode it client-side
                                    └─ POST a DocumentReference ($merge, client-generated id)
                                       with the file inlined as content[0].attachment.data
                                    └─ navigate to the new DocumentReference
```

Concretely, in this repo (React 19 + MUI + Vite):

| Concern | File |
|---|---|
| Route registration | `src/routes/fhirRoutes.tsx` |
| Entry point — action link on the Patient/Person card | `src/components/ResourceCard.tsx` (`getUploadDocumentLink`) |
| Page — file picker, validation UI, write orchestration | `src/pages/UploadDocumentPage.tsx` |
| Validation, base64 encoding, subject-reference construction | `src/utils/uploadDocument.utils.ts` |
| Security tag system constants | `src/utils/securityTagSystem.ts` |
| FHIR write primitive (`POST /{resourceType}/{id}/$merge`) | `src/api/fhirApi.ts` (`mergeResource`) |

There's deliberately **no separate "create resource" framework** here — this
is a single-purpose page for one resource, not a generic any-resource-type
creation UI. This repo already has a raw-JSON `$merge` console for that (the
"Edit Resource" pencil icon on every resource card); this page exists
specifically to remove the base64-encoding and security-tagging tedium for
the one resource developers actually need test data for often.

## Step 1 — Entry point and subject resolution

The upload page is only ever reached from an existing `Patient` or `Person`
resource's card, via a link built the same way this app's other
resource-scoped links (IPS, Composition Index) already are:

```
/document-upload/4_0_0/{resourceType}/{uuid}
```

There is **no manual subject picker** — the subject is entirely derived from
the route, and the page renders read-only "Uploading for: {subjectReference}"
text. If a URL is typed by hand with an unsupported `resourceType` (anything
other than `Patient`/`Person`), the page shows an error instead of a form —
worth guarding explicitly if your app's routes are typeable/shareable, since
a naive implementation would happily build a `DocumentReference.subject`
pointing at a resource type that was never validated to exist.

A `Person`'s compartment reference isn't just `Patient/{id}` — this
repo's FHIR server addresses a Person's patient compartment as
`Patient/person.{id}`. If your server has an equivalent client-vs-source
patient distinction, centralize that mapping in one function (here,
`buildSubjectReference`) rather than re-deriving it at each call site — this
repo already had the same `person.` prefix logic duplicated in three other
places before this feature added a fourth; consolidating that is a known,
deferred follow-up.

## Step 2 — Client-side file validation

Two checks run **before any network call**, both driven by a single
extension→MIME lookup table:

1. **Extension allow-list.** Only `pdf`, `jpg`, `jpeg`, `png`, `heic`, `txt`,
   `json`, `xml` are accepted.
2. **Size cap.** 10 MB, checked against the raw file size (not the ~33%
   larger base64-encoded size the server will actually receive — budget
   accordingly if your server enforces its own request-body ceiling; since
   the payload is now inlined directly on the `DocumentReference`, this cap
   also bounds how large a single FHIR resource this page can produce).

The one gotcha worth calling out: **don't trust the browser's reported MIME
type (`File.type`) for the content type you persist.** It's frequently empty
for HEIC in Chrome/Firefox (they don't natively decode it), and inconsistent
across OS file-association settings for `txt`/`json`/`xml`. Resolve the
content type from the file's **extension** via a fixed table instead:

```ts
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', heic: 'image/heic', txt: 'text/plain',
  json: 'application/json', xml: 'application/xml',
};
```

A second, easy-to-miss gotcha: don't index that lookup table with the raw
extension string via plain bracket access (`table[extension]`). A file named
`resume.constructor` or `photo.toString` resolves to an **inherited
`Object.prototype` property** (truthy, non-string) instead of `undefined`,
silently bypassing the "unsupported extension" rejection. Guard with
`Object.prototype.hasOwnProperty.call(table, extension)` before indexing, or
use a `Map`/`Object.create(null)` instead of a plain object literal.

## Step 3 — Base64-encode the file

```ts
function fileToBase64(file: File): Promise<string> {
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
```

`FileReader.readAsDataURL` produces a `data:<mime>;base64,<payload>` string —
FHIR's `Attachment.data` is typed `base64Binary`, so the `data:...;base64,`
prefix has to be stripped before the value is usable.

## Step 4 — Write a single DocumentReference with the file inlined

The write is a single `POST /DocumentReference/{id}/$merge` with a
**client-generated UUID** as the resource id (an upsert-by-id call, not a
server-assigned-id `POST`). The base64 payload goes directly on
`content[0].attachment.data`, alongside the resolved `contentType`, the
original filename as `title`, and the raw (pre-base64) byte count as `size`:

```ts
{
  resourceType: 'DocumentReference',
  id: docRefId,
  status: 'current',
  subject: { reference: subjectReference },
  content: [{
    attachment: { contentType, data, size: file.size, title: file.name },
  }],
}
```

Navigate to `/4_0_0/DocumentReference/{docRefId}` on success.

**A 2xx HTTP status is not sufficient evidence of success.** Some FHIR
`$merge`-style operations return `200 OK` with an `OperationOutcome` body (or
a top-level `issue` array) describing a resource-level rejection, or a
`MergeResultEntry` body (`{ created: false, updated: false, issue: {...} }`)
with the merged resource's own `resourceType` rather than
`'OperationOutcome'` — treating any 2xx as success would silently navigate to
a `DocumentReference` that was never actually created. Check the response
body shape in addition to the status (see `extractMergeFailureMessage` in
`src/utils/uploadDocument.utils.ts`), and treat a response the network layer
marks `incomplete` (connection dropped mid-response) as a failure too.

### Why inline instead of a separate Binary

An earlier version of this page created a `Binary` resource (the base64
bytes) and a `DocumentReference` pointing at it via
`content[].attachment.url = Binary/{id}` — two sequential writes. That shape
brought its own class of problem: if the `Binary` write succeeded but the
`DocumentReference` write then failed, there was no way to make the pair
atomic without adding rollback-DELETE complexity, so the fix was to surface
an orphaned-`Binary` link for a human to clean up manually. Inlining the data
directly on the `DocumentReference` removes that failure mode entirely —
there's only one resource, so one write either succeeds or fails, with
nothing left dangling either way. If your use case needs to share one
payload across multiple `DocumentReference`s, or the payload is too large to
comfortably inline in a single resource, a separate `Binary` is still the
right call — this tradeoff only favors inlining for single-owner, size-capped
uploads like this one.

## Step 5 — `meta.security` tagging

This resource needs security tags for the same reason any FHIR write on a
multi-tenant server does — an unwritten `meta.security` either gets rejected
outright or defaults to something that makes the resource invisible to
normal reads. Two distinct concerns apply here, and they compose:

**Ownership (`owner`/`access`/`sourceAssigningAuthority`).** This resource
is created by an internal tool, not received from any specific tenant's
system — so it's tagged as owned by the platform itself, not by whichever
tenant the subject patient happens to belong to:

```json
{ "system": "https://www.icanbwell.com/owner", "code": "bwell" }
```

If your server ties data lifecycle to a tenant's `owner` tag (e.g. "delete
this data if the tenant relationship ends"), decide deliberately whether
tool-generated data should inherit the *subject's* tenant or a fixed
platform value — don't default to copying the subject's tags without
checking whether that's actually the intended lifecycle for this class of
data. In this repo that decision came from prior art already established for
another self-service upload feature in the same system (a "digital wallet"
document-upload flow), not from first principles.

**Patient-scoping the resource holding the actual bytes.** A resource
type carrying non-patient-compartment content can end up readable by anyone
with any valid token if the server can't derive patient-scoping from a
`subject`/`patient` field alone. When this page still split the payload into
a separate `Binary` (which has no `subject` field of its own), that gap was
closed with an extra tag on the `Binary` specifically:

```json
{ "system": "https://www.icanbwell.com/sourcePatientId", "code": "Patient/{subjectId}" }
```

Now that the payload is inlined, this `sourcePatientId` tag moves to the
`DocumentReference` itself, in addition to its own `subject` field — the tag
tracks *which resource holds the actual bytes*, not which resource type is
conventionally patient-scoped, so it follows the payload. If your server has
this same gap, apply the equivalent tag to whichever resource ends up
carrying the sensitive content.

## Testing approach

Structure tests around the same layering as the implementation:

- **Validation/encoding utilities** (pure functions, no React): extension
  allow-list acceptance/rejection (including the prototype-pollution-shaped
  filenames above), size-cap boundary, base64 round-trip via a real
  `File`/`FileReader` (not a mock), and the subject-reference construction
  for both `Patient` and `Person`.
- **The page component**: mock only the network seam
  (`FhirApi.prototype.mergeResource`) — not the whole `FhirApi` module, and
  not unrelated shared components (`Header`/`Footer`) unless they genuinely
  throw without a provider your test doesn't set up. Cover: unsupported file
  rejected with zero network calls; happy path calls `mergeResource` exactly
  once with the expected payload (including the inlined `attachment.data`
  and the `meta.security` block) and navigates on success; a bad-status
  response shows an error and does not navigate; a 200-with-`OperationOutcome`
  or 200-with-`MergeResultEntry` response is treated as failure the same as a
  bad status; an incomplete response is treated as failure; an unsupported
  `resourceType` in the route renders an error instead of the form.

This repo's tests, if you want concrete examples:
`src/utils/uploadDocument.utils.test.ts`, `src/pages/UploadDocumentPage.test.tsx`,
`src/components/ResourceCard.test.tsx` (the entry-point link).

## Summary for reimplementers

The portable core, independent of framework/UI library:

1. Gate the entry point on the subject resource types you actually support,
   and validate the route/subject at the top of the page too — don't trust
   that only the intended entry point ever links here.
2. Validate the file (type allow-list + size) before any network call, and
   resolve content type from the file *extension* via a lookup table you
   control — never trust the browser-reported MIME type, and guard the
   lookup against prototype-chain properties if it's a plain object.
3. Base64-encode client-side and strip the data-URL prefix before sending.
4. Prefer inlining the payload on `content[].attachment.data` over a separate
   `Binary` + `url` reference when the payload is single-owner and
   size-capped — it collapses two sequential, partially-failable writes into
   one atomic one. Reach for a separate `Binary` only when the payload needs
   to be shared across multiple documents or is too large to inline
   comfortably. Either way, check the response *body*, not just the HTTP
   status, for resource-level failures.
5. Tag the resource with whatever ownership/access model your server
   requires, and separately check whether the resource type holding the
   actual bytes needs its own patient-scoping tag beyond the general
   ownership tags — a resource with no `subject`/`patient` field of its own
   won't get that scoping for free.
