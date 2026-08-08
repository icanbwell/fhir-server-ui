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
describes a three-step flow (list connections, fetch a connection's token, call its FHIR
server) written from the pipeline's own service-authenticated perspective — see
"Auth model decision" below for where this design departs from it.

## Goal

A new pair of screens that let a logged-in user: 1) see their Token Service connections,
2) pick one and fetch a fresh token for it, and 3) run a free-form request (styled after
`/api-console`) against that connection's own FHIR server using that connection's token —
not the local session's.

## Non-goals

- **Creating new connections.** No OAuth grant flow (`/oauth/generate_url` /
  `/oauth/callback`). Read-only exploration of connections that already exist.
- **Bulk/admin/service-authenticated endpoints.** No `/tokens`, `/all-tokens`,
  `/all-tokens-by-category`, `/refresh-tokens` (batch), or `/update_token_status` — see
  "Auth model decision," this SPA only ever calls member-authenticated ATS endpoints.
- **A backend proxy.** Requests are sent directly from the browser, same as every other
  page in this app. See "CORS," below — this is the design's largest remaining risk and
  is called out, not silently assumed away.
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

## Auth model decision (resolved after reading `aperture_token_service` directly)

The reference doc assumes a member's own b.well JWT can be used on ATS's `/tokens` and
`/all-tokens/{slug}/` endpoints. That's wrong: both are guarded by
`Depends(get_service_user)` (`routers/token.py:174-179,307-316`), which validates only
against `COGNITO_JWKS_ISSUER`/`DESCOPE_JWKS_ISSUER`/`OKTA_JWKS_ISSUER` — a set of issuers
**disjoint from `EXTERNAL_JWKS`** (the member-login issuers) in every environment's Helm
values (dev, staging, prod, client-sandbox). A member JWT 401s on both, full stop.

The member-authenticated equivalents that validate against `EXTERNAL_JWKS` —
`GET /get-member-connections` (list) and `GET /get-member-token/{slug}/` (a
`hasValidToken` boolean) — don't return the raw token or FHIR URL a browser needs for
step 3. Rather than build a backend proxy (a separate project) or silently 401 for every
real user, `aperture_token_service` gets one new, additive, member-authenticated
endpoint: **`GET /get-member-connection-token/{service_slug}/`**, returning
`{token, url, fhir_version, patient_id, expiry, custom_fhir_api_headers}`, scoped
strictly to the calling member's own `member_id` claim (never a client-supplied
parameter — the same property that makes it safe to expose without service auth). See
`aperture_token_service`'s own
`docs/superpowers/specs/2026-08-07-member-connection-token-endpoint-design.md` and
paired plan for that side of the work — **this SPA's implementation depends on that
endpoint existing**, and must not be built against `/tokens`/`/all-tokens/{slug}` in the
meantime.

This SPA therefore only ever calls two ATS endpoints, both member-authenticated (same
trust boundary — `EXTERNAL_JWKS` — as this app's own FHIR server calls):
`GET /get-member-connections` and `GET /get-member-connection-token/{service_slug}/`.

### Consequence: `restrict_delegated_user_rest` (HTTP 403)

Only `GET /get-member-connection-token/{service_slug}/` enforces
`restrict_delegated_user_rest`, rejecting a delegated/authorized-representative user's
token with 403 before touching the database. `GET /get-member-connections` uses the
less restrictive `get_current_user` and does not reject delegated users. `BaseApi.
handleUnauthorized` only acts on 401 (session-invalid → logout), so a 403 passes through
untouched to `TokenServiceApi`'s caller as `{status: 403, json: {...}}` — the console
page must show an explicit "not available for delegated accounts" message on 403 from
the token-fetch endpoint, rather than a generic error or a silent failure. The list
page's equivalent 403 handling for `GET /get-member-connections` is defensive code for a
case that endpoint doesn't actually produce, not dead-wrong code.

### Remaining open question: CORS

Connection FHIR servers are third-party systems (e.g. `vteapif1.aetna.com`) outside
b.well's control. A browser `fetch()` from this app's origin only succeeds if the target
server returns permissive CORS headers — not guaranteed for every source system, and
`fetch()` cannot distinguish a CORS rejection from any other network failure. Per
discussion, this is expected to be fine for the connections that matter but should be
verified by testing against a real one; `ConnectionFhirApi`'s error path names CORS as a
likely cause when a request fails with no HTTP status, so a user (and whoever debugs a
report) has a starting hypothesis rather than an opaque failure.

## Approaches Considered (page structure)

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
   route) and re-fetches a fresh token on load. Each page stays small and single-purpose.

