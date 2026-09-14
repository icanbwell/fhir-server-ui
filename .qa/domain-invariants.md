# Domain Invariants — fhir-server-ui

Repo: `fhir-server-ui` (React 19 + Vite browser SPA, Vitest/jsdom)
Branch: `SG-DCON-5564`
Date: 2026-09-14
Scope: `src/services`, `src/api`, `src/utils`, `src/hooks`, `src/context` (user-narrowed highest-risk core)

## What this repo is, and what that means for correctness

`fhir-server-ui` is a **browser client** for the b.well Helix FHIR server. It holds no database, no
Kafka, no server-side session. Its entire security surface is:

1. **Where the session bearer token goes** — the token lives in `localStorage` and is attached by
   `BaseApi.buildHeaders()`. Any request that leaves the configured FHIR origin with that header
   attached is a token leak.
2. **What the FHIR query says** — every search filter the user types is serialized into a URL by
   `FhirApi.getUrl()` / `AdminApi.getUrl()` / `SearchFormQuery`. A silently dropped or truncated
   filter means the operator is shown a *different result set than they asked for* while believing
   they see the right one.
3. **Whether logout actually de-authenticates** — `removeAuthData()` must clear every key that
   `buildHeaders()` could later read back as a bearer token.
4. **Whether persisted client state can brick the app** — anything parsed out of `localStorage`
   during render is attacker/corruption reachable and must not be able to throw.

Server-side rules (access-tag filtering, `_access` synchronization, owner-tag immutability,
consent evaluation, EMPI traversal) are **enforced by the FHIR server, not here**. They appear below
only where this client has a genuine obligation — carrying the caller's token so the server can
apply them, and transmitting security-tag search filters (`_security`) without corruption.

---

## Core Invariants

**Citation convention:** invariant *N* below is referred to elsewhere as **`INV-N`** (and,
interchangeably, as "invariant *N*"). Both forms appear in test names and docstrings — e.g.
`INV-1` / "invariant 1" both mean invariant 1, *Token confinement*. `bugs-found.md` and
`findings.jsonl` use the `INV-N` form exclusively. The numbering below is therefore stable: rows
may be appended but must never be renumbered, or every existing citation silently retargets.

1. **[`INV-1` — Token confinement — derived from IDG-5 / SAE-1 trust boundary]** The session bearer token
   MUST only ever be sent to the configured FHIR server origin (or an explicitly supplied
   `baseUrlOverride`). Any `urlString` that resolves — via `new URL()`, a scheme-relative path, or
   an absolute URL — to a different origin MUST be refused *before* `fetch()` is called.
   Enforced in `src/api/baseApi.ts:165`.

2. **[`INV-2` — Authorization header is server-owned]** A caller-supplied `Authorization` header MUST NOT be
   able to override, blank, or suppress the session token. `buildHeaders()` owns that header
   exclusively; caller headers are merged case-insensitively so `authorization` and `Authorization`
   cannot both survive. Enforced in `src/api/baseApi.ts:100-113`.

3. **[`INV-3` — Logout clears every token-bearing key]** After `removeAuthData()`, no key that
   `buildHeaders()` could read as `tokenToSendToFhirServer` may remain in `localStorage`. The set is
   `{jwt, id_token, identityProvider, code_verifier}` — if a provider's
   `REACT_APP_AUTH_<P>_TOKEN_TO_SEND_TO_FHIR_SERVER` names a key outside that set, logout leaves a
   live bearer token in browser storage. `src/utils/auth.utils.ts:7-12`.

4. **[`INV-4` — Logout is unconditional]** `logout()` MUST clear local auth state and land the user on a
   non-authenticated page on *every* path — credentials-based provider, OIDC provider, no provider,
   and when building the IdP logout URL throws. There is no branch where a failure leaves the user
   holding a token and still on the page. `src/utils/auth.utils.ts:14-66`.

5. **[`INV-5` — 401 means logged out; 403 does not]** Per business-logic master §22, 401 = missing/invalid
   token, 403 = valid token with insufficient permissions. Only 401 may trigger `logout()`. A 403
   (the normal response when a resource exists but the caller's access tags don't match, per
   SAE-1) MUST leave the session intact. `src/api/baseApi.ts:120-124`.

