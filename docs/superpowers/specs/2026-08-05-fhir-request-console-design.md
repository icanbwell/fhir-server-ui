# FHIR Request Console — Design

## Problem

Users want to specify an arbitrary URL and request body, execute it against the FHIR
server using their current session's credentials, and see the response. This
functionality largely exists already: `APIConsolePage.tsx` (route `/api-console`) lets a
signed-in user pick an HTTP method and resource type, edit a JSON request body, send it
via `FhirApi.sendRequest`, and view the response in a syntax-highlighted JSON viewer —
authenticated automatically via `BaseApi`'s axios request interceptor
(`src/api/baseApi.ts:110-127`), which attaches the session's bearer token with no
additional wiring needed.

It falls short of "specify a url" in a few concrete ways:

- **URL is not free-form.** `requestUrl` (`APIConsolePage.tsx:113-138`) is built from a
  mandatory `selectedResourceType` dropdown plus optional operation/id/params. A
  free-text `urlSuffix` field exists, but only appears when no operation is selected, and
  it's still appended onto `/4_0_0/<resourceType>` — a resource type is required either
  way, and the Send button is disabled without one (`APIConsolePage.tsx:399`).
- **No PATCH.** `HttpMethod` is `'GET' | 'POST' | 'PUT' | 'DELETE'`
  (`APIConsolePage.tsx:32`), matching `BaseApi.request`'s method union
  (`src/api/baseApi.ts:17`).
- **No custom request headers.** `BaseApi.request` hardcodes
  `Content-Type: application/fhir+json` (`src/api/baseApi.ts:79-81`); there's no way for
  the user to add or override headers.
- **No response headers.** `getData`/`request` return `{ status, json }` only
  (`src/api/baseApi.ts:62`, `:83`) — response headers are discarded.
- **No streaming.** `FhirApi.sendRequest` (`fhirApi.ts:119-132`) delegates to axios'
  `getData`/`request`, which buffer the entire response body before resolving — the UI
  can't show anything until the whole response has arrived, even when the FHIR server
  sends a large bundle with `Transfer-Encoding: chunked`.

## Goal

Extend `APIConsolePage` so a signed-in user can:

1. Type any request path and have it sent exactly as typed (bypassing the guided
   resourceType/operation builder entirely), for all of GET/POST/PUT/PATCH/DELETE.
2. Add custom request headers.
3. See the response status, headers, and body.
4. See the response body render progressively as it streams in, rather than waiting for
   the full response to buffer — reflecting the FHIR server's actual chunked
   transfer-encoding instead of hiding it behind a single "loading" spinner.

All of this using the credentials already attached by the existing auth interceptor — no
new auth code.

## Non-goals

- Request history / persistence across page visits (explicitly session-only per
  requirements — state resets on refresh, same as today).
- Any new access control. The console stays reachable by any authenticated user, exactly
  as it is today (see "Existing access" below) — this design does not add or tighten
  gating.
- Targeting any server other than the app's already-configured FHIR base URL
  (`EnvironmentContext.fhirUrl`, sourced from `REACT_APP_FHIR_SERVER_URL`). The user
  specifies a *path*, not an arbitrary host.
- Automated test coverage. The repo has no test framework today (confirmed: no
  jest/vitest/playwright/cucumber in `package.json`, no `*.test.*` or `*.feature` files
  anywhere); this follows the same manual-QA convention used for recent features
  (e.g. the client-credentials-auth work).

## Existing access (unchanged by this design)

`/api-console` sits inside `App.tsx`'s general auth-gated `<Outlet>` (`App.tsx:57-66`):
any signed-in user (`userDetails` truthy) can reach it — there's no `isAdmin` check like
the `/admin` routes have (`App.tsx:68-69`). It's discoverable via a visible "API Console"
button on the home page (`HomePage.tsx:86-93`, shown to every logged-in user, unlike the
"Visit Admin Dashboard" button next to it which is admin-only), and reachable
programmatically via `ResourceCard.tsx`'s redirect flow
(`isFromRedirect` in `APIConsolePage.tsx:46-51`), which still needs to keep working
unmodified.

## Design

### 1. Free-form request path (`APIConsolePage.tsx`)

Keep the guided resourceType/operation/id/params builder exactly as-is — it stays the
default, convenient path for building well-formed FHIR URLs. Change what happens when
`selectedResourceType` is empty: today `requestUrl` returns `''` in that case; instead,
treat `urlSuffix` as the literal, complete request path (e.g. `/4_0_0/Patient/123`,
`/version`, `/4_0_0/Patient/_search?name=John`) and send exactly that, unmodified. The
label on that field changes from "URL path" to something like "Request Path (full path,
e.g. /4_0_0/Patient/123)" to make the new behavior obvious.

