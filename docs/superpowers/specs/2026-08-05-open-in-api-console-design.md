# Open in API Console — Design

## Problem

When something on a page looks wrong — a resource fails to load, a search returns the
wrong results, a viewer errors out — the fastest way to troubleshoot is to see the exact
FHIR request the page issued and re-run it (with tweaks) against the server directly.
Today that means guessing the URL by hand and rebuilding it in `/api-console`
(`APIConsolePage.tsx`). There's no way to jump from "this page is broken" straight to
"here's the request it made, edit and resend."

## Goal

Add an "Open in API Console" control that, from any page, opens `/api-console` in a new
tab pre-filled with the method and URL of the most recent FHIR request that page issued —
without sending it, so the user can inspect or tweak it first.

## Non-goals

- **Request body / custom headers.** An audit of every FHIR call site in the app
  (`src/api/baseApi.ts`'s `getData`/`request`, `src/api/fhirApi.ts`'s `sendRequest`) found
  that real page-issued traffic today is 100% GET, with no body: `IndexPage.tsx` fires one
  `getBundleAsync` GET per navigation (covering show/search/`_history`), and
  `CompositionSummaryPage.tsx`/`SpreadsheetViewer.tsx`/`IPSViewer.tsx` each fire a single GET
  of their own. The one mutating flow in the app (`ResourceCard`'s "Edit Resource" →
  `$merge`) already has its own dedicated redirect into the console
  (`isFromRedirect` in `APIConsolePage.tsx`) and is untouched by this design. Capturing
  bodies/headers would need a different transport than URL query params (session storage,
  since bodies can be large/sensitive) for a case that doesn't exist yet — deferred until
  it does.
- **Auto-sending the captured request.** The control prefills; the user clicks Send.
- **`/admin` backend traffic.** `AdminApi` (used by `src/pages/customResources/ExportStatus.tsx`)
  is a separate, unrelated backend and is not wired into capture.
- **Persistence across page reloads.** In-memory only, same as the console's own
  session-only state (`resourceJson`, custom headers, etc. already don't survive a
  refresh).
- **Capturing `downloadFile`** (blob downloads used by `IPSViewer`/`SpreadsheetViewer`/
  `FileDownload` for binary content) — not meaningfully replayable as a JSON console
  request.
- **New access control.** The control is only ever as reachable as `/api-console` already
  is today (any signed-in user) and as `Header.tsx` already is (rendered on ~12
  authenticated pages).

## Existing building blocks this design reuses