6. **[`INV-6` — A foreign origin's 401 is not this session's 401]** When `baseUrlOverride` is set, the
   response comes from a *different* auth boundary. Its 401 MUST NOT log the user out of this app.
   `src/api/baseApi.ts:222`. Same reasoning makes `BaileyApi.handleUnauthorized` a deliberate no-op.

7. **[`INV-7` — Search filters are transmitted losslessly]** A user-entered search value MUST reach the FHIR
   server byte-identical. `name=value` pairs are split on the **first** `=` only — values legally
   contain `=` (`_source` URLs with query strings, `_security` token values, base64 identifiers).
   A filter that is silently truncated or dropped produces a **wrong result set presented as
   correct**, which is worse than an error. `src/api/fhirApi.ts:118-121` (correct),
   `src/api/adminApi.ts:131` (**violates this — BUG-001**).

8. **[`INV-8` — AuditEvent queries always carry a bounded date range]** Per business-logic master §20,
   "AuditEvent queries MUST supply required date range filter." `FhirApi.addMissingRequiredParams`
   MUST inject a `date` window for `resourceType === 'AuditEvent'` when the caller supplied none,
   and MUST NOT override a caller-supplied `date`. `src/api/fhirApi.ts:81-86`.

9. **[`INV-9` — An exact-id lookup must not be date-window-filtered]** An `id=<value>` query already narrows
   to one resource; ANDing the injected 7-day AuditEvent window onto it would hide an older
   AuditEvent behind a false "not found". `getResourceCount` MUST strip the injected `date` when
   `id=` is present. `src/api/fhirApi.ts:143-145`.

10. **[`INV-10` — Counting must not use `_total=accurate`]** `getResourceCount` must bound cost with
    `_count=limit+1` and report `atLimit` rather than computing a true total (the FHIR server's own
    docs warn `_total=accurate` is expensive at scale). `count` MUST be clamped to `limit` and
    `atLimit` MUST be `true` exactly when more than `limit` rows exist. `src/api/fhirApi.ts:133-152`.

11. **[`INV-11` — Streaming preserves bytes across chunk boundaries]** Per business-logic master §21, responses
    are streamed. A single `TextDecoder` MUST be kept alive across the whole body with
    `{stream: true}`, and flushed with a final argument-less `decode()`. Decoding chunks
    independently corrupts any multi-byte UTF-8 character split across a chunk boundary; omitting
    the final flush silently drops a trailing partial sequence.
    `src/api/baseApi.ts:234-249`, `src/utils/streamingFetch.ts:63-105`, `src/api/baileyApi.ts:60`
    (all correct); `src/api/fhirApi.ts:184-195` (**violates the flush half — BUG-007**).

12. **[`INV-12` — A truncated download is an error, never a result]** A mid-stream connection drop MUST NOT be
    handed to a caller as a successful 2xx Blob — `downloadFile` must reject on `incomplete`,
    because the original status was captured before the body finished. `src/api/baseApi.ts:390-402`.

13. **[`INV-13` — Progress totals must be honest]** `content-length` is the *compressed* size when
    `content-encoding` is present, while the reader yields decompressed bytes. `totalBytes` MUST be
    `undefined` whenever the response is encoded, so the UI degrades to an indeterminate bar rather
    than racing past 100%. `src/api/baseApi.ts:230-232`.

14. **[`INV-14` — Aborts propagate; everything else degrades]** An `AbortError` MUST be rethrown (the caller
    cancelled deliberately); every other fetch/stream failure MUST resolve with partial data plus
    an explicit failure signal. `src/api/baseApi.ts:190-208, 304-312`, `src/utils/streamingFetch.ts:41-46, 81-103`.

