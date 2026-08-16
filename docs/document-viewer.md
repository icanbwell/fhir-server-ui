# Document Viewer

How this app previews FHIR `Attachment` content (PDFs, images, HTML, RTF, plain
text) that lives on `DocumentReference`, `Binary`, and several other resource
types. Written so a different project — any stack, not just React — can
reimplement the same approach against its own FHIR server.

This is a **read-only preview**, not a document management UI: no upload, no
list/search screen of its own, no editing. It answers one question — "here's
an attachment on a FHIR resource, show it to the user" — and nothing else.

Design background (this repo): `docs/superpowers/specs/2026-08-12-document-viewer-and-encounter-links-design.md`.

## The problem this solves

FHIR's `Attachment` data type (used by `DocumentReference.content[].attachment`,
`DiagnosticReport.presentedForm[]`, `Media.content`, `Patient.photo`,
`Consent.sourceAttachment`, `Contract.legallyBindingAttachment`, and the
`Binary` resource itself) can point at document bytes in three different ways,
and a naive `<img src>` / `<iframe src>` pointed at a FHIR server breaks for
most of them:

- `attachment.data` — base64-inlined bytes, no network fetch needed.
- `attachment.url` referencing `Binary/{id}` on the *same* FHIR server — needs
  an **authenticated** fetch (bearer token), which a plain `src` attribute
  cannot send.
- `attachment.url` pointing anywhere else (an external CDN, a different
  server) — out of scope; don't try to fetch arbitrary third-party URLs,
  just link out to them.