The Send button's `disabled` condition (`APIConsolePage.tsx:399`,
`!selectedResourceType`) changes to require a non-empty `requestUrl` instead — so typing
a path with no resource type selected is sufficient to enable Send.

No changes to the guided-builder code path itself, so the `isFromRedirect` flow
(`ResourceCard` deep links) is unaffected — it always has a `routeResourceType` set, so it
never hits the new free-form branch.

### 2. PATCH support

- `HttpMethod` (`APIConsolePage.tsx:32`) and `BaseApi.RequestParams['method']`
  (`baseApi.ts:17`) both widen to include `'PATCH'`.
- `FhirApi.sendRequest`'s method union (`fhirApi.ts:124`) widens the same way.
- The method `<Select>` (`APIConsolePage.tsx:278`) adds `'PATCH'` to the list, with a
  color in `getMethodColor` (`APIConsolePage.tsx:241-248`), e.g. purple.
- The request-body editor's visibility condition (`APIConsolePage.tsx:208`,
  currently `method === 'POST' || method === 'PUT'`) adds `PATCH` — PATCH requests
  commonly carry a body (e.g. FHIRPath Patch or JSON Patch documents).

### 3. Custom request headers

New state: an array of `{ key: string; value: string }` rows, defaulting to one empty
row. A small row-list editor renders below the method/URL bar (its own labeled section,
similar to how "Request Body" is labeled today): each row has a header-name text field, a
value text field, and a remove (✕) button; an "Add header" button appends a new empty
row. Empty rows (blank key) are ignored when sending.

These are merged into the request's headers, on top of the interceptor's defaults
(`baseApi.ts:110-127`) and `request()`'s hardcoded `Content-Type`
(`baseApi.ts:79-81`) — user-supplied headers win on conflict, so a user can override
`Content-Type` or `Accept` if needed. `Authorization` is not shown as an editable row and
is not overridable this way — it stays exclusively controlled by the interceptor, since
overriding it would defeat "using the credentials in the session."

Plumbing: headers need to reach the new fetch-based send path (see below), not axios —
`FhirApi.sendRequest`'s params gain an optional `headers?: Record<string, string>`.
`BaseApi.getData`/`BaseApi.request` (axios) are untouched by this design, since
`sendRequest` stops calling them (see next section) and no other caller needs custom
headers today.

### 4. Streaming send path (`FhirApi.sendRequest` rewritten on top of `fetch`)

Axios in the browser buffers the full response body before resolving, so it can't drive
a "render as it arrives" UI. `sendRequest` (`fhirApi.ts:119-132`) is rewritten to use the
`fetch()` API directly instead of delegating to `getData`/`request`, for every method
(GET included) — this is the one send path the console uses regardless of which URL
mode built the request, so both the guided builder and the new free-form path get
streaming for free.

- **Auth headers**: today's axios request interceptor
  (`baseApi.ts:110-127`) builds `Authorization`, `Accept`, `Cache-Control`, `Pragma`,
  `Expires`, and `Origin-Service` from `getLocalData`/`AuthUrlProvider` — logic specific
  to axios' `InternalAxiosRequestConfig`. Extract the header *values* into a plain
  `protected buildHeaders(extra?: Record<string, string>): Record<string, string>`
  method on `BaseApi`, used by both the existing axios interceptor (unchanged behavior)
  and the new fetch call. Caller-supplied `extra` headers (the console's custom-headers
  editor, item 3) are merged in last, so they can override defaults — except
  `Authorization`, which `buildHeaders` always sets from the session token regardless of
  what's passed in, so a custom header row can never blank out or spoof the session's
  auth.
- **Request**: `fetch(new URL(urlPath, fhirUrl), { method, headers: this.buildHeaders(headers), body: data ? JSON.stringify(data) : undefined })`.
- **Reading the response**: `fetch()`'s promise resolves as soon as headers arrive —
  `response.status` and `response.headers` are available immediately, before the body is
  read at all. The body is then read incrementally via
  `response.body.getReader()` + `TextDecoder`, appending each decoded chunk to an
  accumulator string and invoking an `onChunk(text: string)` callback (new param on
  `sendRequest`) so the UI can render progressively. When the reader signals `done`,
  `sendRequest` resolves with `{ status, headers, json, rawText }`, attempting
  `JSON.parse(rawText)` for `json` (`undefined` if it doesn't parse — e.g. an empty 204
  body, or a non-JSON error page).
- **401 handling**: fetch doesn't throw on HTTP error statuses like axios does, so
  `sendRequest` explicitly checks `response.status === 401` after the fetch resolves and
  triggers the same `logout` call the axios paths make today
  (`baseApi.ts:64-65`/`85-86`) — extracted into a small shared
  `protected async handleUnauthorized(status: number)` helper so the logic isn't
  duplicated a third time.