15. **[`INV-15` — PKCE code_verifier is never reused across authorization requests]** Per RFC 7636 a verifier
    belongs to exactly one authorization request. What that requires of this client is: a fresh
    verifier MUST be generated on every `getLoginUrlAsync` call, and the verifier MUST be removed
    from `localStorage` once it has been successfully exchanged so it cannot be replayed.
    `src/services/OktaAuthService.ts:80` and `src/services/CognitoAuthService.ts:80` satisfy both.
    Note what this invariant deliberately does **not** require: erasing the verifier after a
    *failed* exchange. The verifier is inert without its matching authorization code, the next
    login attempt overwrites it unconditionally, and `logout()` clears it — so the retention seen
    on the failure path is hygiene, not a spec violation. Recorded as Suspicious Pattern 5 (the two
    findings originally filed against it were retracted after adversarial review).

16. **[`INV-16` — A token exchange without a stored verifier must fail closed]** `fetchTokenAsync` MUST throw
    before contacting the token endpoint when no `code_verifier` is in storage — sending an
    authorization code without its verifier downgrades the flow to non-PKCE.
    `src/services/OktaAuthService.ts:59`, `src/services/CognitoAuthService.ts:63`.

17. **[`INV-17` — Auth provider resolution fails closed and explicitly]** `AuthServiceFactory.getAuthService()`
    MUST throw for a missing or unsupported `identityProvider` rather than returning a default
    service — silently falling back to one IdP's flow while storage says another is a session-fixation
    hazard. `src/services/AuthServiceFactory.ts`.

18. **[`INV-18` — Every documented provider configuration must be able to succeed]** `AuthUrlProvider`
    advertises two configuration modes — a `WELL_KNOWN_URL` (OIDC discovery) or explicit
    `AUTHORIZE_URL`/`TOKEN_URL`/`LOGOUT_URL` env vars. Both must be satisfiable, and a thrown error
    MUST name the variable that is actually missing. `src/utils/authUrlProvider.ts:34-47`
    (**violates this — BUG-002**).

19. **[`INV-19` — Persisted client state can never crash the render]** `localStorage` is writable by the user,
    by browser extensions, and by older versions of this app. Anything read and parsed during render
    MUST be guarded, because an unguarded throw in a `useState` initializer white-screens the whole
    SPA on *every* reload until storage is cleared by hand.
    `src/context/ThemeContext.tsx:46-50` (**violates this — BUG-003**).

20. **[`INV-20` — A count belongs to the query that produced it]** `useResourceCount` must never report a count
    derived from a previous parameter set. In particular, when new props make the hook *decline* to
    count (no `resourceType`, or no `queryParameters`), it must report "not counted" (`count: null`)
    rather than leaving the previous query's number visible with `isLoading: false, error: null`.
    `src/hooks/useResourceCount.ts:28-30` (**violates this — BUG-004**).

21. **[`INV-21` — In-flight requests are cancelled and their results discarded]** Every hook that fetches MUST
    abort on unmount/param change and MUST NOT call `setState` after cancellation — a late resolution
    otherwise overwrites the current query's answer with a stale one.
    `src/hooks/useResourceCount.ts:31-61`.

22. **[`INV-22` — Security-tag and identifier system URIs are exact]** Per business-logic master §3 the tag
    system URIs are authoritative strings (`https://www.icanbwell.com/{owner,access,vendor,
    sourceAssigningAuthority,connectionType,sourcePatientId}`). A typo makes every security-tag
    lookup in the UI silently return nothing rather than error. `src/utils/securityTagSystem.ts`,
    `src/utils/identifierSystem.ts`.

23. **[`INV-23` — Bundle streaming is fail-whole, not fail-per-entry]** `@streamparser/json`'s tokenizer is
    stream-fatal: one malformed token aborts the parse. `createBundleEntryParser` MUST therefore
    surface `onError` as "stop writing, fall back to a full `JSON.parse`", and MUST NOT call
    `write()`/`end()` after the parser has ended (which throws).
    `src/utils/incrementalBundleParser.ts`.

24. **[`INV-24` — Feature kill-switches default to ON, feature gates default to OFF]** `baileyEnabled` is
    documented as an opt-*out* kill switch: unset or empty MUST mean enabled, so an environment that
    predates the flag keeps working. `src/context/EnvironmentContext.ts`.

