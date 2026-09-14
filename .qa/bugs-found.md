# Bugs Found — fhir-server-ui (DCON-5564)

Branch: `SG-DCON-5564`
Date: 2026-09-14
Scope: `src/services`, `src/api`, `src/utils`, `src/hooks`, `src/context`

**5 findings.** Every one is proven by a test that **fails on current code** and asserts the
correct behavior. No source files were modified — these are reports, not fixes.

Verification: `yarn test` → **5 failed | 551 passed (556)**. All 5 failures are the 5 bug tests
below; nothing else in the suite fails. Raw output in [`test-run.txt`](./test-run.txt).

Observations that could not be turned into a failing test (config-unreachable code, cosmetic
diagnostics, type-only mismatches, behavior with a valid fallback) are **not** listed here — they
are in the "Suspicious Patterns" section of [`domain-invariants.md`](./domain-invariants.md),
items 5-15 and 17-21.

Retractions: two findings that originally appeared here — the Okta and Cognito notes that the PKCE
`code_verifier` is not cleared after a *failed* token exchange, filed as BUG-005 and BUG-006 — were
withdrawn after adversarial review. The behavior is real (`src/pages/Auth.tsx:88-98` catches a
failed `fetchTokenAsync` and only calls `setError`; nothing calls `removeAuthData`), but it is not a
defect: `getLoginUrlAsync` unconditionally mints a fresh verifier on every login attempt, a verifier
is inert without its matching authorization code, and RFC 7636 forbids *reuse across authorization
requests* — which this code never does — not retention in client storage after a failure. Both are
now code-hygiene notes in Suspicious Pattern 5 of
[`domain-invariants.md`](./domain-invariants.md); their two failing tests were deleted. See
[`adversarial-review.md`](./adversarial-review.md) for the full reasoning, and
[`findings.jsonl`](./findings.jsonl) (`"status":"retracted"`) for provenance.

---

## BUG-003 — Corrupt `darkMode` value in localStorage white-screens the entire app

- **Severity:** HIGH (availability; self-inflicted denial of service, no in-app recovery)
- **File:** `src/context/ThemeContext.tsx:46-50`
- **Invariant violated:** INV-19 (persisted client state can never crash the render)
- **Proving test:** `src/context/ThemeContext.logic.test.ts` →
  `BUG-003: survives a non-JSON darkMode value in localStorage instead of failing to render`
- **Observed failure:** `SyntaxError: Unexpected token 'o', "not-json" is not valid JSON`

```ts
const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = getLocalData('darkMode');
    return savedTheme ? JSON.parse(savedTheme) : false;   // no try/catch, runs during render
});
```

`JSON.parse` runs inside a `useState` initializer — i.e. in the **render phase** of
`ThemeContextProvider`, which wraps the whole application in `main.tsx`. There is no error boundary
above it, so an unparseable value throws out of the root render and the user gets a blank page.
Because the bad value is *persisted*, every subsequent reload fails identically, and the user cannot
reach any control that would clear it; recovery requires devtools or clearing site data.

`localStorage` is writable by any script on the origin, by browser extensions, and by older versions
of this app — a key whose format changed between releases is the most likely real-world trigger.

**Suggested fix:** wrap the parse in `try/catch` and fall back to `false`; optionally
`removeLocalData('darkMode')` on a parse failure so the bad value does not persist.

---

## BUG-001 — Admin search values containing `=` are silently truncated

- **Severity:** MEDIUM (wrong data presented as correct)
- **File:** `src/api/adminApi.ts:129-134`
- **Invariant violated:** INV-7 (search filters are transmitted losslessly)
- **Proving test:** `src/api/adminApi.test.ts` →
  `BUG-001: preserves a parameter value that itself contains "=" instead of truncating it`
- **Observed failure:** expected `https://example.com/exports?tenant=acme&run=7`,
  received `https://example.com/exports?tenant`