- **Cancellation**: `APIConsolePage` keeps an `AbortController` ref for the in-flight
  request, passed as `fetch`'s `signal`. A new Send click (or the component unmounting)
  aborts the previous controller first, so a stale stream can't keep writing into state
  after the user has moved on.

### 5. Response rendering: status/headers first, body streams in

`APIConsolePage` adds `streamedText` (raw accumulator, updated on every `onChunk`),
`responseHeaders`, and `isStreaming` state. `handleSend` clears all response state, opens
a fresh `AbortController`, then calls the rewritten `sendRequest` with an `onChunk` that
appends to `streamedText`.

The response pane keeps its status chip, gaining a small tab switcher ("Body" /
"Headers") above the content area:

- **Status + Headers tab** populate as soon as `sendRequest`'s fetch call resolves —
  before the body finishes streaming — since headers arrive first over the wire. It's a
  simple two-column key/value list (header name | value), same visual treatment as the
  request-headers editor's rows but read-only.
- **Body tab**: while `isStreaming` is true, renders `streamedText` as plain growing
  monospace text (a `<Typography>`/`<pre>` block, not `PreJson`) with a small "Receiving…"
  indicator next to the tab label — this is the "raw growing text" v1 behavior; no
  incremental JSON parsing is attempted mid-stream. Once the stream ends
  (`isStreaming` becomes false), if `sendRequest`'s resolved `json` parsed successfully,
  the Body tab swaps to today's `PreJson` tree viewer over that parsed object (matching
  current behavior exactly once complete); if it didn't parse, the tab keeps showing the
  raw text permanently instead of erroring.

### 6. State scope

All new state (custom headers, `streamedText`, `responseHeaders`, `isStreaming`, active
response tab) is plain in-memory `useState`, not synced to search params — consistent
with the "session-only, lost on refresh" requirement, and consistent with how
`resourceJson` (the request body) already behaves today (not persisted to the URL
either).

## Error handling

`handleSend`'s try/catch (`APIConsolePage.tsx:198-229`) keeps distinguishing a
`SyntaxError` (invalid JSON in the request-body editor, caught before any network call)
from a request failure — but "request failure" now covers a few more cases than a
rejected axios promise:

- **Network-level failure** (`fetch` itself rejects — offline, CORS, DNS): caught by the
  `try/catch`, shown as an `{ error: ... }` body same as today, `isStreaming` set false.
- **Abort** (superseded by a newer Send click, or the page navigated away):
  `AbortController`'s abort causes `fetch` to reject with an `AbortError` — this is
  swallowed silently (it's not a real failure to surface) rather than shown as an error,
  since state may already belong to the new in-flight request by the time it happens.
- **HTTP error status with a streamed body** (e.g. a 400 with an `OperationOutcome`):
  not an exception at all under `fetch` — `sendRequest` resolves normally with
  `status >= 400`; the status chip already turns red for this via existing
  `getStatusColor` logic, and the body still streams and renders like any other
  response.

All response state (`streamedText`, `responseJson`, `responseStatus`, `responseHeaders`,
`isStreaming`) is cleared at the start of `handleSend`, so an error from one send never
leaves stale headers/body visible from a previous request.

## Testing

- Manual: run the dev server, open `/api-console`.
  - Type a full path with no resource type selected (e.g. `/version`), send as GET,
    confirm it hits exactly that path.
  - Exercise the guided builder unchanged (pick a resource type, GET/search) to confirm
    no regression.
  - Send a PATCH with a body, confirm the body editor appears and the request succeeds
    against a resource that supports it.
  - Add two custom headers (including one that overrides `Content-Type`), confirm both
    reach the server (verify via a request that echoes headers, or via server-side
    logging/Groundcover if available).
  - Confirm the Headers tab on the response shows the FHIR server's actual response
    headers, and that it populates before the body finishes streaming on a
    slow/large request (e.g. an unbounded `_search`).
  - Send a request returning a large bundle and confirm the Body tab's raw text visibly
    grows in chunks rather than appearing all at once, then swaps to the pretty
    `PreJson` tree once the stream completes.
  - Fire a second Send while the first is still streaming; confirm the first request's
    late-arriving chunks don't appear mixed into the second's response (abort works).
  - Send a request producing a non-JSON or empty (204) response; confirm the Body tab
    falls back to showing raw text (possibly empty) rather than erroring.
  - Click into `/api-console` via the `ResourceCard` redirect flow, confirm that path
    still auto-fetches and disables fields exactly as it does today (no regression from
    the free-form-path change, since it never touches the `isFromRedirect` branch).
- No automated tests, matching the rest of the repo (see Non-goals).
