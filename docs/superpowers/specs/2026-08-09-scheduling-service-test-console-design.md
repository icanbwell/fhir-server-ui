# Scheduling Service Test Console — Design

## Problem

`scheduling-service` implements the IHE ITI Patient Care Coordination scheduling profile
(`Location/$find`, `Appointment/$find` (ITI-115), `Appointment/$hold` (ITI-116),
`Appointment/$book` (ITI-117)) across several destinations (MedStar IDX, MedStar
Solv/Urgent Care, Thedacare Epic Open Scheduling, Walgreens Vaccine Scheduling — see
"Scheduling @ b.well - Current State (July 2026)" on Confluence). Today, exercising this
workflow against a real environment means hand-building raw HTTP requests outside this app.
There's no way to pick a specific Person already being browsed in this FHIR UI, choose a
destination, and walk through each IHE step while watching the literal request/response at
every hop.

This mirrors a need this app already solved once: PR #220 built `FhirRequestConsole` as a
reusable, controlled request/response console; PR #225 (rebased onto for this work) added a
"Test this person's FHIR connections" entry point on `Person` resource cards that jumps into a
console pre-scoped to that person. This design reuses both directly rather than inventing a
parallel picker-based flow.

## Non-goals

- No automatic request chaining between IHE steps (e.g. auto-carrying the `$find` response's
  `Appointment.id` into `$hold`). The point of the page is to *see* each raw exchange; the user
  copies references between steps by hand. Automating this is a reasonable v2, not v1.
- No live Organization/Location search UI for picking a destination. Destinations are a short,
  slow-changing list (~4-6 rows); a static config file is simpler and matches this repo's
  existing "no per-env branching in code" convention (see Destinations below).
- No new Person/Patient picker. Entry is exclusively via a link on an already-loaded `Person`
  resource card, exactly like the Connections and IPS/`$summary` entry points.

## Entry point

Add `getTestSchedulingLink({ personId })` to `src/components/ResourceCard.tsx`, alongside the
existing `getIPSLink`/`getCompositionSummaryLink`/`getTestConnectionsLink` helpers, rendered
only when `resource.resourceType === 'Person'` (same restriction PR #225 settled on for the
Connections link, since the identifier this feature keys on is Person-specific). It opens
`/scheduling-console?personId=<uuid>` in a new tab, same UX as the existing links.

