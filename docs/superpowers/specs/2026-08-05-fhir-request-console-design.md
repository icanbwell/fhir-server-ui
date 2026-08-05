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

## Goal

Extend `APIConsolePage` so a signed-in user can:

1. Type any request path and have it sent exactly as typed (bypassing the guided
   resourceType/operation builder entirely), for all of GET/POST/PUT/PATCH/DELETE.
2. Add custom request headers.
3. See the response status, headers, and body.

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

Plumbing: `BaseApi.request`'s `RequestParams` gains an optional `headers?: Record<string,
string>`, merged into the axios call's `headers` object
(`baseApi.ts:79-81` becomes a merge of the hardcoded default + the caller's headers).
`BaseApi.getData` gains the same optional `headers` param, passed through to the
underlying `axiosInstance.get` call. `FhirApi.sendRequest` gains an optional `headers`
param and threads it through to both branches (`fhirApi.ts:128-131`).

### 4. Response: status, headers, and body

`BaseApi.getData` and `BaseApi.request` change their return shape from `{ status, json }`
to `{ status, json, headers }`, populated from `response.headers` (axios exposes this as
a plain object today, same shape `downloadFile` already returns at `baseApi.ts:100`) —
including on the error path, from `err.response?.headers`.

In `APIConsolePage`, a new `responseHeaders` state stores this. The response pane keeps
its status chip as-is, but gains a small tab switcher ("Body" / "Headers") above the
content area:

- **Body tab** (default): unchanged — the existing `PreJson` viewer.
- **Headers tab**: a simple two-column key/value list (header name | value), same visual
  treatment as the request-headers editor's rows but read-only.

### 5. State scope

All new state (custom headers, `responseHeaders`, active response tab) is plain
in-memory `useState`, not synced to search params — consistent with the "session-only,
lost on refresh" requirement, and consistent with how `resourceJson` (the request body)
already behaves today (not persisted to the URL either).

## Error handling

Unchanged shape from today: `handleSend`'s try/catch (`APIConsolePage.tsx:198-229`)
still distinguishes a `SyntaxError` (invalid JSON in the body editor) from a generic
request failure, setting `responseJson` to an `{ error: ... }` object either way. Since
`responseJson`/`responseStatus` are cleared before sending and `responseHeaders`
should be too, an error response leaves the Headers tab empty (no crash, just nothing to
show) rather than showing stale headers from a previous request.

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
    headers, and the Body tab still renders as before.
  - Click into `/api-console` via the `ResourceCard` redirect flow, confirm that path
    still auto-fetches and disables fields exactly as it does today (no regression from
    the free-form-path change, since it never touches the `isFromRedirect` branch).
- No automated tests, matching the rest of the repo (see Non-goals).
