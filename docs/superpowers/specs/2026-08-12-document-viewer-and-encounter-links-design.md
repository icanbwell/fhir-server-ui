# Document Viewer + Encounter/DocumentReference Field Gaps — Design

## Problem

`DocumentReference.tsx` and `Binary.tsx` (both auto-generated) render every FHIR field
via the generic per-field `Partials` dispatch in `generate_components.py` — except the
one field that actually matters: `DocumentReference.content` (the array of
`{attachment}` entries pointing at the note itself) and `Binary.data`/`contentType` are
never rendered, because their FHIR types (`DocumentReferenceContent`, `base64Binary`)
aren't in the generator's `available_partial_resources` list or `partials_mapping`
dict — the two mechanisms that decide whether/how a field gets a `Partials.X` call.
There is currently no way to view or download the content a DocumentReference or
Binary resource actually points at.

A parallel gap: nothing today points from `Encounter` to its related
`DocumentReference`s (a reverse reference — `DocumentReference.context.encounter`
points *at* the Encounter, not vice versa), and there's no forward render of
`context.encounter` on the DocumentReference side either.

A broader field audit (see conversation) found several more `Encounter` and
`DocumentReference` fields that are defined but never rendered or only
partially rendered. Per user direction, all of them are in scope except
`Encounter.contained` (rare, low value).

## Goal

1. A dedicated **Document Viewer** screen that resolves and renders/downloads the
   actual note content behind a `DocumentReference` or `Binary` resource.
2. Discoverable both as a `ResourceCard` header-action link (matching the existing
   IPS/Composition-Summary link pattern) and inline on the `DocumentReference`/`Binary`
   detail pages themselves (which currently show none of this).
3. `Encounter` ↔ `DocumentReference` cross-linking: a forward link from
   `DocumentReference.context.encounter`, and a reverse "search DocumentReferences for
   this Encounter" link (reusing the existing `ReverseReference` pattern).