- **`/api-console`'s free-form path support** (PR 213): when `selectedResourceType` is
  empty, `urlSuffix` is sent as the literal, complete request path
  (`APIConsolePage.tsx`'s `requestUrl` memo). This means prefilling the console from an
  arbitrary captured URL needs no new parsing on the console side — just
  `?method=<M>&urlSuffix=<url>`.
- **`APIConsolePage`'s existing `useSearchParams` read** (`APIConsolePage.tsx:57-73`)
  already initializes `method`/`urlSuffix` from the URL on the standalone route. Unmodified.
- **One chokepoint per API surface.** All real FHIR-page traffic passes through
  `BaseApi.getData`/`BaseApi.request` or `FhirApi.sendRequest` — no page issues raw
  `fetch`/`axios`. This is the same property PR 213 relied on for its origin check and
  `handleUnauthorized` extraction, and it's what makes a single capture point sufficient
  here instead of touching every page.

## Design

### 1. Capture: `BaseApi` gains an optional `onRequest` hook

`BaseApi`'s constructor accepts an optional
`onRequest?: (info: { method: string; url: string }) => void`. `getData` calls
`this.onRequest?.({ method: 'GET', url: urlString })` and `request` calls
`this.onRequest?.({ method, url: urlString })`, in both cases right before the
axios/fetch call fires — so a request that later errors or times out is still captured
(the actual troubleshooting case). `FhirApi.sendRequest` (which doesn't call the
inherited `getData`/`request`) makes the same call directly, since it's the one other
place traffic leaves the app.

Only the call sites that construct `FhirApi`/`BaseApi` for genuine FHIR-page traffic pass
this hook, sourced from the new context (below):

- `IndexPage.tsx` (both instantiations — initial load and `handleSearch`)
- `CompositionSummaryPage.tsx`
- `SpreadsheetViewer.tsx`
- `IPSViewer.tsx`

`AdminApi` (`ExportStatus.tsx`) and the module-level version check in
`EnvironmentContext.ts` do not pass it.

### 2. Storage: `LastRequestContext`

A new context/provider, `src/context/LastRequestContext.tsx`, following the existing
pattern of `EnvironmentContext`/`UserContext`. State shape:

```ts
type LastRequest = { method: string; url: string; pathname: string } | null;
```

The context exposes `lastRequest` and a setter `recordRequest(info: { method: string; url: string })`
that internally stamps `pathname: window.location.pathname` before storing — callers never
supply `pathname` themselves. Provider is mounted once in `App.tsx`, wrapping the
authenticated `<Outlet>` alongside the existing context providers, so it's available to
every page and to `Header`.

### 3. Why `pathname`-tagged, not reset-on-navigate

An earlier version of this design cleared `lastRequest` in a route-change effect. That's
fragile: it depends on React committing the "reset" effect (declared high in the tree, in
`App.tsx`) before the fetching page's own effect populates a fresh value in the same
commit — an ordering guarantee that holds today by accident of where each effect happens
to be declared, and would silently break if someone reordered JSX later.

Instead, `Header` (see below) only treats `lastRequest` as valid when
`lastRequest.pathname === window.location.pathname`. Navigating to a page that hasn't
fetched anything yet (or never will — `HomePage`, error pages) makes the stamped pathname
stale by comparison, so the control naturally reports "nothing to show" with no extra
effect and no cross-component ordering dependency.

### 4. UI: a button in `Header.tsx`

`Header.tsx` already reads `EnvironmentContext`/`UserContext`/`ThemeContext` via
`useContext` and is rendered directly by ~12 page components (not a shared layout route) —
it is, in practice, the one place that appears on nearly every authenticated page. It gains
one more `useContext(LastRequestContext)` call and a small icon button:

- **Enabled** when `lastRequest` is non-null and `lastRequest.pathname === window.location.pathname`.
- **Disabled** (or hidden, TBD in implementation — see Open questions) otherwise, with a
  tooltip explaining why ("No request captured on this page yet").
- `onClick` (or `href`, if implemented as an anchor) builds
  `/api-console?method=<lastRequest.method>&urlSuffix=<encodeURIComponent(lastRequest.url)>`
  and opens it via `target="_blank" rel="noopener noreferrer"` — matching
  `ResourceCard.tsx`'s existing pattern for IPS/Composition/Excel links, so the original
  page stays open for comparison.
- `method` is omitted from the query string when it's `'GET'`, matching
  `APIConsolePage`'s own search-param sync convention (`APIConsolePage.tsx:98-100`) — not
  required for correctness (the console defaults to GET), just consistent with the
  existing code's style.

### 5. Data flow (end to end)

Page mounts → constructs `FhirApi`/`BaseApi` with `onRequest: recordRequest` → issues its
GET → hook fires before the network call → context stamps `pathname` and stores →
`Header` re-renders (context consumer) → button enables → click → new tab opens
`/api-console` with `method`/`urlSuffix` prefilled from the captured request → user
inspects/edits → clicks Send when ready.

## Testing

Manual only, matching this repo's existing convention (no automated test framework):

- `yarn lint` / `yarn tsc --noEmit` clean.
- Resource search and show pages: button opens the console in a new tab, prefilled with
  the exact GET the page issued, not yet sent.
- `IPSViewer`, `SpreadsheetViewer`, `CompositionSummaryPage`: same, each reflecting its own
  request.
- A page that hasn't fetched anything yet (e.g. `HomePage` right after login): button
  stays disabled.
- Navigate from a fetching page to a non-fetching page: button goes back to disabled
  rather than showing the previous page's stale request.
- Existing `ResourceCard` → "Edit Resource" → `$merge` redirect-into-console flow:
  unaffected (separate mechanism, untouched by this design).

## Open questions

- Disabled-but-visible vs. fully hidden when there's nothing captured — implementation
  detail, doesn't change the architecture; default to disabled-with-tooltip unless the
  implementation plan finds a strong reason otherwise.
