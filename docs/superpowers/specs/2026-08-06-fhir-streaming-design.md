# Streaming FHIR Responses for Progressive Display

**Status:** Draft for review
**Date:** 2026-08-06

## Problem

Every page in this app that talks to the FHIR server does so through `BaseApi`
(`src/api/baseApi.ts`), which wraps `axios` and buffers the entire HTTP
response before the page sees anything. For large search Bundles, IPS
summaries, or bulk `$everything` exports this means:

- Users stare at a blank spinner until the *entire* response has downloaded
  and been parsed, even though the FHIR server is sending data continuously.
- Long-running requests are more exposed to any upstream idle-timeout
  (browser, LB, proxy) because nothing about the request looks "alive" to
  those layers until the buffered read resolves.

One page already solves this: `src/pages/APIConsolePage.tsx`, via
`FhirApi.sendRequest()`, reads the response with
`response.body.getReader()` and surfaces status/headers and body chunks as
they arrive. This design generalizes that pattern to the rest of the app.

## Design principle: one shared client, no duplication

A grep across `src` confirms every FHIR/admin call in the app is already
funneled through exactly one of three classes — `BaseApi`, `FhirApi extends
BaseApi`, `AdminApi extends BaseApi` — instantiated at 19 call sites, with
zero pages calling `fetch()`/`axios` directly. This design **preserves and
strengthens that invariant**: the only place streaming logic is implemented
is `BaseApi.streamRequest()`; every page and every subclass method
(`getData`, `request`, `downloadFile`, `getBundleAsync`, `sendRequest`, all
`AdminApi` methods) is a thin wrapper over it. No page implements its own
`fetch`/reader loop going forward — `APIConsolePage.tsx`'s bespoke streaming
code is folded into the shared client rather than left as a one-off.

`axios` remains a dependency only for the OIDC/auth services
(`CognitoAuthService.ts`, `OktaAuthService.ts`,
`ClientCredentialsAuthService.ts`, `BwellAppAuthService.ts`,
`WellKnownConfigurationService.ts`, `Auth.tsx`) — those don't talk to the
FHIR server and are out of scope for this change.

## Architecture

### 1. Shared streaming client (`BaseApi`)

`BaseApi` gains one low-level method, `streamRequest()` — the current
`FhirApi.sendRequest()` implementation moved up a level, generalized to
binary-safe chunk handling (`Uint8Array`, not just decoded text) so it can
back both JSON reads and blob downloads:

```
streamRequest({ method, urlString, data, headers, signal, onHeaders, onChunk }):
  Promise<{ status, headers, bytes: Uint8Array, text: string, incomplete?: boolean }>
```

- Fires `onHeaders(status, headers)` as soon as `fetch()` resolves (before
  the body streaming loop starts) — unchanged from today's behavior.
- Reads `response.body.getReader()` in a loop, accumulating raw bytes and
  calling `onChunk(chunk: Uint8Array)` per chunk.
- A `TextDecoder({ stream: true })` derives `text` incrementally for callers
  that want string chunks (the common case); binary callers use `bytes`
  directly.
- On a mid-stream drop, resolves with `incomplete: true` and whatever
  partial data arrived (matches existing `sendRequest` behavior) rather than
  throwing, so callers can decide how to degrade.
- `FhirApi`'s origin-lock check (requests must stay on the configured FHIR
  server) moves onto `streamRequest()` itself so every caller gets the
  guarantee, not just the API Console's `sendRequest`.

`getData()`, `request()`, and `downloadFile()` become wrappers:

- `getData()` / `request()`: call `streamRequest()` with no `onChunk` (or an
  internal one, see below), then `JSON.parse(text)` once complete — same
  `{ status, json }` return shape as today, so the ~19 existing call sites
  need **no changes** to keep working exactly as they do now.
- `downloadFile()`: accumulates `Uint8Array` chunks and assembles a `Blob`
  at the end instead of axios's `responseType: 'blob'`.
- All three gain an optional `onProgress` callback parameter
  (`(bytesReceived: number, totalBytes: number | undefined) => void`, total
  from `Content-Length` when present) for pages that want a progress
  indicator without full incremental parsing.

This is Phase 1 and touches only `src/api/baseApi.ts` and
`src/api/fhirApi.ts` (removing the now-redundant `sendRequest`, or keeping
it as a thin FHIR-specific alias if `APIConsolePage.tsx` needs its exact
current signature) — no page-level code changes required yet.

### 2. Rendering strategy: hybrid

FHIR Bundles are single JSON objects (`{ entry: [{resource: {...}}, ...] }`),
not newline-delimited JSON, so partial text can't be `JSON.parse`d directly.
Two tiers, chosen deliberately per page rather than applied uniformly
(YAGNI: a single-resource read has nothing to progressively render beyond
raw progress):

