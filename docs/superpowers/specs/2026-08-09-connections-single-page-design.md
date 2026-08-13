# Connections Console: Merge List + Console Into One Page — Design

## Amendment (2026-08-13): moved to fhir-tool-service

This feature has been removed from this repo (PHR-3383) and ported to
`fhir-tool-service` (DCON-5011) — see the amendment note in
`2026-08-07-connections-fhir-console-design.md` for the full rationale. Kept
as historical record, not current documentation of this repo.

## Problem

PR #220 (`docs/superpowers/specs/2026-08-07-connections-fhir-console-design.md`) added
two routes: `/connections` (`ConnectionsListPage`, a filterable/searchable list) and
`/connections/:serviceSlug/console` (`ConnectionConsolePage`, the per-connection request
console). That design explicitly considered and rejected a single combined page,
reasoning that it would mix two distinct concerns — browsing connections vs. issuing
requests against one — into a file that would grow as large as `APIConsolePage.tsx`
already is.

In review, the two-page split reads as unnecessary friction for the common case (a user
who already knows which connection they want, or is switching between a small number of
connections during one debugging session): every connection requires a full navigation
away from the console and back. A single page with a connection-picker dropdown removes
that extra hop while keeping the property the original design valued — every connection
still has its own bookmarkable/shareable URL — by keeping the slug in the URL as an
optional route param instead of a required one.

## Goal

Collapse `ConnectionsListPage` and `ConnectionConsolePage` into one page at
`/connections/:serviceSlug?`. A connection-picker dropdown replaces the list+category
filter+search UI. If the URL contains a slug that matches a connection, that connection
is preselected and its console loads immediately; otherwise the picker is shown
unselected and no console is rendered. Picking a different connection from the dropdown
updates the URL (so the connection stays bookmarkable) without a full page reload.

## Non-goals