On top of that, rendering the resolved bytes has its own per-content-type
traps (PDFs, in particular — see [Gotchas](#gotchas-and-edge-cases)).

## Architecture overview

```
resource detail page
  └─ "View" link  →  opens a dedicated viewer page/route in a new tab
                        └─ fetch the FHIR resource by id
                        └─ extract attachment(s) from the resource
                        └─ for each attachment:
                             resolve content (data | Binary fetch | external)
                               └─ render by content-type (or fall back to text)
```

Concretely, in this repo (React 19 + MUI + Vite):

| Concern | File |
|---|---|
| Route registration | `src/routes/fhirRoutes.tsx` |
| Page shell — reads route params, builds the FHIR URL, sets page title | `src/pages/DocumentViewerPage.tsx` |
| Fetches the resource, extracts attachment(s), picks which to show | `src/components/DocumentViewer.tsx` |
| Per-attachment fetch/decode/render pane | `src/components/AttachmentPreview.tsx` |
| Content-resolution algorithm (data vs. `Binary/{id}` vs. external URL) | `src/utils/attachment.utils.ts` |
| PDF-specific renderer (react-pdf / pdf.js), lazy-loaded | `src/components/PdfPreview.tsx` |
| "View" link rendered on resource detail pages | `src/partials/DocumentViewerLink.tsx`, `src/partials/DocumentContent.tsx`, `src/partials/BinaryContent.tsx`, `src/partials/Attachment.tsx` |
| Shared authenticated HTTP client (bearer token, CORS guard, streaming download) | `src/api/baseApi.ts` |

There's deliberately **no list view and no modal/dialog**. Every existing
bespoke viewer in this app (this one, plus the IPS and Composition Summary
viewers) follows the same pattern: its own full page, opened via a link on the
normal resource detail page, in a new tab (`target="_blank"`). This keeps
routing and browser-history simple and avoids state-management complexity
that a modal would add (scroll locking, focus trapping, nested-dialog stacking
if a document itself contains links to other resources). A project with a
different UI paradigm (e.g. a slide-over panel) can swap this in without
changing anything below the page-shell layer.

## Step 1 — Fetch the resource and find the attachment(s)

The viewer does a plain `GET /{fhirBasePath}/{resourceType}/{id}` — no search
params, no GraphQL, no special headers beyond normal auth. It's a single-resource
read.

Different resource types keep their attachment(s) in different shapes, so the
extraction logic needs a small per-type map:

| Resource type | Field | Shape |
|---|---|---|
| `DocumentReference` | `content` | array of `{ attachment: Attachment }` |
| `DiagnosticReport` | `presentedForm` | array of `Attachment` directly |
| `Media` | `content` | single `Attachment` |
| `Patient` / `Practitioner` / `RelatedPerson` | `photo` | array of `Attachment` |
| `Consent` | `sourceAttachment` | single `Attachment` |
| `Contract` | `legallyBindingAttachment` | single `Attachment` |
| `Binary` | *(the resource itself)* | synthesize `{ contentType, data, url }` from `resource.contentType`/`resource.data` |

Two defensive normalizations worth copying:

- **Tolerate non-conformant servers.** Fields declared `0..*` in the spec
  (`photo`, `presentedForm`) sometimes arrive as a bare object instead of a
  one-element array from real-world servers. Normalize by wrapping in `[value]`
  before mapping, so the render code can always `.map()` without a type check.
- **`Binary` has no sub-field.** The resource *is* the attachment. Build a
  synthetic `Attachment`-shaped object: `contentType` from `resource.contentType`,
  `data` from `resource.data` if present, else `url: 'Binary/{id}'` so the same
  downstream resolution code in Step 2 handles it uniformly.

If you support selecting a single entry out of a multi-entry field (e.g. a
"View" link per `content[]` row on `DocumentReference`), pass that index
through and re-validate it against the current array length when the page
loads — the array can have changed server-side since the link was generated.
Fall back to showing *all* entries with a warning rather than a blank page if
the index is now out of range.

## Step 2 — Resolve each attachment to bytes

This is the core, most reusable piece of logic. Given one `Attachment`, decide
where its bytes come from, in this order:

1. **`attachment.data` is present** → decode base64 client-side into a `Blob`.
   No network call. (`Uint8Array.from(atob(data), c => c.charCodeAt(0))`, then
   `new Blob([bytes], { type: contentType })`.)

2. **`attachment.url` matches `Binary/{id}`** on your own FHIR server → fetch
   it through your **authenticated** HTTP client (see [Auth](#auth-fetch-as-a-blob-not-a-src-attribute)),
   requesting `Accept: application/fhir+json` explicitly rather than the
   attachment's own declared content type (some servers/proxies don't honor
   arbitrary `Accept` negotiation and always answer Binary reads with
   `application/fhir+json`).

   Two more subtleties learned the hard way here:

   - **Try same-origin first, then cross-origin.** Many deployments front the
     FHIR server behind a same-origin reverse proxy at the same relative path.
     Attempt the fetch against `window.location.origin` first; only fall back
     to the real, possibly cross-origin, FHIR server URL if that fails. This
     avoids CORS entirely for the common case without requiring the FHIR
     server to add CORS headers just for this feature.
   - **Detect the FHIR "Binary JSON wrapper" by response *shape*, not
     content-type string.** A `Binary` read may come back as
     `{"resourceType":"Binary","data":"<base64>"}` (needs decoding) — but a
     resource that is *legitimately* `application/json`/`application/fhir+json`
     typed must not be misidentified as that wrapper. Parse the response,
     check `resourceType === 'Binary'` and a string `data` field; only then
     treat `data` as base64 to decode. If the response is JSON but not that
     shape, treat the parsed JSON itself as the real content. If it isn't JSON
     at all, use the raw response bytes directly as the Blob.

3. **Any other `url`** (external CDN, different server) → don't fetch it.
   Surface it as an "open externally" link instead. Fetching arbitrary
   third-party URLs on the user's behalf is a deliberate non-goal — it adds
   SSRF-shaped risk and CORS problems for no real benefit over just linking out.

4. **Neither `data` nor `url`** → "no content available" empty state.

Model the result as a small discriminated union so the render layer can branch
cleanly, e.g.:

```
{ kind: 'resolved', content: { blob, contentType } }
| { kind: 'external', externalUrl }
| { kind: 'unavailable', reason: 'malformed' | 'network' | 'missing', detail }
```

Distinguishing `malformed` (base64/JSON decode failed — content is likely
corrupted at the source) from `network` (the fetch itself failed) lets the UI
give a more useful error, and both cases can show the raw response body in a
collapsed debug section instead of just "something went wrong."

## Step 3 — Render by content type

Once you have a `Blob` + `contentType`, dispatch to a renderer:

| Content type | Approach |
|---|---|
| `application/pdf` | Client-side render to `<canvas>` via pdf.js (see [PDF rendering](#pdf-rendering-canvas-not-iframe)) — **not** an `<iframe src="blob:...">` |
| `image/*`, `video/*`, `audio/*` | `URL.createObjectURL(blob)` → native `<img>` / `<video controls>` / `<audio controls>`. Revoke the object URL on cleanup/attachment change to avoid leaking memory. Add an `onError` handler on video/audio — a codec the browser can't play often fails silently otherwise (blank player, no visible error), so show a fallback message + a Download button. |
| `text/html` | Sanitize with an HTML sanitizer (e.g. DOMPurify) before injecting — never render attachment HTML unsanitized, it's untrusted content. |
| `text/rtf`, `application/rtf` | An RTF-to-DOM library (e.g. `rtf.js`) that parses the `ArrayBuffer` and returns real DOM nodes to append into a ref'd container — not JSX, since the library builds DOM directly. |
| Everything else (JSON, XML, plain text, unknown/undeclared) | `blob.text()` into a `<pre>` block. Deliberate fallback so nothing ever dead-ends with "preview not available" for a type you didn't special-case. |

Always show a **Download** button once a Blob is resolved, independent of
whether the preview itself rendered successfully — a failed inline preview
shouldn't block the user from getting the file. Pick a sensible filename from
`attachment.title` if present, else derive an extension from the content type.
(Watch out for `Binary/{id}`-style synthetic titles containing a `/` — invalid
in a filename on most filesystems; don't pass a resource reference through as
a suggested title.)

## PDF rendering: canvas, not iframe

This is the single biggest gotcha, worth its own section.

**Don't** do `<iframe src={URL.createObjectURL(pdfBlob)}>`. It looks like it
works locally, but a `blob:` URL loaded into an iframe is governed by your
Content-Security-Policy's `frame-src` (which falls back to `default-src` if
unset), and `default-src` in most real CSPs does not allow the `blob:`
scheme. In a deployment with a shared CSP across multiple apps, you often
can't just add `frame-src blob:` — you'd need it added platform-wide for
everyone.

**Do** render PDFs client-side to `<canvas>` using pdf.js (directly, or via a
wrapper like `react-pdf`). Canvas rendering isn't subject to `frame-src` at
all, so no CSP change is needed. In this repo: `react-pdf@^10.4.1` +
`pdfjs-dist@5.4.296`.

The one thing to get right here is the **pdf.js worker**. By default, pdf.js
spins up its worker from a `blob:` URL too, which just moves the same CSP
problem to `worker-src`. Instead, bundle the worker as a same-origin static
asset and point pdf.js at that URL explicitly:

```ts
import { pdfjs } from 'react-pdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'; // Vite: '?url' → emits the file, returns its URL

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
```

(The `?url` import suffix is a Vite convention; other bundlers have an
equivalent "give me this asset as a static file + its URL" mechanism —
webpack's `asset/resource` type, for example.)

Other things worth copying from this implementation:

- **Render one page at a time** (with prev/next controls), not every page of
  the document simultaneously. Large scanned multi-page documents otherwise
  queue that many concurrent canvas rasterizations at once.
- **Code-split the PDF renderer** (dynamic `import()`) since pdf.js is a large
  dependency and most attachments in a given session won't be PDFs.
- A dynamic `import()` can *reject* (stale chunk hash after a redeploy, an ad
  blocker, a flaky network) — and that rejection surfaces as a thrown error
  during render, which a `Suspense` boundary does **not** catch (`Suspense`
  only covers the pending state). Wrap the lazy-loaded component in a small
  class-based error boundary in addition to `Suspense`, so a broken PDF chunk
  degrades to an inline warning instead of taking down the whole page via
  whatever top-level error boundary/router error page your app has.

## Auth: fetch as a blob, not a `src` attribute

Never point a browser-native `src`/`href` directly at your FHIR server for
attachment content — it sends no `Authorization` header, so it'll 401 (or
worse, silently succeed against an endpoint that shouldn't be anonymously
readable). The pattern that works everywhere:

1. Fetch the bytes through your app's normal authenticated HTTP client (bearer
   token / cookies / whatever your app already uses for FHIR API calls) —
   `fetch()` with an `Authorization` header, not an `<img src>`.
2. Get back a `Blob`.
3. For anything that needs a browser-native `src` (`<img>`, `<video>`,
   `<audio>`), convert with `URL.createObjectURL(blob)` and revoke it on
   cleanup.
4. For PDFs, skip the object-URL step — hand the `Blob` directly to your PDF
   renderer (`<Document file={blob}>` in react-pdf).

A secondary but important guard: validate that any URL you're about to fetch
resolves to an origin you actually expect (your configured FHIR server, or an
explicit same-origin proxy override) before attaching the bearer token to the
request. Otherwise a maliciously or accidentally cross-origin `attachment.url`
could leak the token to an unintended host. Reject/refuse the fetch rather
than sending auth headers to an unverified origin.

## Gotchas and edge cases

Roughly in the order they're likely to bite:

- **PDF-in-iframe breaks under CSP** in real deployments even though it works
  locally with no CSP configured — see [PDF rendering](#pdf-rendering-canvas-not-iframe).
  If your app is not seeing this today, it's likely because dev/staging has a
  laxer CSP than production; test the actual deployed CSP, not just localhost.
- **`Suspense` doesn't catch rejected lazy imports** — pair lazy-loading with
  an error boundary, not `Suspense` alone.
- **CORS on cross-origin Binary fetches** — try a same-origin path first;
  don't assume the FHIR server has CORS configured for your UI's origin.
- **Content-type lies** — trust the actual response *shape* over the
  declared/requested content-type header when disambiguating a FHIR Binary
  JSON wrapper from genuinely JSON-typed content.
- **`0..*` fields sent as bare objects** by non-conformant servers — normalize
  defensively rather than assuming spec-perfect responses.
- **Stale content-index links** — if you let users deep-link to one entry of a
  multi-entry field by index, re-validate the index against current data and
  degrade gracefully (show everything) rather than 404-ing or blanking.
- **`Content-Length` reflects compressed size** when the server gzips/brotlis
  a response, but a streaming reader yields decompressed bytes — if you show
  download progress, treat the total as unknown whenever `content-encoding`
  is present, rather than showing a progress bar that overshoots 100%.
- **A dropped connection mid-download** should surface as an explicit
  "incomplete download" error, not silently hand back a truncated Blob that
  looks like a successful download.
- **Object URLs leak memory if not revoked** — revoke on attachment change
  and on unmount, not just on unmount.

## Testing approach

Structure tests around the same layering as the implementation:

- **Resource → attachment extraction**: for each supported resource type,
  assert the right field/shape is read, including the bare-object-instead-of-array
  normalization and the synthetic-Binary-attachment case.
- **Content resolution** (the algorithm in [Step 2](#step-2--resolve-each-attachment-to-bytes)):
  the highest-value test target. Cover inline base64 (valid + malformed),
  `Binary/{id}` fetch (assert the same-origin-then-direct call sequence),
  the Binary JSON wrapper vs. genuinely-JSON content, network failure with
  status surfaced, external non-Binary URLs, and cross-origin URLs correctly
  treated as external rather than fetched.
- **Per-content-type rendering**: at minimum, video/audio `onError` fallback
  behavior, since browsers don't otherwise surface a visible signal for an
  unplayable codec.
- **End-to-end**: sign in, open a resource with an attachment, click "View",
  assert the preview renders — enough to catch integration issues (routing,
  auth wiring, CSP) that unit tests around the resolution algorithm can't.

This repo's tests, if you want concrete examples: `src/components/DocumentViewer.test.tsx`,
`src/components/AttachmentPreview.test.tsx`, `src/utils/attachment.utils.test.ts`
(the most thorough — a good template for the content-resolution test matrix
above), `src/partials/DocumentViewerLink.test.tsx`, `src/partials/Attachment.test.tsx`,
and `e2e/features/document-viewer.feature` / `e2e/steps/document-viewer.steps.ts`.

## Summary for reimplementers

The portable core, independent of framework/UI library:

1. Map each resource type you care about to where its `Attachment`(s) live.
2. Resolve an `Attachment` to bytes: inline base64 → decode; same-server
   `Binary/{id}` → authenticated fetch (same-origin-first, then direct);
   anything else with a `url` → link out, don't fetch.
3. Fetch through your normal authenticated client and get a `Blob`; never
   point a native `src`/`href` at a FHIR server directly.
4. Render PDFs to canvas (pdf.js or equivalent), never in an iframe, and give
   the worker a same-origin URL instead of its default `blob:` worker.
5. Fall back to a text dump for any content type you haven't special-cased,
   and always offer Download regardless of preview success.
