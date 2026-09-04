# Upload Document

How this app lets a developer/QA user create a `DocumentReference` + `Binary`
resource pair for an existing `Patient` or `Person`, from a file picked in the
browser — without hand-authoring FHIR JSON or base64-encoding anything by
hand. Written so a different project can reimplement the same approach
against its own FHIR server.

This is an **internal test-data tool**, not a member-facing upload feature:
it's reachable only from this app's FHIR resource console (the "Upload
Document" link on a `Patient`/`Person` card), and it exists so a dev/QA
person can attach realistic-shaped document data to a patient in dev/staging
without leaving the browser.

Design background (this repo): `docs/superpowers/specs/2026-09-03-upload-document-page-design.md`.
Implementation plan: `docs/superpowers/plans/2026-09-03-upload-document-page.md`.

## The problem this solves

FHIR represents an uploaded file as **two** resources, not one:

- `Binary` — the actual bytes, base64-encoded, plus a `contentType`.
- `DocumentReference` — the clinical metadata (who it's about, what kind of
  document, when) with `content[].attachment.url` pointing at the `Binary`.

Producing this pair by hand (in a raw JSON API console, say) means the author
has to: pick a client-side-generated id, base64-encode the file themselves,
get the FHIR reference syntax right (`Binary/{id}`), and know which
security tags the server expects on write. Getting any one of those wrong
produces a resource that silently doesn't behave like a real one (invisible
to reads, or rejected outright). This feature automates all of that behind a
file picker.

## Architecture overview

```
Patient/Person resource card
  └─ "Upload Document" link  →  opens a dedicated upload page
                                    └─ validate the picked file (extension + size)
                                    └─ base64-encode it client-side
                                    └─ POST a Binary ($merge, client-generated id)
                                    └─ POST a DocumentReference referencing that Binary
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
is a single-purpose page for one resource pair, not a generic
any-resource-type creation UI. This repo already has a raw-JSON `$merge`
console for that (the "Edit Resource" pencil icon on every resource card);
this page exists specifically to remove the base64-encoding and
security-tagging tedium for the one resource pair developers actually need
test data for often.

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
   accordingly if your server enforces its own request-body ceiling).

The one gotcha worth calling out: **don't trust the browser's reported MIME
type (`File.type`) for the content type you persist.** It's frequently empty
for HEIC in Chrome/Firefox (they don't natively decode it), and inconsistent
across OS file-association settings for `txt`/`json`/`xml`. Resolve the
content type from the file's **extension** via a fixed table instead, and use
that same resolved value everywhere downstream (`Binary.contentType` *and*
`DocumentReference.content[].attachment.contentType`) so the two resources
always agree with each other and with what was actually validated:

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
FHIR's `Binary.data` is typed `base64Binary`, so the `data:...;base64,`
prefix has to be stripped before the value is usable.

## Step 4 — Write Binary, then DocumentReference, in that order

The two writes are **sequential, not parallel**, and each is a
`POST /{resourceType}/{id}/$merge` with a **client-generated UUID** as the
resource id (an upsert-by-id call, not a server-assigned-id `POST`):

1. Generate `binaryId`; create the `Binary` with the base64 payload and
   resolved `contentType`.
2. Only if that succeeds: generate `docRefId`; create the `DocumentReference`
   with `subject.reference` = the resolved subject reference, and
   `content[0].attachment.url` = `Binary/{binaryId}`.
3. Navigate to `/4_0_0/DocumentReference/{docRefId}` on success.

**A 2xx HTTP status is not sufficient evidence of success.** Some FHIR
`$merge`-style operations return `200 OK` with an `OperationOutcome` body (or
a top-level `issue` array) describing a resource-level rejection — treating
any 2xx as success would silently navigate to a `DocumentReference` that was
never actually created. Check the response body shape in addition to the
status:

```ts
if (json?.resourceType === 'OperationOutcome' || Array.isArray(json?.issue)) {
  // treat as failure even though status was 2xx
}
```

If the `Binary` write fails, stop — never attempt the `DocumentReference`
write with a dangling reference. If the `Binary` succeeds but the
`DocumentReference` write fails, there is now an orphaned `Binary` with no
referencing document; this implementation deliberately does **not**
auto-delete it (a rollback DELETE call adds real complexity for a rare,
low-stakes failure mode in an internal tool) — instead it surfaces a direct
link to the orphaned resource so a human can clean it up manually.

## Step 5 — `meta.security` tagging

Both new resources need security tags for the same reason any FHIR write on
a multi-tenant server does — an unwritten `meta.security` either gets
rejected outright or defaults to something that makes the resource invisible
to normal reads. Two distinct concerns apply here, and they compose:

**Ownership (`owner`/`access`/`sourceAssigningAuthority`).** These
resources are created by an internal tool, not received from any specific
tenant's system — so they're tagged as owned by the platform itself, not by
whichever tenant the subject patient happens to belong to:

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

**Patient-scoping the `Binary` specifically.** `Binary` is commonly a
*non-patient-compartment* resource type in a FHIR server, which means a
naive implementation makes every `Binary` readable by anyone with any valid
token — there's no `subject`/`patient` field on `Binary` itself to scope
access by. If your server has this same gap, it needs its own resolution
independent of the general ownership tags above; in this repo's server the
resolution is an additional `meta.security` entry on `Binary` only (not
needed on `DocumentReference`, which is already patient-scoped via its own
`subject` field):

```json
{ "system": "https://www.icanbwell.com/sourcePatientId", "code": "Patient/{subjectId}" }
```

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
  twice with the expected payloads (including the `meta.security` blocks)
  and navigates on success; a bad-status `Binary` response stops before the
  `DocumentReference` call; a 200-with-`OperationOutcome` response is treated
  as failure the same as a bad status; a `DocumentReference` failure after a
  successful `Binary` write surfaces the orphaned-resource link; an
  unsupported `resourceType` in the route renders an error instead of the
  form.

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
4. Write `Binary` then `DocumentReference` sequentially, with client-generated
   ids; check the response *body*, not just the HTTP status, for
   resource-level failures; don't auto-rollback a successful `Binary` write
   on a subsequent failure — surface it for manual cleanup instead.
5. Tag both resources with whatever ownership/access model your server
   requires, and separately check whether any resource type you're creating
   (like `Binary`) needs its own patient-scoping tag beyond the general
   ownership tags — a resource with no `subject`/`patient` field of its own
   won't get that scoping for free.