- Everything already out of scope per the original design (`2026-08-07-connections-fhir-
  console-design.md`'s Non-goals) remains out of scope here: creating new connections,
  bulk/admin ATS endpoints, a backend proxy, automatic token refresh/polling, and wiring
  into `LastRequestContext`.
- No change to the ATS auth model, `TokenServiceApi`, or `ConnectionFhirApi` — this is a
  presentation-layer reorganization of two existing, working pages, not a change to how
  connections or tokens are fetched.
- No persistence of "recently viewed connections" beyond normal browser history.
- **Deliberate exception to the original design's non-goal of editing `APIConsolePage.
  tsx`.** See "Shared `FhirRequestConsole` component," below — its console UI is
  extracted into a shared component also used by `ConnectionRequestConsole`, the same
  category of change as the original design's already-accepted `sendStreamingRequest`
  extraction (pull shared mechanics into one place, preserve observable behavior
  exactly), one layer higher: UI/state instead of fetch internals. `APIConsolePage.tsx`'s
  own observable behavior (resizable split pane, redirect-driven auto-fetch, search-param
  sync, all response/streaming behavior) must remain identical after the extraction.

## Approaches Considered

1. **Keep two pages (status quo).** Simplest to leave alone, and the original design's
   reasoning (file size, separation of concerns) still has some truth to it. Rejected
   because it adds an extra navigation round-trip for the common case of a user who
   wants to check or switch between a few known connections, which review identified as
   real friction outweighing the file-size concern — especially once that concern is
   addressed directly (see Approach 3).
2. **Single page, all logic inline (one large `ConnectionConsolePage.tsx`).** Achieves
   the one-page goal with the least structural change — just add a dropdown and merge
   the list-fetch effect in. Rejected: this is exactly the outcome the original design
   wanted to avoid, and the file already has non-trivial request/response console logic
   before adding list-fetching, category grouping, and picker UI on top.
3. **Single page, decomposed into a thin container plus focused components
   (recommended).** `ConnectionConsolePage.tsx` becomes a thin container owning only
   routing/selection state. A new `useConnections` hook owns the list-fetch concern. A
   new `ConnectionPicker` component owns the picker UI. The existing request/response
   console logic is extracted, largely unchanged, into `ConnectionRequestConsole`. Each
   piece keeps a single responsibility and is small enough to read and reason about on
   its own — directly addressing the original design's file-size objection instead of
   reintroducing it.

**Recommendation: Approach 3.**

## Design

### Routing

- `GET /connections/:serviceSlug?` — `ConnectionConsolePage` (replaces both
  `GET /connections` and `GET /connections/:serviceSlug/console`).

`ConnectionsListPage.tsx` is deleted. `Header.tsx`'s existing "Connections" nav entry
(added in PR #220) already links to `/connections`, which continues to resolve correctly
with the optional param absent — no change needed there.

### `useConnections()` hook (new: `src/hooks/useConnections.ts`)

Lifts `ConnectionsListPage`'s existing list-fetch logic verbatim in behavior (not
copy-pasted UI): calls `tokenServiceApi.listConnections()` once on mount, tracks
`loading`/`error`/`forbidden`. Returns `{ connections, loading, error, forbidden,
reload }`. This is the only place the connections list is fetched — because the merged
page always needs the full list to populate the picker, the old "fast path" of passing a
`ConnectionEntry` via router `state` (to avoid a second list call on the console page) is
no longer needed and is removed: the container already has the full list in memory, so
resolving a `serviceSlug` to a `ConnectionEntry` is a synchronous local `find`, not a
network call.

### `ConnectionPicker.tsx` (new)

A presentational component wrapping MUI `Autocomplete`, grouped by category
(`groupBy: (option) => option.category`), replacing the old category `<Select>` +
search `<TextField>` + `<List>`. Typing filters by `display_name`/`service_slug`
(`Autocomplete`'s default filtering); options remain visually grouped/labeled by
category. Supports clearing back to no selection (MUI `Autocomplete`'s built-in clear
affordance). Each option renders the same status/expired chips the old list rows did.

Props: `connections: ConnectionEntry[]`, `loading: boolean`, `selectedSlug: string |
undefined`, `onSelect: (slug: string | null) => void`.

Also renders the two banners that belong to the connections list itself, moved
unchanged from `ConnectionsListPage`: the "Connections only work when signed in with
b.well App login" info banner (when `getLocalData('identityProvider') !== 'bwellapp'`),
and the `CONNECTIONS_FORBIDDEN_MESSAGE` warning on a 403 from `listConnections()`.

### Shared `FhirRequestConsole.tsx` component (new, extracted from `APIConsolePage.tsx`)

`APIConsolePage.tsx`'s controls bar, resizable split pane, request/response tabs,
streaming state, and `handleSend` are structurally near-identical to the console portion
of today's `ConnectionConsolePage.tsx` — both build on the same `sendRequest` method
shape already shared by `FhirApi` and `ConnectionFhirApi` (`{method, urlPath, data,
headers, onChunk, onHeaders, signal} => Promise<StreamingFetchResult>`). Rather than let
`ConnectionRequestConsole` duplicate that ~250-line UI a second time, it's extracted into
`src/components/FhirRequestConsole.tsx`, parameterized by an injected API client and a
handful of display differences:

```ts
interface FhirRequestConsoleProps {
    method: HttpMethod;
    onMethodChange: (method: HttpMethod) => void;
    urlSuffix: string;
    onUrlSuffixChange: (urlSuffix: string) => void;
    resourceJson: string;
    onResourceJsonChange: (resourceJson: string) => void;
    requestPathPlaceholder: string;
    baseUrlForDisplay?: string;          // prefix in the URL preview line; '' for APIConsolePage
    sendRequest: (params: SendRequestParams) => Promise<StreamingFetchResult>;
    sendDisabled?: boolean;              // ORed with the component's own `!requestUrl` check
    loadingRequestBody?: boolean;        // APIConsolePage's redirect-fetch spinner
    readOnlyHeaderRows?: KeyValueRow[];  // connection-mandated headers
    readOnlyHeaderRowsLabel?: string;    // e.g. "From this connection (always sent)"
}
```

`method`, `urlSuffix`, and `resourceJson` are controlled (owned by the parent) because
`APIConsolePage` needs to observe/set them from outside — syncing `method`/`urlSuffix`
into the URL's search params, and prefilling `resourceJson` from its redirect auto-fetch
effect. Nothing today needs to observe `customHeaders`, the active tabs, or the response/
streaming state from outside either page, so those stay fully internal to
`FhirRequestConsole`, same as `handleSend`, the abort-controller cleanup, and the
draggable divider (`leftWidthPercent`) — which `ConnectionRequestConsole` gets for free,
replacing its current fixed 50/50 split with the same resizable one `APIConsolePage`
already has.

`APIConsolePage.tsx` keeps everything specific to it — `EnvironmentContext`/`fhirUrl`,
the `isFromRedirect` route-param handling, its own `method`/`urlSuffix`/`resourceJson`
state plus the search-param-sync effect and redirect auto-fetch effect (passing its
`fetching` flag through as `loadingRequestBody`) — and renders `Header`, `Footer`, and
`FhirRequestConsole`, passing `sendRequest={(params) => new FhirApi({ fhirUrl,
setUserDetails }).sendRequest(params)}`. Its observable behavior does not change.

### `ConnectionRequestConsole.tsx` (new, extracted from today's `ConnectionConsolePage.tsx`)

Everything from today's `ConnectionConsolePage` below its connection-resolution effect,
minus the console UI now covered by `FhirRequestConsole`: the token-fetch effect and
`fetchToken` callback, the info bar (display name, category, status/expired chips,
patient_id with copy action, token expiry, "Refresh Token"), and its own local
`method`/`urlSuffix`/`resourceJson` state (plain `useState`, no search-param sync needed).
It renders `FhirRequestConsole`, passing `sendRequest={(params) => new ConnectionFhirApi({
baseUrl: connectionToken.url, token: connectionToken.token, customHeaders:
connectionMandatedHeaders }).sendRequest(params)}`, `sendDisabled={!connectionToken}`,
`baseUrlForDisplay={connectionToken?.url}`, and `readOnlyHeaderRows`/
`readOnlyHeaderRowsLabel` built from `connectionMandatedHeaders` exactly as today.

The only interface change from today's `ConnectionConsolePage`: it takes
`connection: ConnectionEntry` as a required prop. It no longer reads `serviceSlug` from
the route or `location.state` — it has no connection-resolution logic at all; the
container guarantees it is only ever rendered once a `connection` is resolved.

### `ConnectionConsolePage.tsx` (rewritten: thin container)

```
const { serviceSlug } = useParams();
const navigate = useNavigate();
const { connections, loading, error, forbidden, reload } = useConnections();
const connection = useMemo(
    () => connections.find((c) => c.service_slug === serviceSlug) ?? null,
    [connections, serviceSlug]
);
const notFound = !loading && !error && !forbidden && !!serviceSlug && !connection;

const handleSelect = (slug: string | null) =>
    navigate(slug ? `/connections/${encodeURIComponent(slug)}` : '/connections');
```

Renders `Header`, `ConnectionPicker` (always, passing `loading`/`connections`/
`selectedSlug={serviceSlug}`/`onSelect={handleSelect}`), the existing list-load error
banner + Retry (unchanged, calling `reload()`) when `error` is set, a "No connection
found for service slug "…"" message when `notFound` is true, and
`<ConnectionRequestConsole connection={connection} key={connection.service_slug} />`
when `connection` is truthy.

### Security: resetting state when the selected connection changes

Today, switching connections always means navigating to a new route, which mounts a
brand-new `ConnectionConsolePage` instance — old token/response state can't carry
forward because nothing carries forward across a full unmount. In the merged page,
React Router reuses the same `ConnectionConsolePage` instance across
`/connections/:serviceSlug` param changes, so without explicit handling, a stale token,
in-flight request, or displayed response from the *previous* connection could persist
in state while the UI already shows the *new* connection's name and metadata.

The fix is the `key={connection.service_slug}` on `ConnectionRequestConsole` shown
above. Changing `key` forces React to fully unmount the previous
`ConnectionRequestConsole` instance — running its existing cleanup effect, which already
aborts any in-flight request via `abortControllerRef` — and mount a fresh instance with
initial state, before that fresh instance's token-fetch effect runs for the new
connection. Because `FhirRequestConsole` is rendered as a child inside
`ConnectionRequestConsole`, its internal state (response body, streaming text, editable
custom headers) is part of the same unmounted subtree and resets along with it — the
`key` only needs to sit at the `ConnectionRequestConsole` boundary, not duplicated
further down. This guarantees no window exists where a request could go out under the
previous connection's token, or a response from one connection could be misread as
belonging to another, without hand-writing a "reset all this state" effect that would
need to be kept in sync with every field either component holds.

### Data flow summary

1. Mount → `useConnections` fetches the list once.
2. If `serviceSlug` is present in the URL, `ConnectionPicker` shows it selected as soon
   as the list resolves, and `ConnectionRequestConsole` mounts, fetching that
   connection's token.
3. If `serviceSlug` is present but doesn't match any connection once the list has
   loaded successfully (not while `error` or `forbidden` is set — those already have
   their own banners, and stacking a "not found" message on top of them would be
   misleading rather than helpful), the container shows the not-found message; the
   picker remains usable so the user can pick a real connection.
4. Selecting a different connection in the picker calls `handleSelect(slug)` →
   `navigate(`/connections/${slug}`)` (a normal push navigation, so back/forward step
   through each previously viewed connection, consistent with the old list→console
   two-step flow and with every connection remaining independently linkable) →
   `serviceSlug` changes → `connection` recalculates → the `key` change remounts
   `ConnectionRequestConsole` per the security section above.
5. Clearing the picker calls `handleSelect(null)` → `navigate('/connections')` → 
   `connection` is `null` → `ConnectionRequestConsole` unmounts and nothing is rendered
   in its place, matching `ConnectionsListPage`'s old empty-selection state.

### Error handling summary

Unchanged three-tier shape from the original design, relocated rather than redesigned:

- `listConnections()` 401 → already handled by `TokenServiceApi`'s inherited
  `BaseApi.handleUnauthorized` (logout), same as before.
- `listConnections()` 403 → `CONNECTIONS_FORBIDDEN_MESSAGE` banner, now rendered by
  `ConnectionPicker` instead of `ConnectionsListPage`.
- `listConnections()` other failures → inline error banner + "Retry" (`reload()`), now
  rendered by the `ConnectionConsolePage` container instead of `ConnectionsListPage`.
- `getConnectionToken()` 403/401/other failures → unchanged, still handled entirely
  inside `ConnectionRequestConsole` exactly as `ConnectionConsolePage` handles them
  today.

## Testing

No automated test framework in this repo (consistent with every other plan here) —
manual verification only:

- `yarn lint` / `yarn tsc --noEmit` clean throughout.
- Direct navigation to `/connections/<validSlug>` preselects that connection in the
  picker and loads its console immediately, with no extra click required.
- Direct navigation to `/connections/<bogusSlug>` shows the not-found message; the
  picker is still usable to select a real connection from there.
- Navigating to bare `/connections` shows the picker unselected and no console.
- Selecting a connection from the picker updates the URL and loads its console without a
  full page reload.
- Switching from connection A to connection B: no flash of A's token, patient_id, or
  response body while B's header/metadata is already showing; if a request against A was
  in flight when B is selected, it is observably cancelled (e.g. visible as
  cancelled/aborted in the browser's network inspector) rather than completing and
  populating B's response panel.
- Browser back/forward after selecting several connections in sequence step through
  each connection's URL and reload its console correctly.
- Clearing the picker's selection returns to bare `/connections`; back button from there
  leaves `/connections` for whatever page linked into it.
- Category grouping in the picker matches the categories previously shown by the
  category `<Select>`; typing in the picker filters by both display name and service
  slug, matching the old search box's behavior.
- The "sign in with b.well App login" info banner and the 403
  "not available for delegated accounts" banner still appear in the same conditions as
  they did on `ConnectionsListPage`.
- Everything from the original design's testing section that isn't superseded by the
  above remains valid unchanged: token refresh, sending requests against a real
  connection FHIR server, connection-mandated custom headers appearing read-only and on
  the outgoing request, an ATS 401 logging the user out, an ATS 403 showing the
  "not available" message, and `Header.tsx`'s "Open in API Console" button remaining
  unaffected.
- `/api-console` regression pass after the `FhirRequestConsole` extraction: standalone
  usage (method/urlSuffix persist in and restore from the URL's search params), redirect
  usage from a `ResourceCard` (path prefills from route params, body prefills from the
  auto-fetched resource, the loading spinner shows while fetching), the split pane is
  still resizable via the draggable divider, and streaming/response behavior is
  unchanged — this page's observable behavior must be identical before and after the
  extraction.
- The connection console's split pane is now resizable (previously fixed 50/50) — confirm
  this reads as an improvement rather than a regression.