**Recommendation: Option 3.**

## Design

### Routing

- `GET /connections` — `ConnectionsListPage`
- `GET /connections/:serviceSlug/console` — `ConnectionConsolePage`

No query params: the resolved auth model derives the member's identity entirely from
their JWT server-side, so there's no `member_id` (or anything else) the client needs to
carry between the two pages beyond the slug already in the route.

### Data layer

**`src/types/connectionEntry.ts`**:

```ts
export interface ConnectionEntry {
    service_slug: string;
    display_name: string;
    category: string;
    status: string;
    expired: boolean;
    is_direct: boolean;
    number_of_resources: number;
}

export interface ConnectionToken {
    token: string;
    url: string;
    fhir_version: string;
    patient_id: string;
    expiry: string;
    custom_fhir_api_headers?: string;
}
```

`ConnectionEntry` intentionally has no `member_id`, `patient_id`, `fhir_url`, or token —
`GET /get-member-connections` (below) doesn't return any of those; they only become
available once a specific connection's token is fetched.

**`src/api/tokenServiceApi.ts`** — `TokenServiceApi extends BaseApi`, constructed with
`fhirUrl: import.meta.env.REACT_APP_TOKEN_SERVICE_URL` (a new env var; `BaseApi`'s
`fhirUrl` field is generically "the base URL this instance talks to," so this reuse is
consistent with its existing behavior, not a hack). Reusing `BaseApi` is deliberate: its
axios interceptor already attaches the session's own bearer token, which is exactly the
right auth for both ATS calls this class makes (see "Auth model decision," above), and
its existing `handleUnauthorized` (401 → log the whole app out) is correct here too — a
401 from ATS means the member's b.well session itself is invalid.