25. **[`INV-25` — Module-load side effects can never produce an unhandled rejection]** `EnvironmentContext`
    fires a `getVersion()` call at import time with nothing awaiting it; it MUST carry its own
    `.catch()` so an unreachable/unconfigured FHIR server leaves the default version string instead
    of crashing the module graph. `src/context/EnvironmentContext.ts`.

26. **[`INV-26` — Client-key parsing is total]** `parseClientKeys` must tolerate every malformed operator input
    (empty, whitespace, missing `=`, trailing commas) by dropping the bad entry, never by throwing
    or by emitting an entry with an empty name or key — a blank `clientkey` header would be sent to
    the b.well identity API. `src/services/BwellAppAuthService.ts:28-49`.

27. **[`INV-27` — A login response without a token is a failure]** `BwellAppAuthService.login` MUST throw when
    the identity API returns 200 with no `accessToken.jwtToken`, rather than returning `undefined`
    for the caller to store as the session token. `src/services/BwellAppAuthService.ts:20-25`.

28. **[`INV-28` — The resource catalogue is a well-formed, unique table]** `resourceDefinitions` is generated
    code consumed by destructuring (`{name, description, url}`) on the home page. Every entry must
    have all three fields non-empty, resource names must be unique, and each `url` must point at the
    R4B page matching its own name — a duplicate or mismatched row sends operators to the wrong spec.
    `src/utils/resourceDefinitions.ts`.

---

## Suspicious Patterns (drives test writing)

1. **[`src/api/adminApi.ts:131` — lossy split]** `queryParameter.split('=')` destructured into
   `[name, value]`, versus `FhirApi.getUrl`'s correct `indexOf('=')` + `substring`.
   - Failure mode: any search value containing `=` is truncated at the first one; a parameter with
     no `=` appends the literal string `"undefined"` as its value.
   - Reachable via: `SearchContainer` (`_source` field, present for **every** resource type) →
     `SearchFormQuery.getQueryParameters()` → `manageExport.tsx:49` → `AdminApi.getUrl`.
   - Test: `getUrl({queryParameters: ['_source=https://ex.com/a?b=c']})`, assert
     `searchParams.get('_source')` round-trips exactly. → **BUG-001**

2. **[`src/utils/authUrlProvider.ts:45` — unconditional throw after the fallback branch]** The
   `if (!wellKnownUrl) throw` guard sits *after* the `else` branch that exists specifically to handle
   `!wellKnownUrl`, and its message names `LOGOUT_URL` (copy-paste from the guard above it).
   - Failure mode: the explicit-URL configuration path is dead code; login fails with an error
     naming a variable the operator already set.
   - Test: set `AUTHORIZE_URL`/`TOKEN_URL`/`LOGOUT_URL`, leave `WELL_KNOWN_URL` unset, assert the
     three URLs are returned. → **BUG-002**

3. **[`src/context/ThemeContext.tsx:49` — unguarded `JSON.parse` in a `useState` initializer]**
   `savedTheme ? JSON.parse(savedTheme) : false` with no try/catch, executed during the first render
   of a provider that wraps the entire app.
   - Failure mode: a non-JSON `darkMode` value white-screens the SPA on every load until
     `localStorage` is cleared manually. Also returns a non-boolean for `'"yes"'`.
   - Test: `localStorage.setItem('darkMode', 'not-json')`, render the provider, assert children
     render in light mode. → **BUG-003**

4. **[`src/hooks/useResourceCount.ts:28-30` — early return leaves stale state behind]** When new
   props short-circuit the fetch, the effect returns before touching `count`, `isLoading` or
   `error`, so the hook reports the *previous* query's count as a settled, error-free answer.
   - Failure mode: `{count: <previous reference's number>, isLoading: false, error: null}` →
     `ReferenceLink` renders its green "Resource exists" checkmark for a reference it never queried.
   - Reachable via: `Reference.tsx:37` renders `ReferenceLink` with `key={index}`, so React reuses
     the same instance when the reference array changes; a reference with no `/` (contained or
     uuid-only) yields `id === undefined` → `queryParameters: undefined` → early return.
   - Test: succeed with 1, rerender with `queryParameters: undefined`, assert `count === null`.
     → **BUG-004**
   - *Not* filed, though it shares the root cause: the `.catch` at lines 44-52 also omits
     `setCount(null)`. Both consumers render the count behind `!error && !isLoading`, so that stale
     value is never displayed. Deliberately **not** pinned by a test: the fix suggested for the
     short-circuit branch applies to the `.catch` path too, so an assertion on the stale `count`
     would be a tripwire against it. The refetch-failure test asserts only what holds either way —
     the new parameters are requested, the failure is surfaced, and the hook settles.