**Tier A — progress indicator (all remaining FHIR-calling pages).** Pages
pass `onProgress` into their existing `getData()`/`request()`/`downloadFile()`
call and show a progress UI (percentage when `Content-Length` is known,
otherwise a bytes-received counter or indeterminate "streaming…" state)
instead of a static spinner. Content still renders once, fully parsed, when
the stream completes. Applies to: `CompositionSummaryPage`, `IPSViewer`,
`ExportStatus` (status polling + the bulk NDJSON download),
`SpreadsheetViewer`, `FileDownload`, and all `AdminApi`-backed admin pages.

**Tier B — true incremental rendering (`IndexPage`/`SearchPage` only).**
This is the one page where users watch a *list* populate, so it's worth the
extra investment: a browser-native streaming JSON parser,
[`@streamparser/json`](https://github.com/juanjoDiaz/jsonparse2) (verified
on npm, v0.0.23 at time of writing; built on Web Streams, no Node-stream
shimming needed — unlike `stream-json` which targets Node), is fed each
`onChunk` byte chunk and emits a
JSONPath-addressable event each time a value completes. `IndexPage` listens
for completed `entry[*].resource` values and appends each one to a growing
`resources` state array as it arrives — `ResourceCard`s appear one at a
time — instead of waiting for `bundle.entry.map(...)` over the full parsed
object. Once the stream ends, the existing full-`JSON.parse(text)` result
is used as the source of truth for anything the incremental pass didn't
capture (e.g., `Bundle.total`, pagination links), so a parser edge case
never produces a page that's silently missing data.

### 3. Error handling

- **Cancellation**: `AbortController`, wired through `signal` on
  `streamRequest()` — already the pattern `APIConsolePage.tsx` uses for
  stale-request cancellation; generalized so every page can cancel an
  in-flight streamed request on unmount/re-query.
- **Mid-stream drops**: `streamRequest()` resolves with `incomplete: true`
  and best-effort partial data rather than rejecting (existing behavior in
  `sendRequest`, generalized). Tier A pages show a "connection
  interrupted — showing partial results" notice; Tier B's incremental list
  keeps whatever resources already rendered and shows the same notice.
- **Per-entry parse errors (Tier B only)**: a malformed individual entry is
  logged and skipped in the incremental pass; it does not abort the stream,
  and the end-of-stream full parse is still attempted as the fallback
  source of truth.
- **401 handling**: unchanged — `handleUnauthorized()` still fires off the
  headers callback, before body streaming begins, same as today.
- **Timeout scope**: there is no proxy/gateway in this repo (it's a pure
  SPA calling the FHIR server directly), so nothing here can widen a
  *hard* server-side total-duration timeout. What continuous chunked
  delivery does address is *idle*-based timeouts (the common kind, e.g. LB
  or browser inactivity timers) — as long as bytes keep flowing, those
  don't fire. This is a resilience improvement, not a guarantee against
  every timeout class.

### 4. Rollout phases

1. **Shared client**: `BaseApi.streamRequest()` + wrapped `getData` /
   `request` / `downloadFile`, with `onProgress` support. No visible UI
   change; existing pages keep working unchanged. Drop axios from
   `BaseApi`.
2. **Tier A progress UI**: a small shared `useStreamProgress`-style
   indicator component, adopted by `CompositionSummaryPage`, `IPSViewer`,
   `ExportStatus`, `SpreadsheetViewer`, `FileDownload`, admin pages.
3. **Tier B incremental rendering**: `@streamparser/json` integration in
   `IndexPage`/`SearchPage`, progressive `ResourceCard` list.

### 5. Testing

- Unit tests for `streamRequest()`: mock `ReadableStream` to verify
  chunk/header callback ordering, `incomplete` handling on a simulated
  drop, abort behavior, and binary vs. text accumulation.
- Regression tests confirming `getData()`/`request()`/`downloadFile()`
  return the same `{status, json}`/blob shape as the current axios-based
  implementation, so all 19 existing call sites are unaffected by default.
- Tier B: unit tests feeding a hand-built Bundle through the parser in
  artificially small chunks (including chunk boundaries that split a token
  or a UTF-8 multi-byte sequence) to confirm entries are emitted correctly
  and in order, and that a deliberately malformed entry is skipped without
  aborting the stream.
- Per-page smoke tests (existing test setup, e.g. MSW-mocked responses)
  updated to stream mock bodies in chunks rather than returning them
  whole, so progressive-rendering assertions ("cards appear before the
  full response completes") are meaningful rather than trivially true.

## Open questions for implementation planning

- Exact shape of the shared progress-indicator component/hook (Tier A) —
  left for the implementation plan rather than this design.
- Whether `FhirApi.sendRequest()` is kept as a named method for
  `APIConsolePage.tsx` (which also renders raw streamed text, not just
  progress) or whether the console adopts the same `onChunk` shape as
  everyone else.
