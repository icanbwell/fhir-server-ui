# Composition Index

A category x version matrix for every FHIR `Composition` belonging to a
person, each cell linking straight to that Composition's summary view. Built
so that a Person client ID is the only input needed to reach any Composition
in one click, instead of manually reading `meta.source`/`type.coding` off
search-result cards one at a time.

Design background: see the plan this shipped from for the full rationale and
the prod data that shaped it.

## Where it lives

| Concern | File |
|---|---|
| Grouping logic (pure, tested) | `src/utils/compositionIndex.ts` |
| Route registration | `src/routes/fhirRoutes.tsx` |
| Page (fetch + loading/error states) | `src/pages/CompositionIndexPage.tsx` |
| Rendering | `src/components/CompositionIndex.tsx` |
| Date formatting (shared with `CompositionSummary.tsx`) | `src/components/DateValue.tsx`, `src/utils/dateFormat.ts` |
| Entry point link (from a resource card) | `src/components/ResourceCard.tsx` |

## How a user gets here

`ResourceCard.tsx` shows a "Compositions" link (via `getCompositionIndexLink`)
for any `Patient`/`Person` card — the same `summaryResourceTypes` list the
"IPS" link already uses. It links to:

```
/compositions/4_0_0/{uuid}          # Patient
/compositions/4_0_0/person.{uuid}   # Person
```

registered in `fhirRoutes.tsx` as `/compositions/4_0_0/:personId?`. The page
also works with no `:personId` at all — it renders a plain text field so you
can paste an ID directly instead of being told a URL.

**Deliberate convention deviation:** every sibling route under `fhirRoutes.tsx`
is resource-addressed (`/composition-summary/4_0_0/Composition/{id}`,
`/ips/4_0_0/Patient/{id}/...`) — a `:resourceType` and often an `:operation`,
not just a bare id. This route is person-scoped instead: no `:resourceType`,
no `:operation`, just a Person client ID, because that's the one input this
whole feature is designed to work from. The literal `4_0_0` segment is kept
purely for visual/muscle-memory consistency with every other route here — this
app hardcodes FHIR R4 everywhere and has no other version to actually
parameterize.

## Data flow

1. `CompositionIndexPage` reads `:personId`, normalizes it with
   `normalizePersonId` (bare uuid -> prefixed with `person.`; already-prefixed
   IDs pass through), and fetches
   `/4_0_0/Composition?patient={personId}&_count=100&_elements=id,meta,type,title,date,status`
   via `BaseApi.getData`.
2. `buildCompositionMatrix` (in `compositionIndex.ts`) splits the returned
   Compositions into `{ columns, rows, other }`, based on whether
   `getVersionKey` resolves to a known version:
   - **Matrix-eligible** (`meta.source` is one of the three
     `COMPOSITION_VERSIONS` — this is an allowlist, not a preference list):
     - **Columns** are the versions actually present in the data, ordered V3,
       V2, V1.
     - **Rows** are categories, keyed by `getCategoryKey` —
       `type.coding[0].code` with the `_summary_document` suffix stripped,
       plus a small synonym map (`CATEGORY_SYNONYMS`) so V1's `allergy` and
       V2/V3's `allergyintolerance` land in the same row instead of
       splitting into two.
     - Each cell holds an **array** of `{ id, lastUpdated }`, not a single
       value — if two Compositions ever share a (version, category), both
       are kept rather than one being dropped.
     - Each row also carries `typeCodes: string[]` — every distinct raw
       `type.coding[0].code` merged into it (usually one, but e.g. the
       allergyintolerance row carries both V1's and V2/V3's codes), so a
       merge stays visible instead of being silently hidden by the
       humanized label.
   - **Everything else** (e.g. `device-data-ingest`'s Body System / Device
     Metric compositions) goes to `other: TOtherComposition[]` — one entry
     per Composition (`{ id, title, source, typeCode, lastUpdated }`), never
     grouped. We don't know the right discriminator for an unfamiliar
     source, so this deliberately doesn't guess one — see "Why `other` isn't
     grouped" below.
3. `CompositionIndex.tsx` renders a "Health Summary Compositions" table when
   `rows.length > 0`: a "View" link per cell to
   `/composition-summary/4_0_0/Composition/{id}`, or a dash when that version
   has no Composition for that category. Column headers show `column.source`
   and row headers show `row.typeCodes.join(', ')` as a caption line under
   the short label, so the full underlying FHIR value is always one glance
   away from its display label. Below it, a separate "Other Compositions"
   table renders when `other.length > 0` — Title / Source / Last Updated /
   link, sorted by title. If both are empty, a "No Compositions found"
   message renders instead of two blank tables. Every date (`lastUpdated`) is
   rendered via `<DateValue>` (`src/components/DateValue.tsx`, backed by
   `src/utils/dateFormat.ts`) — the same human-readable format
   `CompositionSummary.tsx` uses, e.g. `Aug 13, 2026, 10:58 AM CDT` (falling
   back to the raw value only when it can't be parsed as a date). Both were
   extracted out of `CompositionSummary.tsx` into shared files specifically so this page could
   reuse them rather than reimplementing date formatting.

### Why no pagination

The FHIR server's Bundle envelope can't drive it here: `total` comes back `0`
(no `_total=accurate` requested) and a `next` link is emitted even when every
result already fit in one page. `_count=100` is used as a single best-effort
fetch instead — generously above what one person plausibly has (roughly one
Composition per category per version) — with a non-blocking banner if exactly
100 come back, rather than silently treating that as a truncation signal one
way or the other.

### The V1-vs-V2/V3 type-code drift

V1 (`intelligence-layer-pipeline`) emits `allergy_summary_document` where
V2/V3 emit `allergyintolerance_summary_document` for the same category. V1
also has its own `diagnosticreportlab_summary_document` type the other two
versions don't produce. Both are handled in `getCategoryKey`/
`CATEGORY_SYNONYMS` — if a future version introduces another one-off rename,
add it there rather than special-casing it in the component.

### Why `other` isn't grouped

Early versions of this page appended any unrecognized `meta.source` as its
own trailing column — reasonable until real data showed why it's wrong.
`device-data-ingest`'s five "Body System" compositions (`overall-health`,
`musculoskeletal`, `respiratory`, `sleep`, `cardiovascular`) all share the
*same* `type.coding[0].code` (`body_system_summary_document`) — the thing
that distinguishes them is buried in a title, not a code `getCategoryKey`
can key off. Grouping them by that shared code the way the matrix does would
have silently collapsed all five into one row. Rather than invent a
per-source discriminator we can't verify for sources we haven't seen yet,
`other` lists Compositions individually and leans on `title` (usually
descriptive enough on its own, e.g. "Healthspan Body System Summary —
Sleep — ...") plus the raw `typeCode` as a caption.

## Extending this feature

- **A new category shows up with the wrong label**: categories are humanized
  generically (`humanizeCategoryKey` in `CompositionIndex.tsx` just
  capitalizes the key) since there's no FHIR-provided display name to draw
  on. If a raw type code needs a nicer label or a synonym merge, add it to
  `CATEGORY_SYNONYMS` in `compositionIndex.ts`.
- **A new Health Summary version ships**: add it to `COMPOSITION_VERSIONS`
  in `compositionIndex.ts` — this list is an allowlist (see "Why `other`
  isn't grouped" above), so a source not on it lands in `other`, not a new
  column, until you explicitly add it here.
- **A new non-versioned source needs its own grouped table** (not just
  listed in `other`): that's a bigger change than this doc covers — you'd be
  designing a new discriminator for that source specifically, the same
  problem `other` exists to avoid guessing at generically.