5. **[`src/services/OktaAuthService.ts:71-84` and `CognitoAuthService.ts:75-85` — no-op
   `try { … } catch (error) { throw error; }` wrapping the token POST]** `removeLocalData('code_verifier')`
   sits *inside* the try, after the awaited POST, so it is skipped on failure. The rethrow-only catch
   is strong evidence cleanup was intended there.
   - Verified behavior: on a rejected token POST the PKCE `code_verifier` stays in `localStorage`.
     Nothing downstream compensates — `src/pages/Auth.tsx:88-98` catches a failed `fetchTokenAsync`
     and only calls `setError`; it never calls `removeAuthData`.
   - Status: **code hygiene, not a defect.** Originally filed as two findings (numbered 005 and 006
     in `bugs-found.md`) on an RFC 7636 single-use argument; adversarial review retracted both and
     the reasoning holds:
     (a) `getLoginUrlAsync` unconditionally overwrites the stored verifier on **every** login
     attempt — proven by each file's own passing test (`OktaAuthService.test.ts:105`,
     `CognitoAuthService.test.ts:128`, "mints a fresh verifier and challenge on every login
     attempt") — and `logout()` clears `code_verifier` via `removeAuthData`, so the stale value
     survives only until the next login or logout;
     (b) a verifier is inert without its matching authorization code, and that code is already
     spent or expired in every failure scenario — retaining the verifier is in fact what a
     legitimate retry of the *same* exchange requires;
     (c) RFC 7636 forbids reusing a verifier across *authorization requests*, which this code never
     does; it does not require erasing the verifier from client storage after a failed exchange.
   - Worth tidying anyway: moving `removeLocalData('code_verifier')` into a `finally` shortens the
     window in which an XSS-readable secret sits in storage, and gives the rethrow-only catch a
     reason to exist. Two independent copies of the block would both need the change — the PKCE
     helpers are byte-identical between the two services apart from scope handling, which is itself
     the stronger cleanup argument (hoist them into a shared base).
   - No failing test is filed for this. The two tests that asserted the verifier was cleared on
     failure were deleted; the passing tests that pin the real contract remain: the verifier is
     consumed on success, a fresh one is minted per login attempt, and an exchange with no stored
     verifier fails closed without contacting the IdP (invariant 16).

6. **[`src/api/baseApi.ts:74-81` — `buildHeaders` can throw]** `getAuthInfo(identityProvider)` throws
   when any `REACT_APP_AUTH_<P>_*` var for the stored provider is missing. A stale
   `identityProvider` in `localStorage` (provider renamed/removed between deployments) makes
   **every** request throw a raw `Error` from header construction, after `onRequest` has already
   fired. The surrounding code shows intent to degrade (`'jwt'` default plus
   `|| tokenToSendToFhirServer`), which this defeats.
   - No test filed as a bug: whether a config mismatch should fail loudly or fall back to `'jwt'` is
     a product decision, and `logout()` does recover the state. Covered by a Category A test that
     pins the current throwing behavior so a future change is deliberate.

7. **[`src/api/baseApi.ts:147-154` — empty base URL throws `TypeError`]** With `fhirUrl` unset,
   `getBaseUrl()` returns `''` → `normalizedBase` becomes `'/'` → `new URL(path, '/')` throws
   `TypeError: Invalid URL` rather than returning the structured error shape the same-origin guard
   twelve lines later uses. `EnvironmentContext` already has to paper over this with a
   module-level `.catch()`.
   - No test filed as a bug: "unconfigured server should fail loudly" is defensible. Covered by a
     Category A test documenting that it throws, so the behavior is at least pinned.