Two methods:
- `listConnections(): Promise<ConnectionEntry[]>` → `GET /get-member-connections` (no
  query params — the response is the member's full connection list, derived from their
  JWT's `client_fhir_person_id`/`bwell_fhir_person_id`; not paginated). Maps the raw ATS
  shape (`{value, display, expired, category, status, is_direct, number_of_resources}`)
  onto `ConnectionEntry` (`value`→`service_slug`, `display`→`display_name`) so the rest
  of this app's code isn't stuck with ATS's internal field names.
- `getConnectionToken({serviceSlug}): Promise<ConnectionToken>` → `GET
  /get-member-connection-token/{serviceSlug}/` — the trailing slash is required (FastAPI's
  default `redirect_slashes` behavior 307-redirects a request missing it, and a redirect
  can drop the `Authorization` header depending on the HTTP client). No `memberId`
  parameter — the new endpoint derives it from the caller's own JWT.

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
connection-mandated `customHeaders` (parsed from `custom_fhir_api_headers`, e.g.
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
empty. On mount, calls `tokenServiceApi.listConnections()`. Renders: a category filter
(`<Select>`, options derived from the categories present in the response, "All" default),
a client-side text search over `display_name`/`service_slug`, and a list of rows (display
name, category, status chip, an "Expired" chip when `expired` is true) — clicking a row
navigates to `/connections/${service_slug}/console`, passing the `ConnectionEntry` via
router `state` so the console page has a fast path to display metadata
(`display_name`/`category`/`status`) without a second list call. No pagination —
`/get-member-connections` returns the full list in one response. Loading spinner, empty
state ("No connections found"), a distinct message on a 403 response ("Connections
aren't available for delegated/authorized-representative accounts"), and an error banner
with "Retry" for any other non-401 failure — a 401 is already handled by
`TokenServiceApi`'s inherited `handleUnauthorized`.

### `ConnectionConsolePage` (`/connections/:serviceSlug/console`)

Reads `serviceSlug` from the route. Resolves the `ConnectionEntry` for header/metadata
display: prefers `location.state?.connection` (the fast path from a list click); if
absent (direct navigation, bookmark, or a page refresh), falls back to
`tokenServiceApi.listConnections()` and finds the entry whose `service_slug` matches
client-side (`/get-member-connections` has no per-slug filter — it always returns the
full list). Once resolved, calls `tokenServiceApi.getConnectionToken({ serviceSlug })` to
get the connection's token/url/patient_id/custom headers; a "Refresh Token" button
re-runs the same call on demand (no auto-polling, per Non-goals).

Above the console: an info bar (display name, category, status chip, "Expired" chip when
applicable, `patient_id` — available once the token call resolves — with a
copy-to-clipboard action, token expiry, "Refresh Token" button).

Below it: a request console laid out like `/api-console`'s controls + split pane (Method
`<Select>`, a free-form "Request Path" `TextField` — helper text example referencing the
`patient_id` shown above, e.g. `e.g. /Patient/<patient_id>`, a Send button, a Request
panel with Body/Headers tabs, a Response panel with Body/Headers tabs, streaming response
text while in flight) — wired to a `ConnectionFhirApi` built from the resolved token
(`baseUrl: connectionToken.url`, `token: connectionToken.token`, `customHeaders`: the
connection's `custom_fhir_api_headers`, JSON-parsed). The Headers tab on the Request panel
shows the connection-mandated headers as read-only rows (via `KeyValueRows`'s existing
`readOnly` prop) in a clearly labeled "From this connection (always sent)" group, separate
from the user's own editable custom headers below it.

A 403 from either the connection-resolution fallback or the token fetch shows the same
"not available for delegated/authorized-representative accounts" message as the list
page, instead of the request console.

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

### Error handling summary

- ATS calls failing with 401 → already handled: `TokenServiceApi` inherits
  `BaseApi.handleUnauthorized`, which logs the user out — the same behavior every other
  API call in this app already has on a 401.
- ATS calls failing with 403 (`restrict_delegated_user_rest`) → explicit "not available
  for delegated accounts" message on both pages (see "Auth model decision," above) — not
  a generic error, not a logout.
- ATS calls failing with any other status → inline error banner + "Retry".
- A connection FHIR server request failing → `ConnectionFhirApi`'s error path (same shape
  `sendStreamingRequest`/`FhirApi.sendRequest` already use:
  `{status: undefined, json: {error: ...}}`) uses a message that names CORS as a likely
  cause, since `fetch()` cannot distinguish a CORS rejection from a generic network
  failure and a user seeing an opaque failure needs a starting hypothesis.

## Testing

No automated test framework exists in this repo (consistent with every other plan here) —
manual verification only:

- `yarn lint` / `yarn tsc --noEmit` clean throughout.
- `/connections` loads a real list of ATS connections (staging), category filter and
  search narrow the list, an expired connection shows its "Expired" chip.
- Clicking a connection opens its console pre-filled with a fetched token and the right
  metadata; "Refresh Token" re-fetches without navigating away.
- Sending a request against at least one real, reachable connection FHIR server —
  the CORS question, above, in practice.
- A connection with a non-empty `custom_fhir_api_headers` shows those headers as read-only
  and they're actually present on the outgoing request (verify via the target server's
  response or a network inspector).
- Direct navigation to a console URL (paste it fresh, no router `state`) still resolves
  the connection via the list fallback.
- An ATS 401 (e.g. an intentionally expired/invalid session) logs the user out, matching
  every other API call's existing behavior; an ATS 403 (a delegated-user login, if one is
  available to test with) shows the "not available" message instead.
- Existing `/api-console` and `Header.tsx`'s "Open in API Console" button are unaffected
  (the shared `sendStreamingRequest` extraction must not change `FhirApi`'s observable
  behavior).

## Dependency

This design's frontend implementation cannot ship correctly ahead of
`aperture_token_service`'s new `GET /get-member-connection-token/{service_slug}/`
endpoint (see "Auth model decision"). That endpoint's own spec/plan live in
`aperture_token_service`'s `docs/superpowers/specs/` and `docs/superpowers/plans/`
(`2026-08-07-member-connection-token-endpoint-*`), on branch
`feature/member-connection-token-endpoint`.