4. Render the remaining missing/partial fields identified in the audit:
   - `Encounter`: `participant`, `hospitalization`, `diagnosis` (currently only shows
     the `condition` link, not `use`/`rank`), `location` (currently only shows the
     `location` link, not `status`/`physicalType`/`period`), `statusHistory`,
     `classHistory`.
   - `DocumentReference`: `content` (see #1), `context` (see #3), `description`,
     `relatesTo` (currently only shows the `target` link, not `code`).

## Non-goals

- Editing/authoring DocumentReference, Binary, or Encounter resources.
- A generic "any resource's missing fields" audit — scoped to these two resource
  types only.
- An in-page modal/dialog viewer — this codebase has no `Dialog` usage anywhere; every
  existing bespoke viewer (IPS, Composition Summary, Excel) opens as its own page in a
  new tab, and this feature follows that same convention.
- Fetching content from arbitrary external (non-`Binary/{id}`) attachment URLs — out of
  scope per FHIR's own Binary-content-negotiation model and this org's actual data
  (confirmed via the `fhirnotesvectorstore` pipeline, which treats non-Binary URLs as
  unsupported too). These render as a plain external link instead.

## Existing precedent

- `IPSViewer`/`IPSViewerPage` and `CompositionSummary`/`CompositionSummaryPage`: a
  dedicated component/page/route triple, discoverable via a `ResourceCard` header link,
  opened in a new tab. This design's `DocumentViewer`/`DocumentViewerPage` follows the
  identical shape.
- `src/partials/Attachment.tsx` and `src/partials/ReverseReference.tsx`: hand-maintained
  partials (not auto-generated) wired into specific generated resource pages via the
  `partials_mapping` dict (`src/generator/partials_mapping_for_fields.py`) or the
  `reverse_references` dict (`src/generator/reverse_references.py`). This design adds
  new hand-maintained partials the same way.
- `generate_components.py`'s jinja template already has one precedent for a
  resource+field-specific special case outside the generic dispatch:
  `{% elif fhir_entity.cleaned_name == "Organization" and property.javascript_clean_name == "name" %}`.
  This design adds two more, narrowly scoped the same way (`DocumentReference.description`,
  `Binary.data`).
- `FileDownload.tsx` + `BaseApi.downloadFile()`: an existing working Blob-download
  pipeline. Reused directly, with `downloadFile()` gaining an optional `headers` param
  so callers can request a Binary's *native* content type via the `Accept` header
  instead of the FHIR JSON wrapper.

## Design

### 1. Content resolution (`src/utils/attachment.utils.ts`, new)

For any FHIR `Attachment`-shaped value (`{contentType, data, url, title, size}` — this
covers both `DocumentReference.content[].attachment` and a synthesized attachment built
from a `Binary` resource's own `contentType`/`data`), resolve actual bytes in this order:

1. `data` present (inline base64) → decode client-side into a `Blob` with the given
   `contentType`. No network call.
2. `url` matches `Binary/{id}` (relative to our own FHIR server) → call
   `BaseApi.downloadFile('/4_0_0/Binary/{id}', { headers: { Accept: contentType } })`.
   Per the FHIR R4 spec, requesting the native content type (not
   `application/fhir+json`) makes the server return raw bytes directly — no base64
   decoding needed, and it reuses the existing `downloadFile` Blob pipeline as-is once
   it accepts a `headers` override.
3. Anything else (external URL) → don't fetch it; expose it as a plain link the user
   can open themselves.

This returns a tagged result (`resolved` / `external` / `unavailable`) rather than
throwing, so the viewer can render each case distinctly.

### 2. `AttachmentPreview` component (`src/components/AttachmentPreview.tsx`, new)

Takes one `{ attachment: TAttachment }`, resolves its content via (1), and renders:

- A header row: title (or a generated fallback), contentType, size, creation date, and
  a **Download** button (always present when content is resolvable — calls
  `saveAs(blob, filename)` directly via `file-saver`, no page navigation).
- An inline preview based on contentType, every case falling back to "Preview not
  available — use Download" if rendering fails:
  - `text/html` → `dangerouslySetInnerHTML` after `DOMPurify.sanitize()` (same pattern
    as `IPSViewer.tsx`).
  - `text/plain`, `application/xml`, `text/xml` → `<pre>`-formatted text.
  - `application/pdf` → `<iframe>`/`<embed>` on an Object URL (native browser
    rendering, no library).
  - `image/*` → `<img>` on an Object URL.
  - `text/rtf`, `application/rtf` → convert via the `rtf.js` npm package
    (`RTFJS.Document(arrayBuffer).render()` → `HTMLElement[]`, appended into a
    container `<div>` via a ref) — confirmed real API via the library's own
    Getting-Started guide.
  - Anything else → metadata + Download only.
  - `external` resolution kind → a plain "Open externally" link, no preview.
  - `unavailable` → an inline error message.

### 3. `DocumentViewer` + `DocumentViewerPage` (new)

Modeled exactly on `CompositionSummary`/`CompositionSummaryPage`: the page fetches the
resource by route params (`/document-viewer/4_0_0/:resourceType/:id?/:operation?/*`,
added to `fhirRoutes.tsx` next to the other `/ips`, `/composition-summary`, `/excel`
routes), then hands it to `DocumentViewer`, which branches on `resourceType`:

- `DocumentReference` → renders one `AttachmentPreview` per `content[]` entry (per the
  "list all, view each independently" decision — a DocumentReference with a single
  `content` entry, the common case, just shows one).
- `Binary` → renders a single `AttachmentPreview` for a synthetic attachment built from
  `{ contentType: resource.contentType, data: resource.data, url: resource.data ? undefined : '/4_0_0/Binary/{id}', title: 'Binary/{id}' }`.

### 4. Entry points

- **`ResourceCard.tsx`**: a new header-action link (same visual treatment as the
  existing `getIPSLink`/`getCompositionSummaryLink`), shown for
  `resourceType in ['DocumentReference', 'Binary']`, opening
  `/document-viewer/4_0_0/{resourceType}/{id}` in a new tab.
- **Inline on the detail pages themselves**:
  - `Partials.DocumentContent` (new hand-maintained partial) renders `content[]` as a
    compact list (title/contentType/size/date + a "View" link to the Document Viewer
    page + a direct Download button using the same resolver) — wired into
    `DocumentReference.tsx` via a new `partials_mapping` entry for
    `DocumentReferenceContent`.
  - `Partials.BinaryContent` (new) does the equivalent for `Binary.tsx`, wired via a
    narrow `Binary.data`-specific special case in the jinja template (mirroring the
    existing `Organization.name` special case), since `Binary` needs the whole
    resource (`contentType` + `data` + `id`) rather than a single field value.

### 5. Encounter ↔ DocumentReference cross-linking

- **Forward** (`DocumentReference.context.encounter`): a new `Partials.DocumentReferenceContext`
  hand-maintained partial renders all of `context`'s sub-fields (`encounter` as a
  `Partials.Reference` link, `event`/`facilityType`/`practiceSetting` as
  `Partials.CodeableConcept`, `period` as `Partials.Period`, `related` as another
  `Partials.Reference`), wired via a new `partials_mapping` entry for
  `DocumentReferenceContext`.
- **Reverse** (Encounter → DocumentReferences): add an `"Encounter"` entry to
  `src/generator/reverse_references.py` pointing at
  `{target: 'DocumentReference', property: 'encounter'}` — reusing the existing
  `ReverseReference` partial exactly as `Patient`/`Location`/`Organization`/etc.
  already do. Produces a "Search DocumentReferences for this Encounter" link that opens
  the search-results page; no new component needed.

### 6. Remaining field-gap partials

Each follows the same shape as `Attachment.tsx`/`CodeableConcept.tsx`/`Period.tsx`
(hand-maintained partial + `partials_mapping`/jinja special case + regenerate via
`make generate_components`):

- `Partials.DocumentReferenceRelatesTo` (new) — replaces the existing bare
  `Partials.Reference field='target'` mapping for `relatesTo`; renders both `code`
  (relationship type) and the `target` link.
- `Partials.EncounterParticipant` (new) — `type`, `period`, and the `individual` link.
- `Partials.EncounterHospitalization` (new) — all of admit source, re-admission,
  diet/special-arrangement codes, and `dischargeDisposition`.
- `Partials.EncounterDiagnosis` (new) — replaces the existing bare
  `Partials.Reference field='condition'` mapping; adds `use` and `rank`.
- `Partials.EncounterLocation` (new) — replaces the existing bare
  `Partials.Reference field='location'` mapping; adds `status`, `physicalType`,
  `period`.
- `Partials.EncounterStatusHistory` / `Partials.EncounterClassHistory` (new) — simple
  two-column tables (status/class + period).
- `DocumentReference.description` — a narrow jinja special case (mirroring
  `Organization.name`) rendering it via the existing generic `Partials.NameValue`.

All of the above are additive to the generator config; `make generate_components`
regenerates `DocumentReference.tsx`, `Binary.tsx`, and `Encounter.tsx` from the updated
mapping/template, rather than hand-editing the generated files directly (per this
repo's own "do not edit manually" convention on those files).

## Testing

No automated test framework exists in this repo (confirmed: no jest/vitest/playwright,
no `*.test.*` files) — consistent with every other viewer feature here, verification is
`yarn lint && yarn tsc --noEmit` after each change plus a manual pass in `yarn dev`:
open a DocumentReference/Binary with real content of each represented type (HTML, RTF,
XML, PDF, image, inline-base64, and one with a non-Binary external URL) and confirm
preview + download; open an Encounter with related DocumentReferences and confirm the
reverse-search link and the new field sections render correctly; confirm regenerating
via `make generate_components` produces the expected diff and nothing else changes on
the other 142 resource pages.