**Not gated by `canUseServiceAuth`.** That gate exists in PR #225 specifically because ATS's
on-behalf-of lookup endpoints only accept `cognitocc`/`descopecc`/`okta` service tokens.
`scheduling-service` has no such restriction as far as this app is concerned — it's called with
the same session bearer token this app already uses for every FHIR-server request (via
`BaseApi`'s default `Authorization` header). The link is visible on every Person card
regardless of login type.

## Route & page

- Route: `/scheduling-console` (search param `personId`, matching the `/connections?personId=`
  convention from PR #225 — not a path param, so the page also works with no `personId` as a
  neutral empty state if someone navigates there directly).
- `src/pages/SchedulingConsolePage.tsx`: reads `personId` from `useSearchParams()`, renders
  `Header`/`Footer` shell (matching every other page), and renders
  `<SchedulingConsoleContent key={personId ?? 'none'} personId={personId} />` — the `key` forces
  a full remount (and thus full state reset) when navigating between people, mirroring
  `ConnectionConsoleContent`'s `key={personId ?? 'self'}` reset trick from PR #225.
- `src/components/SchedulingConsoleContent.tsx`: owns destination selection and renders the four
  step consoles (below). If `personId` is absent, renders a plain "Open this page from a
  Person's resource card" message instead of the console — there is no picker to fall back to.

## Destinations

`src/constants/schedulingDestinations.ts` exports a static array:

```ts
export interface SchedulingDestination {
    slug: string;
    label: string;
    organizationReference: string; // e.g. "Organization/abc123"
}

export const SCHEDULING_DESTINATIONS: SchedulingDestination[] = [
    { slug: 'medstar-idx', label: 'MedStar — Primary Care (IDX)', organizationReference: '' },
    { slug: 'medstar-solv', label: 'MedStar — Urgent Care / E-Visit (Solv)', organizationReference: '' },
    { slug: 'thedacare-epic-open', label: 'Thedacare — Epic Open Scheduling', organizationReference: '' },
    { slug: 'walgreens-vaccine', label: 'Walgreens — Vaccine Scheduling', organizationReference: '' },
];
```

`organizationReference` values are environment-specific FHIR resource IDs (a given destination's
Organization resource has a different `id` in dev vs. staging vs. prod). Left blank in the
committed file; whoever stands up or redeploys this app for an environment fills them in for
that environment — the same maintenance model this repo already uses for every other
environment-specific value (a plain edited value, not runtime env-var JSON parsing), since one
deployed instance of this app already targets exactly one FHIR server/environment.

A `SchedulingDestinationPicker` (plain MUI `Select`, not an `Autocomplete` — four-ish static
options don't need search) lets the user choose one; the chosen destination's
`organizationReference` feeds the request body templates below.

## Workflow steps

Four `FhirRequestConsole` instances (unmodified from PR #220 — no changes needed to that
component), arranged as MUI `Tabs`/`Tab` panels so only one is visible at a time (each console is
tall — `FhirRequestConsole`'s split-pane layout — so stacking all four vertically would be
unwieldy):

1. **Find Locations** — `POST /IHE/Location/$find`
2. **Find Appointments (ITI-115)** — `POST /IHE/Appointment/$find`
3. **Hold Appointment (ITI-116)** — `POST /IHE/Appointment/$hold`
4. **Book Appointment (ITI-117)** — `POST /IHE/Appointment/$book`

Each tab is its own `method`/`urlSuffix`/`resourceJson` state triple in `SchedulingConsoleContent`
(same controlled pattern `APIConsolePage`/`ConnectionRequestConsole` already use), pre-seeded on
mount and whenever the destination changes with:

- `urlSuffix` — the fixed path for that step (above).
- `resourceJson` — a template IHE `Parameters` resource body referencing the selected
  destination's `organizationReference` and, where the operation needs a patient,
  `Patient/person.{personId}` — reusing the existing `person.<uuid>`-as-patient-reference
  convention this app already relies on for the IPS `$summary` link on Person cards
  (`getIPSLink` in `ResourceCard.tsx`), rather than adding new Person→Patient resolution logic.

Switching destinations re-seeds all four templates (with a confirmation if a tab's body has been
hand-edited away from its template, so an in-progress edit isn't silently discarded — tracked
per-tab with a simple `isDirty` flag comparing current value to the last-seeded template).

Each console's own "Send" button and response panel (already built into `FhirRequestConsole`)
is how the user sees that step's literal request/response — no separate summary/results view.

## API client

`src/api/schedulingApi.ts`:

```ts
class SchedulingApi extends BaseApi {
    async sendRequest(params: SendRequestParams): Promise<StreamingFetchResult> {
        // identical shape to FhirApi.sendRequest / ConnectionFhirApi.sendRequest —
        // decodes streamRequest()'s chunks, JSON-parses the body, matches
        // FhirRequestConsole's `sendRequest` prop contract exactly.
    }
}
```

Constructed as `new SchedulingApi({ fhirUrl: schedulingServiceUrl, setUserDetails })` — reusing
`BaseApi`'s constructor field name (`fhirUrl`) as the generic "base URL" it already is in
practice (`TokenServiceApi` does the same for the Token Service's unrelated base URL). Default
`handleUnauthorized` (log out on 401) is correct here, unlike `ConnectionFhirApi`'s deliberate
opt-out — a 401 from `scheduling-service` means *this app's own* session is invalid, since it's
called with this app's own bearer token, not a third-party token.

`schedulingServiceUrl` comes from a new `REACT_APP_SCHEDULING_SERVICE_URL` env var, read directly
in `SchedulingConsoleContent` via `import.meta.env.REACT_APP_SCHEDULING_SERVICE_URL` — matching
`useConnections.ts`'s direct read of `REACT_APP_TOKEN_SERVICE_URL`, not routed through
`EnvironmentContext` (that context is specifically for values every page needs; this one is
scoped to a single page, like the Token Service URL is scoped to Connections).

Add `REACT_APP_SCHEDULING_SERVICE_URL='https://your-scheduling-service.example.com'` to
`.env.example`, next to the existing `REACT_APP_TOKEN_SERVICE_URL` entry.

## Error handling

- Missing `REACT_APP_SCHEDULING_SERVICE_URL` → `SchedulingConsoleContent` shows the same
  "not configured" message style `ConnectionConsolePage` uses for a missing
  `REACT_APP_TOKEN_SERVICE_URL`, instead of rendering any consoles.
- No `organizationReference` filled in for the selected destination (blank in the committed
  config, not yet filled in for this environment) → disable that destination's option in the
  picker with a tooltip explaining why, rather than letting the user send a request that's
  guaranteed to fail server-side resolution.
- Per-step failures surface exactly as `FhirRequestConsole` already renders any failure (status
  chip, JSON error body) — no new error handling needed there.

## Testing

This repo has no automated test framework (confirmed: zero `*.test.ts*` files anywhere in
`src/`; PR #225's own test plan was `yarn lint` + `yarn tsc --noEmit` + manual/live-browser
verification). This work follows the same approach:

- `yarn lint` / `yarn tsc --noEmit` clean.
- Manual verification against a dev environment with a filled-in `schedulingDestinations.ts`:
  open a real Person's card, follow the link, confirm `personId` round-trips into the
  `Patient/person.{personId}` references, run at least one destination through
  `$find` → `$hold` → `$book` by hand-copying references between tabs, and confirm switching
  destinations re-seeds templates and switching people (new `key`) resets all four tabs.

## Open questions for review

1. **Destinations config values are blank in this design** — filling in real
   `organizationReference` IDs per environment requires access to a live FHIR server to look
   up the actual Organization resources; that's a deployment-time task, not part of this
   implementation.
2. **Confirmation-on-destination-switch UX** (re-seed template vs. warn if hand-edited) is a
   judgment call above; a simpler v1 could just always re-seed and accept that a destination
   switch loses in-progress edits — flagging in case that's the preferred simpler behavior.