8. **[`src/services/WellKnownConfigurationService.ts:57-62` — `cacheOptions` silently ignored after
   the first construction]** The cache is `static` and created lazily by whichever instance is built
   first; every later instance's `cacheOptions` are discarded. No production caller passes
   `cacheOptions` (`AuthUrlProvider` always passes `{}`), so per RULE 17 this is unreachable today
   and is recorded here rather than filed. The *reachable* consequence — a shared, process-wide,
   1-hour, never-invalidated IdP discovery cache — is pinned by a Category A test.

9. **[`src/services/WellKnownConfigurationService.ts:95-111` — a useless config is cached anyway]**
   A 200 response whose body is valid JSON but carries no `authorization_endpoint` /
   `token_endpoint` (captive portal, misconfigured proxy, `[]`) is written to the 1-hour cache.
   Every subsequent login for that hour then fails with
   `"…AUTHORIZE_URL is not defined"`, blaming env config for a transient upstream problem.
   Conceptually the same class as CACHE-1 (no invalidation path). Not filed: caching a syntactically
   valid discovery document is arguably correct; the misleading downstream error is cosmetic.

10. **[`src/utils/searchFormQuery.ts:46` — `if (value)` drops falsy filter values]** The
    `type-coercion-security-filter` pattern: a `0`/`false` filter value would be dropped, widening
    the result set. Not filed — `SearchContainer` state is initialized to `''` and fed from
    `e.target.value`, so every value is a string and only `''` (correctly omitted) is falsy. Would
    become a live bug the moment a numeric or boolean-typed control is added.

11. **[`src/utils/searchFormQuery.ts:28,35` — `gt`/`lt` with date-only truncation]** AuditEvent
    start/end use strictly-greater/strictly-less against a date-only value, so events on the boundary
    day are excluded, while `FhirApi`'s injected default window uses inclusive `ge`/`le`. Two
    different window semantics for the same field. Not filed: no spec in the business-logic master
    fixes which is correct — flagged for human decision.

12. **[`src/api/baseApi.ts:278-279` — `text.length` used as a byte count]** In the bodyless-response
    fallback, `onProgress(text.length, totalBytes)` reports UTF-16 code units against a
    byte-denominated `content-length`. Not filed: `response.body` is always present in a real
    browser for a non-empty response (RULE 20 framework guarantee); only reachable in test doubles.

13. **[`src/api/adminApi.ts:115,127` — root-relative `admin/` path against a based FHIR URL]**
    `new URL('admin/X', fhirUrl)` appends to `fhirUrl`'s path when it ends in `/` but *replaces* the
    last segment when it does not, so a FHIR URL with its own path prefix produces two different
    admin paths depending on a trailing slash. `BaseApi.streamRequest` normalizes exactly this case
    for its own paths (lines 148-153) but `AdminApi.getUrl` does not. Not filed: no deployment in
    `docker-compose.yml` / `.env.example` uses a path-bearing FHIR URL, so it is unreachable today.

14. **[`src/api/fhirApi.ts:144` — `delete('date')` is unconditional]** When an `id=` parameter is
    present, *all* `date` params are removed — including one the caller supplied deliberately, not
    just the injected default. Not filed: `useResourceCount`'s only callers pass either `id=` or a
    list-count query, never both.

15. **[`src/utils/auth.utils.ts:43` — `window.location.replace(logoutUrl)` with a config-sourced URL]**
    The logout URL comes from OIDC discovery or env vars, not user input, so this is not an open
    redirect today. It becomes one if `end_session_endpoint` is ever taken from a less-trusted source
    (e.g. a per-connection discovery document). Recorded as a boundary to re-check.