```ts
queryParameters.forEach((queryParameter) => {
    const [name, value] = queryParameter.split('=');   // truncates at the *first* '='
    url.searchParams.append(name, value);
});
```

`String.split('=')` on `_source=https://example.com/exports?tenant=acme&run=7` yields three
elements; destructuring keeps only the first two, so everything from the second `=` onward is
discarded. `FhirApi.getUrl` (`src/api/fhirApi.ts:118-121`) does the same job correctly with
`indexOf('=')` + `substring`, which is what makes this a defect rather than a design choice.

**Reachability (RULE 17), fully traced:** `src/components/SearchContainer.tsx:42` →
`new SearchFormQuery(searchParams).getQueryParameters()` → `src/admin/manageExport.tsx:49`
`adminApi.getUrl({ resourceType, id, queryParameters, fhirUrl })`. The `_source` field is appended by
`searchForm.utils.getFormData` for **every** resource type, and `_source` values are URLs that
legally contain `=`. The same applies to `_security` token values and base64 identifiers.

**Impact:** the admin console runs a *different* query than the operator typed and presents the
result as the answer — no error, no warning. A secondary effect: a `queryParameters` entry with no
`=` at all appends the literal string `"undefined"` as its value.

**Suggested fix:** use the same first-`=` split as `FhirApi.getUrl`, and skip entries with no `=`.

---

## BUG-002 — Providers configured without OIDC discovery can never authenticate

- **Severity:** MEDIUM (feature dead on arrival; misleading error names the wrong variable)
- **File:** `src/utils/authUrlProvider.ts:45-47`
- **Invariant violated:** INV-18 (every documented provider configuration must be able to succeed)
- **Proving test:** `src/utils/authUrlProvider.test.ts` →
  `BUG-002: resolves from AUTHORIZE_URL/TOKEN_URL/LOGOUT_URL when no WELL_KNOWN_URL is set`
- **Observed failure:** `promise rejected "Error: REACT_APP_AUTH_TESTIDP_LOGOUT_URL is not defined"
  instead of resolving`

```ts
} else {
    // otherwise, use the environment variables
    authorizeUrl = APP_ENV[`REACT_APP_AUTH_${P}_AUTHORIZE_URL`];
    tokenUrl     = APP_ENV[`REACT_APP_AUTH_${P}_TOKEN_URL`];
    logoutUrl    = APP_ENV[`REACT_APP_AUTH_${P}_LOGOUT_URL`];
}
...
if (!wellKnownUrl) {
    throw new Error(`REACT_APP_AUTH_${P}_LOGOUT_URL is not defined`);   // <-- wrong var, and
}                                                                       //     always fires here
```

The guard fires precisely when the `else` branch above it ran — so the explicit-URL configuration
path is **dead code**. Two distinct defects in three lines:

1. The condition is inverted relative to the branch it guards: reaching this line with
   `!wellKnownUrl` is the *supported* configuration, not an error.
2. The message names `LOGOUT_URL` (copy-paste from the guard immediately above), so an operator who
   has correctly set `AUTHORIZE_URL`, `TOKEN_URL` **and** `LOGOUT_URL` is told `LOGOUT_URL` is
   missing. Debugging leads nowhere.

**Reachability:** config-gated. Every deployment in `docker-compose.yml` / `.env.example` sets
`WELL_KNOWN_URL`, which is why this has not been hit — the severity is MEDIUM rather than CRITICAL
for that reason. Any IdP that does not publish a discovery document is unusable.

**Suggested fix:** delete the `if (!wellKnownUrl)` guard. `wellKnownUrl` is already optional in the
declared return type.

---

## BUG-004 — A resource-existence checkmark is shown for a reference that was never queried

- **Severity:** MEDIUM (wrong clinical-data indicator presented as correct)
- **File:** `src/hooks/useResourceCount.ts:27-30`
- **Invariant violated:** INV-20 (a count belongs to the query that produced it)
- **Proving test:** `src/hooks/useResourceCount.test.ts` →
  `BUG-004: clears a previous count when the new props short-circuit the fetch`
