# Composition Summary Screen

A human-readable view of a FHIR `Composition` resource, rendered as sections
and Field | Value tables instead of raw JSON. This doc explains how the
feature is wired together, for anyone extending or debugging it.

Design background: `docs/superpowers/specs/2026-07-10-composition-summary-screen-design.md`.

## Where it lives

| Concern | File |
|---|---|
| Route registration | `src/routes/fhirRoutes.tsx` |
| Page (fetch + loading/error states) | `src/pages/CompositionSummaryPage.tsx` |
| Rendering | `src/components/CompositionSummary.tsx` |
| Entry point link (from a resource card) | `src/components/ResourceCard.tsx` |

## How a user gets here

`ResourceCard.tsx` shows a "Composition View" link (via `getCompositionSummaryLink`)
for any resource whose type is in `compositionSummaryResourceTypes`. It links to:

```
/composition-summary/4_0_0/Composition/{uuid}
```

which is registered in `fhirRoutes.tsx` (mirroring the existing `/ips/4_0_0/...`
pattern used by `IPSViewerPage`) and renders `CompositionSummaryPage`.

## Data flow

1. `CompositionSummaryPage` reads `resourceType`/`id`/`operation` from the route
   params, builds a relative FHIR URL (`/4_0_0/Composition/{id}`), and fetches
   it with `BaseApi.getData`.
2. If the response's `resourceType` isn't `Composition`, it shows an error
   instead of rendering (this page only handles Compositions).
3. On success, it renders `<CompositionSummary resource={...} rawJsonHref={...} />`.
   `rawJsonHref` is built with `appendFormatJson` (`src/utils/url.utils.ts`), the
   same helper `IPSViewer` uses for its "View Raw Bundle" link — both intentionally
   use a *relative* URL for the link (matching how every other resource link in
   this app is built, e.g. `src/partials/Reference.tsx`), not an absolute
   `fhirUrl`-resolved one.

## Rendering model (`CompositionSummary.tsx`)

A Composition's `section[]` is a flat-ish list of `{ title, text.div }` narrative
rows, but some domains (EOB, Member, Payer-Member) nest an *extra* level of
`section[]` for grouping. The renderer treats this as a tree:

- **Leaf section** — has no nested `section[]`. Rendered as one row in a
  Field | Value table (`SectionGroup`'s `leafRun`/`flushLeafRun`).
- **Group section** — has nested `section[]`. Rendered as its own nested
  `Accordion`, recursing `SectionGroup` into it.

Top-level sections get their own outer `Accordion` with:
- A field/link count and a preview of the section's leaf values, computed once
  by `summarizeLeafFields` (a single recursive walk — avoid re-adding a second
  walk if you need another derived stat; fold it into this one instead).
- A search box that filters top-level sections by title. Per-section metadata
  (`sectionMeta`) is memoized on `resource.section` so typing in the search box
  doesn't re-walk every section's tree on each keystroke — only the cheap title
  filter reruns per keystroke.

### Narrative text (`text.div`) is XHTML, not plain text

Per the FHIR spec, `Narrative.div` is XHTML and may be wrapped in
`<div xmlns="...">...</div>`. Field values here are simple text, not rich
content, so rather than injecting sanitized HTML (as `src/partials/Narrative.tsx`
and `IPSViewer.tsx` do for full narrative blocks), `narrativeText()` strips all
tags via `DOMPurify.sanitize(value, { ALLOWED_TAGS: [] })` and renders the
result as plain text. Any leaf value that looks like an ISO date/dateTime
(`looksLikeIsoDate`, from `src/utils/dateFormat.ts`) is additionally formatted
with the viewer's local timezone via `DateValue` (`src/components/DateValue.tsx`)
— both shared with `CompositionIndex.tsx`, not local to this file.

### References

`parseReference` extracts `{resourceType, id}` from a FHIR reference string
using a right-anchored regex (`REFERENCE_REGEX`) so it works for relative
references (`Patient/abc`), absolute-URL references (`https://server/fhir/Patient/abc`),
and versioned references (`Patient/abc/_history/2`). Contained references
(`#some-id`) don't match and fall back to plain text, since there's no
type/id pair to link to.

`ReferenceLink` (single reference, e.g. `subject`/`author`/`custodian`) and
`EntryChips` (a section's `entry[]` list) both use it to build links to
`/4_0_0/{resourceType}/{id}`.

### "Preferred" coding

`section.code.coding` can carry multiple codings from different systems;
`preferredCoding()` picks the one flagged via the `preferred` extension
(`{ url: 'preferred', valueBoolean: true }` — the canonical FHIR extension
shape, matching `src/partials/Reference.tsx`'s `e.url === ...` convention),
falling back to `coding[0]` if none is flagged.

## Extending this feature

- **Add a resource type that should also get "Composition View"**: add it to
  `compositionSummaryResourceTypes` in `ResourceCard.tsx` — don't add another
  `resource.resourceType === 'Composition'` string check.
- **Add a new derived per-section stat** (shown in the accordion header): fold
  it into `summarizeLeafFields`'s single tree walk rather than adding a second
  traversal function.
- **Change how a leaf value is displayed**: it goes through `narrativeText()`
  first (tags stripped), then `looksLikeIsoDate`/`DateValue` for date
  formatting. Add new value-shape handling after the tag-stripping step, not
  before.
