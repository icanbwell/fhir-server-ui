# Connections Console: Token Service Connections + Free-Form FHIR Requests — Design

## Problem

A logged-in member's health data often doesn't live only on b.well's own FHIR server —
it's spread across external source systems (payers, EHRs) that b.well has brokered
OAuth connections to via the Aperture Token Service ("ATS" / "Token Service"). Today
this UI has no way to see those connections or query the FHIR server behind one of
them. `/api-console` (`APIConsolePage.tsx`) only ever talks to this app's own configured
FHIR server (`REACT_APP_FHIR_SERVER_URL`), using the logged-in user's own b.well session
token — by design, `FhirApi.sendRequest` refuses to let a request leave that one origin.

Reference: `helix.pipelines/library/pipelines/patient_access/docs/token-service-connection-and-fhir-flow.md`
documents the three-step flow this design implements: list a member's ATS connections,
pick one and fetch/refresh its token, then call that connection's own FHIR server with
that token.

## Goal

A new pair of screens that let a logged-in user: 1) see their Token Service connections,
2) pick one and fetch a fresh token for it, and 3) run a free-form request (styled after
`/api-console`) against that connection's own FHIR server using that connection's token —
not the local session's.

## Non-goals

- **Creating new connections.** No OAuth grant flow (`/oauth/generate_url` /
  `/oauth/callback`). Read-only exploration of connections that already exist.
- **Bulk/admin endpoints.** No `/all-tokens` (unfiltered), `/all-tokens-by-category`,
  `/refresh-tokens` (batch), or `/update_token_status`. Only the single-connection list +
  single-connection token flow the reference doc describes.
- **A backend proxy.** Like the rest of this app, requests are sent directly from the
  browser. See Open Questions — this is the single biggest risk in this design and is
  called out, not silently assumed away.
- **Automatic token refresh / polling.** The connection's token is fetched once per page
  load; a manual "Refresh Token" button re-fetches it. No background timers.
