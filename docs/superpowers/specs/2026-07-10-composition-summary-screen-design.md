# Composition Summary Screen — Design

## Problem

FHIR `Composition` resources, as produced by b.well's intelligence layer, are per-person
summary documents (medications, encounters, conditions, procedures, care plans, labs,
vitals, allergies, immunizations, pregnancy episodes, claims/EOB, coverage/member). The
current viewer (`src/pages/resources/Composition.tsx`, auto-generated) just dumps raw
fields via generic `Partials` components — it doesn't reflect the document structure, so
it's hard for a human to actually read a composition.

The reference doc (`composition_reference.html`, b.well internal) documents the actual
JSON shape used across all composition types:

```
Composition                    ← 1 per person (or per coverage/episode). Header + sections.
└─ section[]                   ← 1 per GROUP (a medication, an encounter episode, a claim...)
   └─ section[]                ← the "narrative": human-readable {title, text.div} rows
```

The narrative fields are **not fixed keys** — they are rows in `section[i].section[]`,
each shaped `{ "title": "Prescriber", "text": { "div": "..." } }`, looked up by `title`.
Financial/coverage domains (EOB, Member, Payer-Member; `status: "final"`) nest one level
deeper before reaching those leaf rows — everything else (`status: "preliminary"`) is
one level of grouping.

## Goal

A dedicated screen that renders any b.well Composition resource as a readable document:
a header summary plus one section per group, with the narrative fields shown as a
Field | Value table (per the reference doc's own recommendation to key narrative rows by
title) instead of a raw JSON/field dump.

## Non-goals

- Editing/authoring compositions.
- Replacing the generic FHIR field dump — that stays available as today, unchanged.
- special-casing each of the 13 domain types individually — the renderer works off the
  generic `section[]` recursion so it works for all of them, including nesting depth.

## Existing precedent

`IPSViewer` (`src/components/IPSViewer.tsx`) + `IPSViewerPage` already do something
similar for the (different) IPS document Bundle: a dedicated component/page pair on its
own route (`/ips/4_0_0/...`), discoverable via a small link added to `ResourceCard.tsx`
that only appears for relevant resource types. `pages/resources/Composition.tsx` and
`components/ResourceItem.tsx` are auto-generated ("do not edit manually") — the codebase
convention for a bespoke resource view is a separate component/page/route, not touching
generated files. This design follows that same convention.

## Design

### 1. `src/components/CompositionSummary.tsx`

Presentational component, takes a `TComposition` resource (already fetched):

- **Header card**: title, status chip, `type.coding[]` as chips (doc-type / view-type /
  resource-type codes), subject as a link (`/4_0_0/{Type}/{id}`), date, author,
  custodian, identifier.
- **One card per top-level `section[]` entry** ("group" — e.g. one medication, one
  encounter episode, one claim):
  - Group title, the coding flagged `preferred` (falling back to the first coding, or
    `text`) shown as a chip, `entry[]` shown as small linkable chips.
  - Body renders the group's `section[]` via a recursive `SectionGroup` component:
    - If an item is a **leaf** (`{title, text.div}`, no nested `section[]`), collect
      consecutive leaves into a two-column **Field | Value** table.
    - If an item has its own nested `section[]` (deep domains — EOB, Member,
      Payer-Member), render it as a labeled sub-block and recurse, so nesting depth
      doesn't need to be hard-coded per domain.
- **"View Raw JSON" link** — same convention as IPSViewer's "View Raw Bundle" — so
  power users can always drop to the unformatted resource.

### 2. `src/pages/CompositionSummaryPage.tsx`

Page shell (Header/Footer), fetches the resource by id the same way `IPSViewerPage` /
`IPSViewer` do today (`BaseApi.getData` against `/4_0_0/Composition/{id}`), then renders
`CompositionSummary`. Loading and error states mirror `IPSViewer`.

### 3. Routes (`src/routes/fhirRoutes.tsx`)

Mirrors the existing `/ips/...` routes:

```
/composition-summary/4_0_0/:resourceType/:id?/:operation?/*
/composition-summary/4_0_0/:resourceType/:operation?/*
```

### 4. Discoverability (`src/components/ResourceCard.tsx`)

Add a "Summary" link next to the existing "IPS" link, shown only when
`resource.resourceType === 'Composition'`, opening
`/composition-summary/4_0_0/Composition/{id}` in a new tab. Purely additive — the
existing generic dump (`ResourceItem` + `Json`) is untouched.

## UI mockup

Shallow domain example (medication summary — one level of grouping), using the redacted
sample from the reference doc:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Medication Summary Grouped by Medication Code      [</>] View Raw   │
│                                                          JSON ↗      │
├─────────────────────────────────────────────────────────────────────┤
│ [preliminary]  [medication_summary_document] [Medication Code       │
│                Display View] [MedicationStatement]                  │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ Identifier   bwell_composition_for_health_data_summary        │   │
│ │ Subject      Patient/person.<uuid> ↗                          │   │
│ │ Date         2026-07-05T06:23:24.634Z                         │   │
│ │ Author       bwell Connected Health ↗                         │   │
│ └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Dexamethasone (Injectable)          [1 ML dexamethasone phosphate…] │
│ [MedicationStatement/<id> ↗]                                        │
│ ───────────────────────────────────────────────────────────────     │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ Medication Name   Dexamethasone (Injectable)                  │   │
│ │ Status            completed                                   │   │
│ │ Source            IL - Example Express Care                   │   │
│ └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Methylprednisolone 4 Mg Tablets In A Dose Pack        [Other]       │
│ [MedicationStatement/<id> ↗]                                        │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ Medication Name   Methylprednisolone 4 Mg Tablets In A Dose... │   │
│ │ Status            completed                                   │   │
│ │ Source            IL - Example Orthopaedics                    │   │
│ └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

One header card (title, status/type chips, identifier/subject/date/author as a table),
then one card per `section[]` group (medication/encounter/claim/etc.) — group title, a
chip for the preferred code, linked entry references, then a Field | Value table for
the narrative rows. Every "↗" is a link that opens the referenced resource in a new tab.

Deep domain example (EOB/claims — an extra level of nesting before the leaf rows):

```
┌─────────────────────────────────────────────────────────────────────┐
│ Claims Summary - {plan name}                        View Raw JSON ↗ │
├─────────────────────────────────────────────────────────────────────┤
│ [final]  [claim_summary_member] [ExplanationOfBenefit]              │
│ Subject: Patient/... ↗   Author: bwell Connected Health ↗           │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ Claim #12345678                                    [claims]         │
│ [ExplanationOfBenefit/<id> ↗] [Coverage/<id> ↗]                     │
│ ───────────────────────────────────────────────────────────────     │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ Claim Number     12345678                                     │   │
│ │ Status           active                                       │   │
│ └───────────────────────────────────────────────────────────────┘   │
│ Service Lines  ← nested group (indented, own sub-table)             │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │ Line Number     1                                         │     │
│   │ Procedure Code  99213                                     │     │
│   │ Billed Amount   $150.00                                   │     │
│   └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

Each nesting level is an indented sub-block with its own Field | Value table — the same
recursive `SectionGroup` component handles this without special-casing per domain.

## Testing

- Manual: run the dev server, open a Composition resource, use the new "Summary" link,
  and verify layout against a shallow example (e.g. medication) and a deep example
  (e.g. EOB) using fixtures adapted from the sample JSON in the reference doc.
- No existing automated test coverage for resource-specific viewers (`IPSViewer` has
  none either) — none added here beyond what the codebase already does for similar
  screens.