- **Observed failure:** `expected 1 to be null`

```ts
useEffect(() => {
    if (!resourceType || !queryParameters) {
        return;                 // returns without resetting count/atLimit/isLoading/error
    }
    ...
}, [fhirUrl, setUserDetails, resourceType, serializedParams, limit]);
```

When new props make the hook decline to count, it returns `{count: <previous query's number>,
atLimit: <previous>, isLoading: false, error: null}` — indistinguishable from a settled, successful
answer for the *current* props.

**Reachability (RULE 17):** `src/partials/Reference.tsx:37` renders `ReferenceLink` with
`key={`${index}`}`. Index keys mean React **reuses the same component instance** when the reference
array changes, so the hook receives new props instead of remounting. A reference with no `/`
(contained reference, uuid-only `valueString`) makes `reference.split('/')` yield no `id`, hence
`queryParameters: undefined` — the early-return path. `ReferenceLink` then renders
`<CheckCircleIcon titleAccess="Resource exists" />` because `count > 0` and neither `isLoading` nor
`error` is set.

**Impact:** in a clinical data browser, a green "Resource exists" affirmation for a reference the app
never checked is misinformation, not a cosmetic glitch.

**Suggested fix:** reset `count`/`atLimit`/`error` in the short-circuit branch before returning (and,
for the same reason, on the `.catch` path — see Suspicious Pattern 4 for why that one is currently
masked by both consumers' render guards).

---

## BUG-007 — API Console streams a body that disagrees with the response received

- **Severity:** LOW (display integrity on truncated responses)
- **File:** `src/api/fhirApi.ts:184-195`
- **Invariant violated:** INV-11 (streaming preserves bytes across chunk boundaries)
- **Proving test:** `src/api/fhirApi.test.ts` →
  `BUG-007: delivers the whole body through onChunk, flushing the decoder at the end`
- **Observed failure:** `expected 'ok' to be 'ok�'`

```ts
const decoder = new TextDecoder();
const result = await this.streamRequest({
    ...
    onChunk: onChunk ? (chunk) => onChunk(decoder.decode(chunk, { stream: true })) : undefined,
});
// no final decoder.decode() — the buffered partial sequence is never emitted
```

`sendRequest` correctly keeps one decoder alive across the whole body, but never makes the final
argument-less `decode()` call that flushes a trailing partial multi-byte sequence. Both sibling
implementations do: `BaseApi.streamRequest` (`src/api/baseApi.ts:249`) and `BaileyApi.streamChat`
(`src/api/baileyApi.ts:60-63`).

**Impact:** when a body ends mid-multi-byte-character — a truncated or mid-stream-dropped response,
which this stack explicitly supports via `incomplete: true` — the text streamed to the API Console
loses the trailing bytes while the returned `rawText` keeps them (as `U+FFFD`). The console shows a
body that differs from the response actually received, with nothing indicating a discrepancy.

**Suggested fix:** after `streamRequest` resolves,
`const flushed = decoder.decode(); if (flushed) { onChunk?.(flushed); }`.

---

## Severity summary

5 findings: 1 HIGH, 3 MEDIUM, 1 LOW.

| ID | Severity | File | Class |
|---|---|---|---|
| BUG-003 | HIGH | `src/context/ThemeContext.tsx:46-50` | availability / unguarded parse in render |
| BUG-001 | MEDIUM | `src/api/adminApi.ts:129-134` | silent data loss in query construction |
| BUG-002 | MEDIUM | `src/utils/authUrlProvider.ts:45-47` | dead code path / misleading error |
| BUG-004 | MEDIUM | `src/hooks/useResourceCount.ts:27-30` | stale state presented as current |
| BUG-007 | LOW | `src/api/fhirApi.ts:184-195` | display/response divergence |

Withdrawn after review (see Retractions above, and Suspicious Pattern 5 in
`domain-invariants.md`): the two PKCE `code_verifier` failure-path notes, previously numbered 005
and 006 in this list.