- **Request history across connections, or wiring into `Header.tsx`'s "Open in API
  Console" / `LastRequestContext` mechanism.** That mechanism is specific to requests
  against this app's own configured FHIR server; a connection's FHIR server is a
  different trust boundary and must not feed into it (see Design, "Non-wiring to
  LastRequestContext").
- **Editing `APIConsolePage.tsx`'s UI/behavior.** It is reused only via a small, genuinely
  shared utility extracted from `FhirApi.sendRequest` (see Design, "Shared streaming-fetch
  utility"); its own behavior is unchanged.

## Open Questions

These need answers before (or very early during) implementation. Each has a stated
working assumption so the plan isn't blocked, but the assumption should be verified,
ideally with a throwaway spike against one real staging connection, before building out
every task below.

1. **CORS.** Connection FHIR servers are third-party systems (e.g. `vteapif1.aetna.com`)
   outside b.well's control. A browser `fetch()` from this app's origin to that origin
   only succeeds if the target server returns permissive CORS headers — not guaranteed
   for every source system. *Working assumption:* enough real connections support it to
   be useful; the design surfaces a clear "may be a CORS restriction" message when a
   request fails with no HTTP status (fetch cannot distinguish CORS failures from other
   network errors). If CORS blocks most real connections in practice, this design's
   no-backend-proxy approach would need to be revisited as a separate follow-up.
2. ~~Auth model for calling ATS~~ **Resolved — and it invalidates this design's core
   premise.** Confirmed by reading `aperture_token_service` directly (not guessing):
   `GET /tokens` and `GET /all-tokens/{service_slug}/` are both guarded by
   `Depends(get_service_user)` (`routers/token.py:174-179,307-316`), which validates only
   against `COGNITO_JWKS_ISSUER`/`DESCOPE_JWKS_ISSUER`/`OKTA_JWKS_ISSUER` — a set of
   issuers that is **disjoint from `EXTERNAL_JWKS`** (the member-login issuers) in every
   environment's Helm values (dev, staging, prod, client-sandbox). A member's own b.well
   JWT will 401 on both routes, full stop — this isn't a scope/claim nuance, it's a
   completely different, non-overlapping set of trusted signers. The reference doc's own
   "auth model caveat" assumption is simply wrong for these two routes.

   There **are** member-authenticated equivalents (`get_current_user`/
   `restrict_delegated_user_rest`, which validate against `EXTERNAL_JWKS` — the same
   trust boundary as this app's own FHIR server), but they don't return what step 3 of the
   flow needs:
   - `GET /get-member-connections` (REST, `routers/token.py:570-573`) and the equivalent
     GraphQL `Query.get_member_connections` — list connections, but only
     `{value (service_slug), display, expired, category, status, is_direct,
     number_of_resources}`. No `member_id`, `patient_id`, `fhir_url`, or token.
   - `GET /get-member-token/{service_slug}/` (REST, `routers/token.py:538-543`) — returns
     only `{"hasValidToken": true|false}`, a boolean existence check, not the token value.
   - The GraphQL `DataSource`/`Connection` types (`token/graphql/types.py:144-179`) are
     metadata only (name, category, sync status, consent policy URL) — no token or FHIR
     URL field exists anywhere in the member-facing surface.

   **There is currently no member-authenticated API in this ATS service that returns the
   raw connection token + FHIR base URL a browser would need to call a connection's FHIR
   server directly.** That capability exists only behind service (client-credentials)
   auth, which a browser SPA cannot hold without exposing a secret usable to pull anyone's
   connection tokens. This is a genuine architecture gap, not a detail to route around
   client-side — see "Architecture Options" below.

## Architecture Options (blocking — needs a decision before implementation)

Given Open Question 2's finding, step 3 of the original three-step flow (browser calls
the connection's FHIR server directly, using a token fetched client-side) is not
achievable against ATS's current API surface. Three ways forward:

**A. Add a backend proxy.** Something server-side (new endpoint on an existing b.well
backend, or a small new service) holds ATS service credentials, does the
service-authenticated `/tokens` + `/all-tokens/{slug}` calls on the member's behalf
(scoped by their `client_fhir_person_id`/`bwell_fhir_person_id`, which the existing
member-facing endpoints already prove is derivable from their JWT), and either (A1) hands
the raw connection token + URL back to the browser (same shape this design already
assumed, just fetched through a proxy instead of directly) or (A2) proxies the actual FHIR
request too, so the browser never holds a third-party OAuth token at all. **This is new
backend work outside `fhir-server-ui`** (a pure static SPA today, confirmed — no server
directory, `Dockerfile` just serves the built static assets) — a separate project, not a
task addable to this plan.

**B. Extend ATS's member-facing surface.** Ask the ATS team to extend
`/get-member-token/{service_slug}/` (already `restrict_delegated_user_rest`-guarded, so
delegated users are already excluded) to return the full `{token, url, fhir_version,
patient_id, expiry}` payload instead of just `hasValidToken`. Smaller, more targeted
change than A, but it's a change to a service `fhir-server-ui` doesn't own — needs
buy-in/prioritization from whoever owns `aperture_token_service`.

**C. Descope to what member endpoints already support.** Ship a read-only "My
Connections" screen — list connections and their status/validity via
`/get-member-connections` + `/get-member-token/{slug}/`'s boolean — without the "run a
FHIR request against it" capability. This is buildable today with zero new backend work,
but doesn't deliver the original ask (exploring a connection's actual FHIR data).

This design's remaining sections (routing, `TokenServiceApi`, `ConnectionFhirApi`, the two
pages) describe the flow **as if** a member-authenticated token+URL endpoint exists,
because that's the shape needed regardless of which of A/B is chosen — only
`TokenServiceApi`'s auth/endpoint details change once a direction is picked. Do not build
against `/tokens`/`/all-tokens/{slug}` directly from this SPA using the session JWT; it
will 401 for every real user.
3. ~~ATS base URL for the `dev` environment~~ **Resolved:**
   `https://aperture-token-service.dev-ue1.icanbwell.com/api/v1.0` (from
   `aperture_token_service/.helm/dev-ue1.values.yaml`'s ingress host config, combined with
   the `/api/v1.0` route prefix set in `aperture_token_service/main.py`). Both new pages
   still show a clear config-error message (mirroring `BwellAppLogin`'s `configError`
   pattern) if this env var is ever unset, rather than crashing.
4. ~~Should this be gated to a specific identity provider?~~ **Resolved:** this only works
   with b.well App (`bwellapp`) logins. Don't hard-block other providers from reaching
   `/connections` (ATS's own response — empty list or a 401 — still communicates failure
   for them), but show a clear informational banner when `identityProvider !== 'bwellapp'`
   so a user signed in another way isn't left guessing why the list is empty or erroring.

## Approaches Considered

1. **Extend `APIConsolePage` with a "connection source" toggle.** Rejected — it entangles
   two materially different trust boundaries (this app's own FHIR server + session token,
   vs. an arbitrary external FHIR server + per-connection token that must never be
   confused with the session token) into one component, and adds risk to a page that was
   just deliberately simplified (PR #218).
2. **One combined page, wizard-style (list phase → console phase in the same component).**
   Simpler routing (one route), but not bookmarkable/shareable to a specific connection,
   and mixes two distinct concerns (browsing connections vs. issuing requests against one)
   into a single file that would grow as large as `APIConsolePage.tsx` already is.
3. **Two routes: a connections list page, and a per-connection console page (recommended).**
   `/connections` lists connections; clicking one navigates to
   `/connections/:serviceSlug/console`, which is independently bookmarkable/shareable
   (consistent with how every FHIR resource in this app already has its own addressable
   route) and re-fetches a fresh token on load — matching ATS's own "call this again to
   refresh" semantics. Each page stays small and single-purpose.

**Recommendation: Option 3.**

## Design

### Routing

- `GET /connections` — `ConnectionsListPage`
- `GET /connections/:serviceSlug/console?member_id=<id>` — `ConnectionConsolePage`

`member_id` is a query param (not a route param) because it's ATS-internal identifying
data for step 2 of the flow, not something the UI treats as part of "which page is this."

### Data layer

**`src/types/connectionEntry.ts`** — types matching the ATS response shapes documented in
the reference doc (`ConnectionEntry` fixture, `connection_entry.py:225-273`):

```ts
export interface ConnectionEntry {
    bwell_fhir_person_id: string;
    client_fhir_person_id: string;
    member_id: string;
    patient_id: string;
    display_name: string;
    service_slug: string;
    category: string;
    status: string;
    fhir_url: string;
    fhir_version: string;
    expiry: string;
    unique_identifier: string;
    scope: string;
    custom_fhir_api_headers?: string;
}

export interface ListConnectionsResponse {
    data: ConnectionEntry[];
    next_cursor: string | null;
}

export interface ConnectionToken {
    token: string;
    url: string;
    fhir_version: string;
    patient_id: string;
    expiry: string;
}
```

**`src/api/tokenServiceApi.ts`** — `TokenServiceApi extends BaseApi`, constructed with
`fhirUrl: import.meta.env.REACT_APP_TOKEN_SERVICE_URL` (a new env var; `BaseApi`'s
`fhirUrl` field is generically "the base URL this instance talks to," so this reuse is
consistent with its existing behavior, not a hack). Reusing `BaseApi` here is deliberate:
its axios interceptor already attaches the session's own bearer token exactly the way
step 1/2 of the reference doc's flow requires (Open Question 2), and its existing
`handleUnauthorized` (401 → log the whole app out) is *correct* here — a 401 from ATS
itself means the member's b.well session is invalid, unlike a 401 from a connection's own
FHIR server (see `ConnectionFhirApi`, below, which must NOT trigger that).

Two methods: `listConnections({category?, serviceSlug?, cursor?, limit?})` → GET `/tokens`
with those as query params (`limit` defaulting to 50), and
`getConnectionToken({serviceSlug, memberId})` → GET `/all-tokens/{serviceSlug}/?member_id=...`
— the trailing slash before the query string is required (the reference doc explains ATS
302-redirects a request missing it, and the `Authorization` header doesn't survive that
redirect).

### Shared streaming-fetch utility

`FhirApi.sendRequest` (`src/api/fhirApi.ts`) already contains exactly the fetch/streaming/
abort/partial-body-on-drop mechanics the new connection console needs for a good UX
(status arrives before the body finishes, chunks stream into the UI, a mid-stream drop
still surfaces what arrived instead of throwing). But that method also hard-codes two
things that are *wrong* for a connection's FHIR server: it pins the request to
`this.getBaseUrl()`'s origin (the whole point of the connection console is to leave that
origin), and its headers always come from the local session's token via `buildHeaders`
(a connection request must send the *connection's* token instead, never the session's).

Rather than duplicate ~80 lines of streaming/abort/parsing logic verbatim into a second
file (a real duplication smell, not a style preference — the two copies would drift), the
mechanics-only part is extracted into **`src/utils/streamingFetch.ts`**, exporting a pure
`sendStreamingRequest({url, method, data, headers, signal, onChunk, onHeaders})` with no
knowledge of sessions, origins, or auth. `FhirApi.sendRequest` keeps its origin check and
`buildHeaders` call, then delegates the actual request to this utility, and calls
`handleUnauthorized` on the returned status afterward (a small, behavior-neutral
reordering from today's "check unauthorized before reading the body" — the check doesn't
depend on the body, so this doesn't change when a 401 triggers logout in any way a user
could observe). `ConnectionFhirApi` (below) calls the same utility with its own headers
and base URL, and deliberately does **not** call `handleUnauthorized`.

### `src/api/connectionFhirApi.ts`

A small class, independent of `BaseApi` (its constructor/interceptor model is tightly
bound to "the one configured FHIR server + the local session token," which is exactly the
coupling this class must avoid):

```ts
class ConnectionFhirApi {
    constructor({ baseUrl, token, customHeaders }: {
        baseUrl: string;
        token: string;
        customHeaders?: Record<string, string>;
    });

    sendRequest(params: {
        method: HttpMethod;
        urlPath: string;
        data?: object;
        headers?: Record<string, string>;
        onChunk?: (text: string) => void;
        onHeaders?: (status: number, headers: Record<string, string>) => void;
        signal?: AbortSignal;
    }): Promise<StreamingFetchResult>;
}
```

`sendRequest` resolves `urlPath` against `baseUrl` (validated as `http:`/`https:` — the
base URL ultimately comes from an ATS server response, a trusted b.well backend, but
failing closed on an unexpected shape is cheap insurance), merges headers in this order:
connection-mandated `customHeaders` (e.g. `custom_fhir_api_headers` such as
`X-FHIR-TENANT-ID`) → caller-supplied headers (a caller can never set `Authorization`,
same invariant `BaseApi.buildHeaders` already enforces for the session token) →
`Authorization: Bearer <connection token>` always wins. On a non-2xx status it does
**not** call `handleUnauthorized` / log the user out — a 401 here means the *connection's*
token is stale (the fix is the console's "Refresh Token" button, not an app-wide logout).

### `ConnectionsListPage` (`/connections`)

Same `Header`/`Footer` chrome as other pages. If `getLocalData('identityProvider') !==
'bwellapp'`, renders an informational banner ("Connections only work when signed in with
b.well App login") above everything else — not a hard block, since ATS's own response is
the real source of truth, but set expectations before a user wonders why the list is
empty. On mount, calls
`tokenServiceApi.listConnections({ limit: 50 })`. Renders: a category filter (`<Select>`,
options derived from the categories present in the loaded page, "All" default), a
client-side text search over `display_name`/`service_slug`, and a list of rows (display
name, category, status chip, FHIR version, expiry) — clicking a row navigates to
`/connections/${service_slug}/console?member_id=${member_id}`, passing the full
`ConnectionEntry` via router `state` so the console page has a fast path to the metadata
it needs (`custom_fhir_api_headers`, `display_name`, `category`) without a second list
call. A "Load more" button appears when `next_cursor` is non-null. Loading spinner, empty
state ("No connections found"), and an error banner with "Retry" for non-401 failures — a
401 is already handled by `TokenServiceApi`'s inherited `handleUnauthorized`.

### `ConnectionConsolePage` (`/connections/:serviceSlug/console`)

Reads `serviceSlug` from the route and `member_id` from the query string. Resolves the
`ConnectionEntry` for header/metadata display: prefers `location.state?.connection` (the
fast path from a list click); if absent (direct navigation, bookmark, or a page refresh),
falls back to `tokenServiceApi.listConnections({ serviceSlug })` and takes `data[0]`. Once
resolved, calls `tokenServiceApi.getConnectionToken({ serviceSlug, memberId })` to get the
connection's token/url/patient_id; a "Refresh Token" button re-runs the same call on
demand (no auto-polling, per Non-goals).

Above the console: an info bar (display name, category, status chip, FHIR version,
`patient_id` with a copy-to-clipboard action, token expiry, "Refresh Token" button).

Below it: a request console laid out like `/api-console`'s controls + split pane (Method
`<Select>`, a free-form "Request Path" `TextField` — helper text example referencing the
`patient_id` shown above, e.g. `e.g. /Patient/<patient_id>`, a Send button, a Request
panel with Body/Headers tabs, a Response panel with Body/Headers tabs, streaming response
text while in flight) — wired to a `ConnectionFhirApi` built from the resolved connection
(`baseUrl: connectionToken.url`, `token: connectionToken.token`, `customHeaders`: the
connection's `custom_fhir_api_headers`, JSON-parsed). The Headers tab on the Request panel
shows the connection-mandated headers as read-only rows (via `KeyValueRows`'s existing
`readOnly` prop) in a clearly labeled "From this connection (always sent)" group, separate
from the user's own editable custom headers below it.

### Non-wiring to `LastRequestContext`

`Header.tsx`'s "Open in API Console" button opens `/api-console` prefilled from
`LastRequestContext`, which only ever makes sense for a request against this app's own
FHIR server. `ConnectionFhirApi`/`ConnectionConsolePage` never calls `recordRequest` —
this isn't an omission to fix later, it's required correctness: if a connection request
populated `LastRequestContext`, that button would silently offer to replay a third-party
FHIR server's request against this app's own FHIR server instead. Not calling it means the
button naturally stays in its already-correct "no request captured on this page" state
while viewing the connection console, with no extra conditional logic needed anywhere.

### Navigation entry point

`Header.tsx` gains one more `IconButton` (after the existing "Open in API Console" one),
visible only when `userDetails` is set (same condition already used for the
Login/Logout button), linking to `/connections`.

### Error handling

- ATS list/token calls failing with 401 → already handled: `TokenServiceApi` inherits
  `BaseApi.handleUnauthorized`, which logs the user out — the same behavior every other
  API call in this app already has on a 401.
- ATS list/token calls failing with any other status → inline error banner + "Retry".
- A connection FHIR server request failing → `fetch()` cannot distinguish a CORS
  rejection from a generic network failure, so `ConnectionFhirApi`'s error path (same
  shape `sendStreamingRequest`/`FhirApi.sendRequest` already use:
  `{status: undefined, json: {error: ...}}`) uses a message that names CORS as a likely
  cause, since that's the design's largest known risk (Open Question 1) and a user seeing
  an opaque failure needs a starting hypothesis.

## Testing

No automated test framework exists in this repo (consistent with every other plan here) —
manual verification only:

- `yarn lint` / `yarn tsc --noEmit` clean throughout.
- `/connections` loads a real list of ATS connections (staging), category filter and
  search narrow the list, "Load more" works if more than one page exists.
- Clicking a connection opens its console pre-filled with a fetched token and the right
  metadata; "Refresh Token" re-fetches without navigating away.
- Sending a request against at least one real, reachable connection FHIR server —
  confirms or refutes Open Question 1 (CORS) in practice.
- A connection with a non-empty `custom_fhir_api_headers` shows those headers as read-only
  and they're actually present on the outgoing request (verify via the target server's
  response or a network inspector).
- Direct navigation to a console URL (paste it fresh, no router `state`) still resolves
  the connection via the list-by-slug fallback.
- An ATS 401 (e.g. an intentionally expired/invalid session) logs the user out, matching
  every other API call's existing behavior.
- Existing `/api-console` and `Header.tsx`'s "Open in API Console" button are unaffected
  (the shared `sendStreamingRequest` extraction must not change `FhirApi`'s observable
  behavior).