16. **[`src/api/fhirApi.ts:184-195` — the `onChunk` decoder is never flushed]** `sendRequest` keeps
    one `TextDecoder` across the body (correct) but never makes the final argument-less
    `decode()` call that `BaseApi.streamRequest` (`baseApi.ts:249`) and `BaileyApi.streamChat`
    (`baileyApi.ts:60-63`) both make.
    - Failure mode: for a body ending mid-multi-byte-character, the concatenated `onChunk` text is
      missing the trailing bytes while the returned `rawText` contains them. The API Console
      displays a body that disagrees with the response actually received.
    - Reachable via: any truncated or mid-stream-dropped response — a case this stack explicitly
      supports (`incomplete: true`). Two of three sibling implementations flush; this one does not.
    - Test: single chunk `'ok' + first byte of '€'`, assert the streamed text equals `rawText`.
      → **BUG-007**

17. **[`src/api/adminApi.ts:163` — unencoded id interpolated into the admin path]**
    `` `/admin/triggerExport/${exportStatusId}` `` lets an id containing `..` collapse the path onto a
    different admin endpoint (`new URL` resolves dot segments). Not filed: the id is server-supplied
    (`ExportStatus.resource.id`, `src/pages/customResources/ExportStatus.tsx:32`), the request cannot
    leave the configured FHIR origin, and the server authorizes each admin endpoint independently.
    Pinned by a test that calls the real `triggerExport('../deletePatientDataGraph')` against a
    stubbed `fetch` and asserts both the origin confinement (invariant 1, true however the id is
    handled) and today's resolved path, so encoding the id becomes a deliberate change.

18. **[`src/context/ThemeContext.tsx:49` — the parsed value's *type* is never checked]** A
    parseable-but-non-boolean `darkMode` (e.g. `'"yes"'`, `'0'`) is stored in state as-is and used
    only for truthiness. Not filed: no consumer does anything but branch on it, so there is no
    runtime consequence — a type-annotation mismatch, which the drop-list excludes. Pinned by a
    characterization test.

19. **[`src/utils/incrementalBundleParser.ts:24-28` — `onError` is not at-most-once]** After
    `onError` fires, the tokenizer is in `ERROR` state, not `ENDED`, so the `!parser.isEnded` guard
    does not short-circuit a later `write()`; that write re-enters the tokenizer and is caught into a
    *second* `onError`. Not filed: the wrapper's actual contract ("never throws at the caller") holds,
    and the documented usage is "stop calling write() after onError". Worth knowing before anyone
    treats `onError` as a one-shot signal.

20. **[`src/services/WellKnownConfigurationService.ts:116` — error body interpolated into a string]**
    `error.response?.data || error.message` renders a JSON error body as `[object Object]`, hiding the
    real cause. Not filed: diagnostics only, and the drop-list excludes generic-error-message issues.

21. **[`src/utils/auth.utils.ts:18` — case-sensitive provider comparison]**
    `CREDENTIALS_BASED_PROVIDERS.has(identityProvider)` compares the raw stored value against a
    lower-case-only `Set`, while `AuthServiceFactory.getAuthService` (`src/services/AuthServiceFactory.ts:14`)
    normalizes with `.toLowerCase()`. A stored `'BWELLAPP'` therefore takes the OIDC branch, where
    `getAuthService` throws and the catch-all fallback fires. Not filed: invariant 4 makes the
    user-visible outcome correct either way (cleared + redirected to origin); this is log noise.
    Pinned by a characterization test.

---

## Density-floor exemption: `src/utils/resourceDefinitions.ts`

Coverage reports 0% statements with **100% branches and 100% functions** and only line 7 uncovered.
Reading the file confirms why: it is 713 lines of auto-generated static data — one
`export const resourceDefinitions: TResourceDefinition[]` containing ~150 object literals of
`{name, description, url}`, with **zero functions, zero branches, and no lookup helpers**. The header
says `// This file is auto-generated by generate_components so do not edit manually`.

The service/API density floor (15 tests for >200 lines) does not apply, and padding to it would
produce exactly the per-row assertion garbage the adversarial reviewer rejects. Instead the test file
asserts **table-level integrity properties** that a bad regeneration of the generator would break:
every entry has all three keys non-empty, resource names are unique, every `url` is an
`https://www.hl7.org/fhir/R4B/...` page whose slug equals the lowercased resource name, the array is
non-empty and sorted, and the shape matches what consumers destructure. Roughly 8 tests, each of
which fails if the generator regresses — which is the only way this file can ever be wrong.
