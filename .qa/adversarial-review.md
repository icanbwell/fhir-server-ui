# Adversarial Review Results

## Summary
- Total tests reviewed: 466
- Total test files reviewed: 35 (22 Group A + 13 Group B)
- Source files read: 41 (34 modules under test, in full, + 7 corroborating files read to check
  reachability claims: `runtimeEnv.ts`, `test/setup.ts`, `index.tsx`, `App.tsx`, `pages/Auth.tsx`,
  `partials/Reference.tsx`, `partials/ReferenceLink.tsx`)
- PASS: 460
- FAIL: 6
- Bugs verified: 5 confirmed / 0 false positive / 2 overstated / 0 inverted

Counting note: one PASS/FAIL line per `it(...)` / `it.each(...)` declaration, in source order.
Nine files use `it.each`, so their declaration count is lower than their runtime case count.
Declaration totals are 349 (Group A) + 117 (Group B) = 466, matching the brief exactly. Runtime
totals are 553 (`yarn test`: 7 failed | 546 passed), and the `it.each` blocks account for the
whole 466 -> 553 gap. Files using `it.each` (block -> runtime cases):
`EnvironmentContext.test.ts` 5 -> 10, `auth.utils.test.ts` 10 -> 12,
`authUrlProvider.test.ts` 19 -> 23, `incrementalBundleParser.test.ts` 6 -> 7,
`attachment.utils.test.ts` 13 -> 16, `isTrue.test.ts` 2 -> 10.

I re-ran `yarn test --run` myself. Result reproduced exactly: **7 failed | 546 passed (553)**, and
the 7 failures are precisely the 7 bug tests. No other test in the suite fails, and no bug test
fails for an incidental reason.

---

## Results by File

### src/api/adminApi.test.ts (tests source: src/api/adminApi.ts)
PASS | line:63 | builds an admin-prefixed path resolved against the supplied FHIR base
PASS | line:70 | appends the id as a path segment
PASS | line:80 | accepts a queryString with or without its leading question mark
PASS | line:97 | merges queryParameters on top of an existing queryString instead of replacing it
PASS | line:109 | appends rather than replaces repeated parameter names
PASS | line:119 | handles zero, one and many queryParameters
PASS | line:145 | percent-encodes parameter values so they cannot inject extra parameters
PASS | line:158 | injects the default _count=10 for a collection query (no id)
PASS | line:164 | does not inject _count when a single resource is addressed by id
PASS | line:174 | respects a caller-supplied _count from the queryString
PASS | line:184 | respects a caller-supplied _count from queryParameters
PASS | line:194 | BUG-001: preserves a parameter value that itself contains "=" instead of truncating it
FAIL | line:222 | turns a bare parameter with no "=" into the literal string "undefined" (characterization) | ASSERTION | pins behavior the deliverable's own BUG-001 write-up calls a defect ("a queryParameters entry with no `=` at all appends the literal string `undefined`") and whose stated fix ("skip entries with no `=`") would break this test
PASS | line:212 | passes a value with no "=" in it through unchanged (control for BUG-001)
FAIL | line:447 | resolves dot segments in a trigger id against the admin path (characterization) | CALL | calls no AdminApi method at all; the entire body is `new URL('/admin/triggerExport/../deletePatientDataGraph', FHIR_URL)` plus an assertion on `.pathname`. This asserts the WHATWG URL spec, not this repo's code. It would still pass with every line of adminApi.ts deleted, were the import removed
PASS | line:236 | throws when no FHIR base URL is configured rather than building a relative request
PASS | line:242 | sends all four match operands as query parameters
PASS | line:261 | omits includeMatchRequest unless it was explicitly requested
PASS | line:273 | sends includeMatchRequest=true when requested
PASS | line:285 | sends only id and resourceType for a one-to-N match by default
PASS | line:295 | adds matchResourceType to a one-to-N match when supplied
PASS | line:307 | POSTs a match payload verbatim
PASS | line:322 | requests $everything for a patient with contained resources as JSON
PASS | line:333 | requests $everything for a person with contained resources as JSON
PASS | line:340 | deletes a patient data graph with DELETE and no request body
PASS | line:349 | deletes a person data graph with DELETE and no request body
PASS | line:357 | carries the id of a delete target verbatim, including characters needing encoding
PASS | line:368 | reads person-to-person links by bwell person id
PASS | line:376 | creates a person-to-person link with both ids in the POST body
PASS | line:384 | removes a person-to-person link with both ids in the POST body
PASS | line:391 | creates a person-to-patient link with the external person id and patient id
PASS | line:398 | removes a person-to-patient link keyed on personId, not externalPersonId
PASS | line:405 | repoints a resource at a different patient with all three operands
PASS | line:418 | fetches export status through getUrl, including the injected _count
PASS | line:426 | fetches a single export status by id without a _count
PASS | line:437 | triggers an export by POSTing to the id-suffixed path with no request body
PASS | line:457 | sends the caller-provided path through indexApi with _format=1
PASS | line:465 | adds audit=true to an index request only when auditing was asked for
PASS | line:471 | looks up cache keys by resource type and id
PASS | line:481 | invalidates the exact list of cache keys it was given (CACHE-1)
PASS | line:489 | sends an empty cacheKeys list as an empty array, never as a wildcard
PASS | line:495 | searches logs by id
PASS | line:504 | logs the user out when an admin endpoint answers 401 (INV-5)
PASS | line:513 | keeps the session when an admin endpoint answers 403 for lack of privilege (INV-6)
PASS | line:525 | attaches the session bearer token to admin requests (INV-2)

### src/api/baseApi.test.ts (tests source: src/api/baseApi.ts)
PASS | line:117 | resolves a path-absolute urlString against the configured FHIR base without losing the base path
PASS | line:126 | appends to a base that already ends in a slash without doubling it
PASS | line:135 | strips this app's own origin from the urlString and re-resolves against the FHIR server
PASS | line:147 | applies params onto the resolved URL, replacing an existing value of the same name
PASS | line:161 | reports the request as method + path only, never the absolute URL (INV-1)
PASS | line:173 | refuses an absolute foreign-origin path without ever calling fetch
PASS | line:189 | refuses an origin that merely looks like a subdomain-suffix of the FHIR server
PASS | line:203 | confines a scheme-relative //host path to the FHIR origin instead of following it
PASS | line:213 | confines a baseUrlOverride request to the override origin and refuses an escape from it
PASS | line:228 | sends a baseUrlOverride request to the override origin, not the configured FHIR server
PASS | line:244 | attaches the session token as a Bearer header
PASS | line:253 | omits Authorization entirely when no token is stored
PASS | line:262 | ignores a caller-supplied Authorization header so the session token cannot be overridden
PASS | line:279 | ignores a lower-cased authorization header too, and does not blank the token
PASS | line:296 | merges caller headers case-insensitively so only one Accept survives
PASS | line:310 | sends the no-cache set and the Origin-Service marker on every request
PASS | line:324 | reads the token from the key named by the provider's tokenToSendToFhirServer
PASS | line:341 | falls back to the jwt key when the provider does not name a token key
PASS | line:357 | propagates a provider-config failure out of header construction (characterization)
PASS | line:375 | logs the user out on 401
PASS | line:385 | does NOT log the user out on 403 and still returns the response body
PASS | line:401 | does NOT log the user out when a 401 comes from a baseUrlOverride origin
PASS | line:414 | does not attempt a logout when no setUserDetails was supplied
PASS | line:425 | reassembles a multi-byte UTF-8 character split across two chunks
PASS | line:438 | flushes a dangling partial multi-byte sequence at the very end of the body
PASS | line:449 | reports totalBytes from content-length when the body is not encoded
PASS | line:466 | reports totalBytes as undefined when the response is content-encoded
PASS | line:480 | hands raw chunks to onChunk in arrival order
PASS | line:492 | surfaces status and headers via onHeaders before the body is consumed
PASS | line:508 | returns the partial body with incomplete=true when the stream drops mid-response
PASS | line:520 | returns errorMessage and no status when fetch fails outright
PASS | line:531 | rethrows an AbortError raised by fetch instead of degrading
PASS | line:539 | rethrows an AbortError raised mid-stream instead of returning partial data
PASS | line:549 | collects binary chunks and leaves text empty in binary mode
PASS | line:566 | parses a JSON body into json
PASS | line:577 | leaves json undefined for a non-JSON body rather than throwing
PASS | line:588 | serializes the request body only when data was supplied
PASS | line:604 | sends no body for a DELETE with no data
PASS | line:613 | extracts the version string from the /version payload
PASS | line:626 | returns a Blob tagged with the response content-type
PASS | line:641 | falls back to application/octet-stream when the server sends no content-type
PASS | line:649 | rejects on a non-2xx status and attaches the status, url and decoded server body
PASS | line:665 | rejects a truncated download even though the status was 200
PASS | line:677 | forwards caller params and headers onto the download request

### src/api/fhirApi.test.ts (tests source: src/api/fhirApi.ts)
PASS | line:91 | builds the R4 search path for a resource type and injects the list defaults
PASS | line:100 | appends the id, then the operation after the id
PASS | line:113 | accepts a queryString with or without a leading question mark
PASS | line:132 | invariant 7: splits each queryParameter on the FIRST "=" so values containing "=" survive
PASS | line:145 | invariant 7: appends repeated query parameter names instead of replacing them
PASS | line:159 | injects _count=10 for a search with no id
PASS | line:169 | does not inject _count when an id pins the request to one resource
PASS | line:180 | injects _count for a _history listing (as id or as operation)
PASS | line:199 | never overrides a caller-supplied _count
PASS | line:208 | injects _metaUuid=1 unless the caller asked for _format=json
PASS | line:229 | invariant 8: bounds an AuditEvent query with two inclusive date bounds 7 days apart
PASS | line:243 | invariant 8: leaves a caller-supplied AuditEvent date untouched
PASS | line:255 | does not add a date window to non-AuditEvent resource types
PASS | line:266 | invariant 10: asks for id-only elements and limit+1 rows rather than _total=accurate
PASS | line:285 | returns the exact entry count when the server returns fewer rows than the limit
PASS | line:293 | invariant 10: clamps to the limit and sets atLimit when limit+1 rows come back
PASS | line:301 | reports exactly the limit without atLimit when the server returns precisely the limit
PASS | line:309 | treats a bundle with no entry array as zero
PASS | line:319 | returns null (not zero) on a non-2xx response so a failure is never shown as a count
PASS | line:329 | invariant 9: drops the injected AuditEvent date window for an exact id= lookup
PASS | line:347 | invariant 9: keeps the AuditEvent date window for a list count with no id= parameter
PASS | line:363 | forwards the abort signal to fetch
PASS | line:378 | requests the built URL and forwards raw chunks and byte progress to the caller
PASS | line:408 | invariant 13: reports an unknown total when the response is content-encoded
PASS | line:429 | reads a single resource by id from the configured FHIR server
PASS | line:444 | POSTs the resource to $merge with smartMerge=true by default
PASS | line:461 | passes smartMerge=false through when the caller opts out
PASS | line:478 | invariant 11: reassembles a multi-byte character split across a chunk boundary
PASS | line:502 | invariant 1: refuses a cross-origin urlPath before any fetch happens
PASS | line:518 | invariant 1: neutralises a scheme-relative path into a path on the configured server
PASS | line:526 | invariant 2: the session token owns Authorization and caller headers merge case-insensitively
PASS | line:550 | surfaces the status and response headers via onHeaders before the body completes
PASS | line:578 | reports a network failure as {error} json rather than a blank response
PASS | line:589 | invariant 14: rethrows an AbortError instead of reporting it as a failed response
PASS | line:597 | invariant 12: a mid-stream drop returns the partial body plus incomplete=true
PASS | line:617 | invariant 5: a 401 from the configured FHIR server logs the session out
PASS | line:633 | invariant 5: a 403 is a permissions answer, not a logout
PASS | line:648 | records the request path and method for the last-request indicator
PASS | line:665 | strips this app own origin from a urlPath so it still resolves to the FHIR server
PASS | line:677 | BUG-007: delivers the whole body through onChunk, flushing the decoder at the end

### src/api/baileyApi.test.ts (tests source: src/api/baileyApi.ts)
PASS | line:54 | POSTs the chat request to /bailey/v1/responses on the configured Bailey origin
PASS | line:75 | overrides BaseApi FHIR defaults with JSON + SSE content negotiation headers
PASS | line:90 | attaches the session bearer token from local storage
PASS | line:101 | streams decoded text to onChunk, one call per chunk
PASS | line:115 | invariant 11: reassembles a multi-byte character split across a chunk boundary
PASS | line:134 | flushes the decoder when the stream ends mid-character instead of dropping the bytes
PASS | line:150 | reports the x-request-id response header through onRequestId
PASS | line:162 | does not call onRequestId when the response carries no x-request-id header
PASS | line:172 | invariant 6: a 401 from Bailey does not log the fhir-server-ui session out
PASS | line:186 | returns both the status and the explanatory body on a non-2xx response
PASS | line:198 | populates errorMessage with no status when the fetch itself fails
PASS | line:210 | invariant 14: forwards the abort signal and rethrows an AbortError

### src/context/EnvironmentContext.test.ts (tests source: src/context/EnvironmentContext.ts)
PASS | line:85 | [it.each x6] invariant 24 (opt-out kill switch): REACT_APP_ENABLE_BAILEY $flagLabel -> baileyEnabled $expected
PASS | line:95 | maps each APP_ENV variable onto its own context field
PASS | line:131 | falls back to empty strings (and the literal "null" version) when nothing is configured
PASS | line:146 | getFhirServerVersion() reports "null" until the module-load getVersion() resolves, then the server version
PASS | line:163 | invariant 25: a rejected module-load getVersion() leaves the version at "null" without an unhandled rejection

### src/context/LastRequestContext.test.ts (tests source: src/context/LastRequestContext.ts)
PASS | line:35 | hands a consumer rendered with no provider a null lastRequest
PASS | line:43 | default recordRequest is a safe no-op: it neither throws nor changes lastRequest
FAIL | line:55 | passes a provider-supplied lastRequest through to the consumer verbatim | DELETION | the test supplies the value through its own `Provider` and asserts it comes back out. That is React's Context guarantee. The module's only executable content is the `createContext` default, which this test never touches — replace the whole module with `createContext<any>(undefined)` and this test still passes
FAIL | line:85 | hands the provider the exact TRequestInfo the consumer reported, unmodified | DELETION | pure mock-wiring through React: the test installs its own `vi.fn()` as `recordRequest` via `Provider`, clicks, and asserts the mock got the arguments the test itself hard-coded. No source logic participates; survives replacing the module's default with anything
FAIL | line:113 | propagates a changed provider value to every consumer under it | DELETION | asserts that React re-renders Context consumers when the provider value changes. Framework behavior, not module behavior; insensitive to the module's default value

### src/context/ThemeContext.logic.test.ts (tests source: src/context/ThemeContext.tsx)
PASS | line:25 | BUG-003: survives a non-JSON darkMode value in localStorage instead of failing to render
PASS | line:42 | reads a well-formed true as dark mode
PASS | line:48 | reads a well-formed false as light mode
PASS | line:54 | treats an absent preference as light mode and writes the default back
PASS | line:61 | treats an empty stored value as light mode without attempting to parse it
PASS | line:67 | carries a parseable-but-non-boolean value straight through (characterization)
PASS | line:80 | treats a stored JSON 0 as light mode

### src/context/ThemeContext.test.tsx (tests source: src/context/ThemeContext.tsx)
PASS | line:23 | refuses to be used outside a ThemeContextProvider
PASS | line:29 | starts in light mode when nothing has been persisted
PASS | line:35 | restores a persisted dark-mode preference on mount
PASS | line:43 | restores a persisted light-mode preference on mount
PASS | line:51 | toggles the mode and persists the new value
PASS | line:65 | persists the initial light-mode default even before any toggle
PASS | line:71 | mirrors the mode onto the body element so non-MUI CSS can follow it
PASS | line:83 | applies the dark-mode body class on mount when dark mode was persisted
PASS | line:93 | renders its children
PASS | line:103 | supplies the brand primary color to descendants through the MUI theme
PASS | line:120 | switches the MUI palette mode to dark when dark mode was persisted

### src/hooks/useAgGridBrandTheme.test.ts (tests source: src/hooks/useAgGridBrandTheme.ts)
PASS | line:23 | builds the light theme from themeBalham with the brand blue as the accent colour
PASS | line:34 | leaves the light theme surface colours at themeBalham defaults (accentColor is the only override)
PASS | line:46 | builds the dark theme from the dark-mode brand surface, text, border and accent colours
PASS | line:66 | memoizes on isDarkMode so a re-render with the same value keeps the identical theme object
PASS | line:79 | rebuilds with the dark params when isDarkMode flips to true
PASS | line:100 | rebuilds a light theme (not a stale dark one) when isDarkMode flips back to false

### src/hooks/useResourceCount.test.ts (tests source: src/hooks/useResourceCount.ts)
PASS | line:38 | reports the count returned by the server and clears the loading flag
PASS | line:49 | passes the resource type, query parameters, limit and an abort signal through
PASS | line:60 | surfaces the at-limit flag so callers can render "10+" instead of a hard number
PASS | line:72 | reports a zero count as 0, distinguishably from "not counted" (null)
PASS | line:81 | maps a null result (non-2xx from the server) to an uncounted state, not to zero
PASS | line:94 | never fetches when there is no resource type
PASS | line:108 | never fetches when there are no query parameters (the AuditEvent opt-out)
PASS | line:120 | refetches when the query parameters change
PASS | line:135 | does not refetch when the caller passes a new array with identical contents
PASS | line:149 | refetches when only the limit changes
PASS | line:161 | BUG-004: clears a previous count when the new props short-circuit the fetch
FAIL | line:184 | keeps a stale count behind the error flag when a refetch fails (characterization) | ASSERTION | asserts `count === 5` after a failed refetch, i.e. it locks in exactly the behavior BUG-004's own "Suggested fix" says to change ("reset count/atLimit/error in the short-circuit branch ... and, for the same reason, on the `.catch` path"). The same deliverable therefore both recommends a fix and ships a test that blocks it
PASS | line:206 | reports the error message from a failed count
PASS | line:216 | falls back to a generic message when the rejection is not an Error
PASS | line:224 | ignores an AbortError so an unmount-cancelled request shows no error
PASS | line:235 | aborts the in-flight request when the hook unmounts
PASS | line:252 | aborts the superseded request when the query parameters change
PASS | line:271 | does not apply a late response from a request that was already superseded

### src/services/BwellAppAuthService.test.ts (tests source: src/services/BwellAppAuthService.ts)
PASS | line:26 | posts the credentials to the identity login endpoint with a lower-case clientkey header
PASS | line:42 | builds the login url from the configured base url
PASS | line:53 | returns the nested accessToken.jwtToken field
PASS | line:67 | throws (invariant 27) when a 200 response has no accessToken at all
PASS | line:75 | throws (invariant 27) when accessToken is present but has no jwtToken
PASS | line:83 | throws (invariant 27) when jwtToken is an empty string
PASS | line:91 | fails closed without contacting the identity API when the base url is not configured
PASS | line:100 | propagates a rejected POST (network failure or 401) to the caller
PASS | line:108 | never puts the email or password in the url or the headers
PASS | line:124 | returns an empty list for undefined and for an empty string
PASS | line:129 | parses a single name=key pair
PASS | line:133 | parses multiple comma-separated pairs in order
PASS | line:141 | trims surrounding whitespace from both the name and the key
PASS | line:148 | drops trailing commas and empty segments
PASS | line:156 | drops an entry that has no "=" separator
PASS | line:164 | drops entries with an empty name or an empty key so no blank clientkey is ever sent
PASS | line:173 | splits on the first "=" only, so a key containing "=" keeps its full value (invariant 7)
PASS | line:181 | never throws for malformed operator input

### src/services/CognitoAuthService.test.ts (tests source: src/services/CognitoAuthService.ts)
PASS | line:57 | builds an authorization-code + PKCE request against the discovered authorize URL
PASS | line:72 | falls back to the standard OIDC scopes when the provider configures none
PASS | line:78 | uses the provider-configured login scopes when present (§72)
PASS | line:91 | omits the scope parameter entirely when the provider configures an empty string
PASS | line:101 | round-trips the requested resource URL through the state parameter
PASS | line:110 | stores a 128-character verifier drawn only from the unreserved character set (RFC 7636)
PASS | line:118 | sends the S256 hash of the stored verifier as the challenge, never the verifier itself
PASS | line:128 | mints a fresh verifier and challenge on every login attempt
PASS | line:141 | fails closed when the provider is not configured
PASS | line:154 | exchanges the code for tokens using the stored verifier
PASS | line:171 | never sends a client secret from the browser
PASS | line:187 | refuses to exchange a code when no verifier was stored, without contacting the IdP
PASS | line:195 | consumes the verifier on success so it cannot be replayed (RFC 7636 single use)
PASS | line:203 | BUG-006: consumes the verifier even when the token exchange fails
PASS | line:221 | propagates the IdP failure to the caller instead of returning a partial result
PASS | line:230 | fails closed when the provider configuration disappears mid-session
PASS | line:244 | builds a logout URL using Cognito's logout_uri parameter
PASS | line:256 | never puts the access token or verifier in the logout URL
PASS | line:266 | fails closed when the logout URL cannot be resolved

### src/services/OktaAuthService.test.ts (tests source: src/services/OktaAuthService.ts)
PASS | line:57 | builds an authorization-code + PKCE request against the discovered authorize URL
PASS | line:72 | requests the groups scope Okta needs for admin detection
PASS | line:78 | round-trips the requested resource URL through the state parameter
PASS | line:87 | stores a 128-character verifier drawn only from the unreserved character set (RFC 7636)
PASS | line:95 | sends the S256 hash of the stored verifier as the challenge, never the verifier itself
PASS | line:105 | mints a fresh verifier and challenge on every login attempt
PASS | line:119 | fails closed when the provider is not configured
PASS | line:132 | exchanges the code for tokens using the stored verifier
PASS | line:149 | never sends a client secret from the browser
PASS | line:165 | refuses to exchange a code when no verifier was stored, without contacting the IdP
PASS | line:173 | consumes the verifier on success so it cannot be replayed (RFC 7636 single use)
PASS | line:181 | BUG-005: consumes the verifier even when the token exchange fails
PASS | line:198 | propagates the IdP failure to the caller instead of returning a partial result
PASS | line:207 | fails closed when the provider configuration disappears mid-session
PASS | line:221 | builds a logout URL that returns the user to this app
PASS | line:230 | includes the id_token_hint so Okta ends the right session
PASS | line:238 | omits the id_token_hint when no id token is held
PASS | line:244 | never puts the access token or verifier in the logout URL

### src/services/WellKnownConfigurationService.test.ts (tests source: src/services/WellKnownConfigurationService.ts)
PASS | line:47 | creates its axios instance with a JSON Accept header and a 10 second timeout
PASS | line:58 | extracts the documented OIDC discovery fields verbatim from the response body
PASS | line:81 | defaults the three list-valued fields to empty arrays when the IdP omits them
PASS | line:101 | drops fields outside the documented set instead of passing the whole document through
PASS | line:132 | serves a repeated fetch of the same url from the cache without a second HTTP call
PASS | line:145 | keys the cache by url so two different IdPs do not collide
PASS | line:165 | rejects a non-object response body (e.g. an HTML error page served with 200)
PASS | line:174 | rejects a null response body rather than returning an all-undefined configuration
PASS | line:183 | wraps an axios error using response.data when the IdP returned a body
PASS | line:196 | wraps an axios error using its message when there is no response body
PASS | line:206 | wraps a non-axios, non-Error thrown value via String(error)
PASS | line:215 | does not cache a failed fetch, so a later retry of the same url can succeed

### src/utils/auditEventDateFilter.test.ts (tests source: src/utils/auditEventDateFilter.ts)
PASS | line:17 | ends at "now" and starts exactly 7 days earlier (invariant 8: bounded window)
PASS | line:25 | returns dayjs instances that satisfy fhirApi.addMissingRequiredParams' contract
PASS | line:36 | produces the exact date query parameters fhirApi appends for AuditEvent
PASS | line:43 | preserves the time-of-day on both bounds instead of zeroing it
PASS | line:54 | rolls back across a month boundary
PASS | line:64 | rolls back across a year boundary
PASS | line:74 | re-reads the clock on every call rather than freezing a module-load value

### src/utils/auth.utils.test.ts (tests source: src/utils/auth.utils.ts)
PASS | line:52 | clears every token-bearing key and nothing else (invariant 3)
PASS | line:66 | is a no-op that does not throw when nothing is stored
PASS | line:73 | clears auth data and redirects to the app origin when no identity provider is stored
PASS | line:87 | [it.each x3] clears locally and redirects to the origin for the credentials-based provider "%s" without building an IdP logout url
PASS | line:107 | redirects to the IdP end-session url for an OIDC provider and clears local auth data (invariant 4)
PASS | line:129 | still clears auth data and redirects to the origin when the logout url cannot be built (invariant 4)
PASS | line:150 | still clears auth data and redirects when the stored provider is unsupported (invariant 4 + 17)
PASS | line:166 | works without the optional setUserDetails callback
PASS | line:178 | works without setUserDetails on the OIDC path too
PASS | line:188 | matches credentials-based providers case-sensitively: "BWELLAPP" takes the OIDC path

### src/utils/authUrlProvider.test.ts (tests source: src/utils/authUrlProvider.ts)
PASS | line:68 | derives all three endpoints from the well-known document
PASS | line:88 | uppercases the provider name when reading environment variables
PASS | line:98 | prefers the discovery document over explicitly configured endpoint URLs
PASS | line:113 | fails closed when the discovery document omits the authorization endpoint
PASS | line:127 | fails closed when the discovery document omits the token endpoint
PASS | line:138 | fails closed when the discovery document omits the end-session endpoint
PASS | line:152 | propagates a discovery failure instead of silently falling back to env URLs
PASS | line:168 | names the missing variable when nothing at all is configured for the provider
PASS | line:177 | BUG-002: resolves from AUTHORIZE_URL/TOKEN_URL/LOGOUT_URL when no WELL_KNOWN_URL is set
PASS | line:196 | reports the missing TOKEN_URL when only the authorize URL is configured
PASS | line:206 | never contacts the discovery service when no WELL_KNOWN_URL is configured
PASS | line:221 | treats an empty-string WELL_KNOWN_URL as unset rather than fetching an empty URL
PASS | line:235 | returns every configured claim mapping for the provider
PASS | line:254 | defaults the FHIR-bound token key to jwt when unset (INV-2)
PASS | line:260 | defaults the FHIR-bound token key to jwt when configured as an empty string
PASS | line:268 | leaves the optional scope-prefix list undefined when not configured
PASS | line:277 | trims whitespace around each configured scope prefix
PASS | line:289 | [it.each x5] fails closed and names %s when it is missing
PASS | line:304 | fails closed for an identity provider that was never configured at all

### src/utils/incrementalBundleParser.test.ts (tests source: src/utils/incrementalBundleParser.ts)
PASS | line:7 | emits every Bundle.entry[].resource in order, with every field intact
PASS | line:35 | emits a resource as soon as its closing brace arrives, before the rest of the body is written
PASS | line:60 | emits only entry[].resource — not the Bundle metadata, nor entry[].fullUrl/search
PASS | line:97 | [it.each x2] emits nothing and reports no error for a Bundle with %s
PASS | line:112 | invariant 23: a malformed token reports onError once, keeps the entries already emitted, and leaves write()/finish() safe to call
PASS | line:136 | guards against double-ending: finish() after the Bundle auto-ended, finish() twice, and write() after the end are all no-ops

### src/utils/resourceDefinitions.test.ts (tests source: src/utils/resourceDefinitions.ts)
PASS | line:15 | is a non-empty table and every row carries a non-blank name, description and url
PASS | line:33 | has unique resource names (no duplicated rows)
PASS | line:46 | points every row at the R4B spec page whose slug matches that row's own name
PASS | line:65 | has unique urls (two resources never share one spec page)
PASS | line:73 | uses valid UpperCamelCase FHIR resource type identifiers for every name
PASS | line:83 | contains the resource types the app itself depends on, each with the right spec url
PASS | line:101 | is sorted by name, as the generator emits it (an unsorted table means a hand-edit)
PASS | line:109 | exposes exactly the { name, description, url } fields its consumers destructure
PASS | line:117 | supports HomePage's case-insensitive substring name filter

### src/utils/searchForm.utils.test.ts (tests source: src/utils/searchForm.utils.ts)
PASS | line:11 | builds the Patient form as given/family/email/_security followed by the universal tail
PASS | line:21 | flags given and family for exact matching with their own sort fields
PASS | line:43 | gives Person the same field set as Patient
PASS | line:47 | swaps email for a non-exact npi field on Practitioner
PASS | line:60 | builds the Organization form as name + _security + the universal tail
PASS | line:67 | builds the Encounter form as the period-backed date field + the universal tail
PASS | line:80 | returns only the universal tail for an unknown or empty resource type
PASS | line:93 | names the security-tag field exactly "_security" on every form that has one (invariant 22)
PASS | line:108 | returns independent field objects on each call, so one form cannot mutate another
PASS | line:125 | lists Patient's generated search fields minus the ones already in the basic form
PASS | line:142 | never overlaps the basic form for any generated resource type
PASS | line:156 | derives labels by capitalising each hyphen-separated part
PASS | line:170 | returns an empty list for a resource type with no generated search fields
PASS | line:177 | is prototype-safe: inherited Object keys yield [] instead of crashing

### src/utils/searchFormQuery.test.ts (tests source: src/utils/searchFormQuery.ts)
PASS | line:14 | bounds a non-AuditEvent search on _lastUpdated
PASS | line:20 | bounds an AuditEvent search on date, not _lastUpdated (invariant 8)
PASS | line:33 | emits only the lower bound when just start is supplied
PASS | line:42 | emits only the upper bound when just end is supplied
PASS | line:51 | emits no date bounds at all when neither start nor end is supplied
PASS | line:62 | appends :exact to given and family only
PASS | line:79 | omits fields whose value is an empty string or otherwise blank
PASS | line:94 | consumes start, end and resourceType instead of re-emitting them as filters
PASS | line:108 | passes values containing = and & through verbatim (invariant 7)
PASS | line:125 | reduces the date bounds to a date-only value, dropping the time component
PASS | line:139 | keeps the constructor-consumed fields addressable on the instance

### src/utils/streamingFetch.test.ts (tests source: src/utils/streamingFetch.ts)
PASS | line:59 | parses a JSON body and reports status, lower-cased headers and rawText
PASS | line:81 | fires onHeaders with the status and headers before any body chunk is delivered
PASS | line:105 | fires onChunk once per chunk with the decoded text of that chunk
PASS | line:123 | invariant 11: reassembles a multi-byte character split across a chunk boundary (one decoder)
PASS | line:149 | never throws on an unparseable body: json is undefined but rawText survives intact
PASS | line:168 | invariant 14: a mid-stream drop resolves with partial data, the real status and incomplete=true
PASS | line:200 | invariant 14: rethrows an AbortError raised by fetch itself
PASS | line:208 | invariant 14: rethrows an AbortError raised mid-stream instead of degrading to partial data
PASS | line:223 | reports a fetch-level network failure as {error} with no status and an empty rawText
PASS | line:238 | falls back to response.text() for a body-less response and still fires onChunk
PASS | line:256 | JSON-stringifies data into the request body and passes the url, method and signal through
PASS | line:276 | sends no request body when data is omitted
PASS | line:285 | passes caller-built headers (including Authorization) to fetch verbatim

---

## Group B (pre-existing) Results by File

### src/services/AuthServiceFactory.test.ts (tests source: src/services/AuthServiceFactory.ts)
PASS | line:16 | returns an OktaAuthService for "okta"
PASS | line:22 | is case-insensitive
PASS | line:28 | returns a CognitoAuthService for "cognito"
PASS | line:34 | throws when no identity provider is stored
PASS | line:42 | throws for an unsupported provider

### src/services/ClientCredentialsAuthService.test.ts (tests source: src/services/ClientCredentialsAuthService.ts)
PASS | line:14 | posts a client_credentials grant and returns the access token
PASS | line:35 | includes scope in the request body when provided
PASS | line:44 | throws when the token endpoint does not return an access token
PASS | line:52 | propagates request failures

### src/hooks/useStreamProgress.test.ts (tests source: src/hooks/useStreamProgress.ts)
PASS | line:6 | starts in a non-streaming, zeroed state
PASS | line:16 | start() resets counters and marks streaming
PASS | line:33 | onProgress() updates bytesReceived/totalBytes while streaming
PASS | line:50 | finish() stops streaming while preserving the last known counters

### src/utils/attachment.utils.test.ts (tests source: src/utils/attachment.utils.ts)
PASS | line:17 | decodes inline base64 attachment.data into a Blob
PASS | line:30 | reports malformed when attachment.data is not valid base64
PASS | line:46 | fetches a bare Binary/{id} reference and returns raw bytes as-is
PASS | line:73 | decodes a FHIR JSON Binary wrapper returned instead of raw bytes
PASS | line:92 | reports malformed when the Binary JSON wrapper has no usable data field
PASS | line:114 | treats a JSON-flavored response whose body is not the Binary wrapper as the real content
PASS | line:132 | reports a network failure with the HTTP status when the Binary fetch fails
PASS | line:151 | returns an external result for a non-Binary URL
PASS | line:159 | does not treat an absolute Binary URL from a different origin as same-server
PASS | line:170 | returns missing when there is neither data nor url
PASS | line:178 | [it.each x4] maps %s to .%s
PASS | line:187 | ignores charset/parameter suffixes and case
PASS | line:191 | falls back to bin for unknown or missing content types

### src/utils/compositionIndex.test.ts (tests source: src/utils/compositionIndex.ts)
PASS | line:24 | strips the _summary_document suffix from the type code
PASS | line:32 | normalizes the V1 "allergy" code to match V2/V3 "allergyintolerance"
PASS | line:43 | falls back to "unknown" when there is no type code
PASS | line:49 | matches a known meta.source to its version key
PASS | line:64 | tolerates a trailing slash on meta.source
PASS | line:74 | derives its own key from an unrecognized meta.source instead of dropping it
PASS | line:82 | orders known version columns V3, V2, V1
PASS | line:92 | only includes columns for versions actually present in the data
PASS | line:100 | excludes an unrecognized source from columns/rows entirely, routing it to `other` instead
PASS | line:124 | keeps compositions that share a type code but have different titles as separate `other` entries, not merged
PASS | line:148 | merges V1 "allergy" and V2/V3 "allergyintolerance" into a single row
PASS | line:168 | collects every distinct raw type code merged into a row, sorted
PASS | line:186 | lists a single type code once, not once per Composition sharing it
PASS | line:195 | leaves a cell empty (no entry) when a version has no Composition for that category
PASS | line:214 | keeps both Compositions when two share the same version and category
PASS | line:224 | sorts rows alphabetically by category key
PASS | line:238 | returns no columns, rows, or other entries for an empty list
PASS | line:248 | prefixes a bare uuid with "person."
PASS | line:254 | passes through an id that already carries a "person." prefix
PASS | line:260 | trims surrounding whitespace
PASS | line:268 | recognizes a "person."-prefixed id as a Person, stripping the prefix for bareId
PASS | line:276 | recognizes a bare id as a Patient, building a typed reference for searchValue
PASS | line:286 | trims surrounding whitespace

### src/utils/dateFormat.test.ts (tests source: src/utils/dateFormat.ts)
PASS | line:5 | matches a date-only value
PASS | line:9 | matches a full date-time value with a timezone offset
PASS | line:13 | matches a full date-time value ending in Z
PASS | line:17 | does not match plain narrative text
PASS | line:23 | formats a date-time value with time, month name, and a timezone abbreviation
PASS | line:29 | formats a date-only value without a time component
PASS | line:35 | returns null for an unparseable value
PASS | line:39 | returns null for an undefined value
PASS | line:45 | formats a gap of just over a day as days/hours/minutes
PASS | line:51 | formats a sub-minute gap as seconds only
PASS | line:55 | returns "0s" when the two timestamps are identical
PASS | line:59 | prefixes a minus sign when later is actually earlier than the first argument
PASS | line:65 | returns null when either timestamp is missing or unparseable

### src/utils/humanName.test.ts (tests source: src/utils/humanName.ts)
PASS | line:5 | prefers name.text when present
PASS | line:11 | falls back to given + family when there is no text
PASS | line:15 | joins multiple given names
PASS | line:21 | handles a family name with no given name
PASS | line:25 | handles a given name with no family name
PASS | line:29 | uses the first entry when there are several
PASS | line:38 | accepts a single HumanName object instead of an array
PASS | line:42 | returns undefined when there is no name at all
PASS | line:46 | returns undefined for an empty name array
PASS | line:50 | returns undefined when the only entry has neither text, given, nor family

### src/utils/isTrue.test.ts (tests source: src/utils/isTrue.ts)
PASS | line:5 | [it.each x4] returns true for %s
PASS | line:9 | [it.each x6] returns false for %s

### src/utils/jwtParser.test.ts (tests source: src/utils/jwtParser.ts)
PASS | line:42 | returns null when no identity provider has been chosen
PASS | line:49 | clears auth data and returns null when the stored provider is not configured
PASS | line:59 | returns null when there is no token in local storage
PASS | line:67 | clears auth data and returns null when the token is expired
PASS | line:80 | returns null (without clearing auth data) when the token fails to decode
PASS | line:95 | rethrows unexpected decode errors
PASS | line:110 | derives scope, username and admin status from the decoded token
PASS | line:135 | falls back to the custom scope claim when the token has no top-level scope
PASS | line:153 | strips configured scope prefixes
PASS | line:173 | falls back to decodedToken.username when no custom username claim matches

### src/utils/spreadsheetColumns.test.ts (tests source: src/utils/spreadsheetColumns.ts)
PASS | line:5 | marks a column as a date column and stores real Date values when every non-blank cell is an ISO date
PASS | line:20 | does not mark a column as a date column when any non-blank cell is not a parseable ISO date
PASS | line:27 | ignores blank cells when deciding whether a column is a date column, and stores them as null
PASS | line:35 | hides columns with no data when hideEmptyColumns is true
PASS | line:42 | defaults lastUpdated to sort descending, matching the pre-existing behavior
PASS | line:49 | does not mark a column of bare 4-digit numbers (e.g. a zip code or count) as a date column
PASS | line:57 | formats a date-only column value without fabricating a time-of-day
PASS | line:67 | formats a date-time column value including the time-of-day
PASS | line:77 | recognizes already-parsed Date cells (xlsx date-typed cells) as a date column and sorts them chronologically
PASS | line:102 | recognizes Date.prototype.toString()-shaped text cells as a date column
PASS | line:124 | formats an already-parsed date-only Date cell without fabricating a time-of-day

### src/utils/uid.utils.test.ts (tests source: src/utils/uid.utils.ts)
PASS | line:5 | is deterministic for the same input
PASS | line:9 | produces different ids for different input
PASS | line:13 | produces a well-formed v5 UUID
PASS | line:21 | returns true for a canonical UUID
PASS | line:25 | returns true for a bare UUID pattern embedded in a longer string
PASS | line:29 | returns false for a non-UUID string
PASS | line:33 | returns falsy for an empty string

### src/utils/uploadDocument.utils.test.ts (tests source: src/utils/uploadDocument.utils.ts)
PASS | line:12 | accepts a supported extension and returns its content type
PASS | line:16 | is case-insensitive on extension
PASS | line:20 | rejects an unsupported extension
PASS | line:25 | rejects a file with no extension
PASS | line:30 | rejects a file over the size cap
PASS | line:35 | accepts a file exactly at the size cap
PASS | line:41 | rejects prototype-pollution attack attempts (e.g., "resume.constructor")
PASS | line:47 | rejects prototype-pollution attack attempts (e.g., "photo.toString")
PASS | line:55 | lists every accepted extension for the file input accept attribute
PASS | line:61 | resolves to the base64 payload without the data-URL prefix
PASS | line:68 | builds a plain Patient reference for a Patient resourceType
PASS | line:72 | builds a person-compartment Patient reference for a Person resourceType
PASS | line:78 | builds an Encounter reference from an id

### src/utils/url.utils.test.ts (tests source: src/utils/url.utils.ts)
PASS | line:5 | appends with a leading ? when the URL has no query string
PASS | line:9 | appends with a leading & when the URL already has a query string

---

## Bug Verification

### BUG-001 — CONFIRMED
- Source: src/api/adminApi.ts:130-133
- Test: src/api/adminApi.test.ts:194
- Verdict reason: `const [name, value] = queryParameter.split('=')` genuinely discards everything
  after the second `=`; the sibling `FhirApi.getUrl` (fhirApi.ts:118-121) does the same job
  correctly with `indexOf('=')` + `substring`, so this is a defect, not a convention. I traced the
  reachability claim independently and it holds: `SearchContainer.tsx:42` builds a
  `SearchFormQuery`, `manageExport.tsx:49-52` passes `searchFormQuery.getQueryParameters()`
  straight into `adminApi.getUrl`, and `searchForm.utils.getFormData` appends `_source` and
  `identifier` to **every** resource type's form. The strongest real-world trigger is actually one
  the write-up under-sells: a base64 `identifier` value such as
  `identifier=urn:oid:1.2.3|YWJjZA==` loses its `==` padding silently. MEDIUM is defensible;
  by the stated rubric (HIGH = silent failure) an argument for HIGH exists, but the blast radius is
  one admin page, so MEDIUM is acceptable.

### BUG-002 — CONFIRMED
- Source: src/utils/authUrlProvider.ts:45-47
- Test: src/utils/authUrlProvider.test.ts:177
- Verdict reason: **The suggested alternative explanation (b) is wrong, and I verified it two
  independent ways.** (1) The test *does* set the variable it claims to: `authUrlProvider.test.ts:186`
  assigns `REACT_APP_AUTH_TESTIDP_LOGOUT_URL: 'https://idp.example.com/logout'` inside the same
  `Object.assign` as AUTHORIZE_URL and TOKEN_URL. (2) The stack trace in my own re-run points at
  `authUrlProvider.ts:46`, which is the `throw` inside `if (!wellKnownUrl)` — **not** line 43, the
  `throw` inside `if (!logoutUrl)`. Reaching line 46 at all requires `logoutUrl` to have been
  truthy at line 42. So the source really does reject a fully-specified explicit-URL configuration.
  The guard at line 45 fires exactly when the `else` branch at lines 27-32 ran, making that branch
  unreachable-on-success — dead code — and the message names the wrong variable (a copy/paste of
  line 43). Two defects in three lines. The confusing error text is itself part of the bug, and is
  precisely what makes hypothesis (b) superficially plausible. Config-gated (every shipped
  `docker-compose.yml`/`.env.example` sets WELL_KNOWN_URL), so MEDIUM is the right severity.

### BUG-003 — CONFIRMED
- Source: src/context/ThemeContext.tsx:46-50
- Test: src/context/ThemeContext.logic.test.ts:25
- Verdict reason: `JSON.parse(savedTheme)` runs inside a `useState` initializer, i.e. during
  render, with no `try`/`catch`. I verified the containment claim rather than taking it: `App.tsx:109`
  wraps the entire tree in `ThemeContextProvider`, `index.tsx` mounts `<App/>` with no boundary
  above it, and the only error boundary anywhere in the repo is `PdfLoadErrorBoundary`
  (`components/AttachmentPreview.tsx:22`), far below. So the throw escapes the root render: blank
  page, persisted, no in-app control reachable to clear it. One caveat the write-up should state
  explicitly: the app's own write path (`setLocalData('darkMode', JSON.stringify(isDarkMode))`) can
  never produce an unparseable value, so the trigger requires an external writer (another script on
  the origin, an extension, devtools, or a cross-release format change). That makes reachability
  narrower than the write-up implies while leaving the impact (unrecoverable white screen) intact.
  HIGH is defensible; the rubric's "crash -> CRITICAL" is offset by the external-trigger
  precondition.

### BUG-004 — CONFIRMED
- Source: src/hooks/useResourceCount.ts:27-30
- Test: src/hooks/useResourceCount.test.ts:161
- Verdict reason: The state defect is unambiguous and directly visible in the source — the early
  `return` leaves `count`/`atLimit`/`error` holding the previous query's values while `isLoading`
  is false, which is indistinguishable from a settled successful answer for the current props. The
  test exercises exactly that path (`rerender` with `queryParameters: undefined`) and asserts the
  correct behavior (`count` null), and it fails for the right reason (`expected 1 to be null`). The
  reachability chain also checks out mechanically: `Reference.tsx:37` does render `ReferenceLink`
  with `key={`${index}`}`, and `ReferenceLink.tsx:14-20` does pass
  `queryParameters: id ? [...] : undefined` from `reference.split('/')`, then renders
  `<CheckCircleIcon titleAccess="Resource exists" />` on `!isLoading && !error && count > 0`. What
  is *inferred* rather than demonstrated is the final step: it needs the same mounted `Reference`
  to receive a changed references array (rather than remounting on navigation) **and** a reference
  string with no `/`. Both are plausible, neither is proven end to end. MEDIUM is therefore the
  correct ceiling — the hook bug is real and worth fixing on its own merits, but the "green
  checkmark shown to a clinician" framing is a two-step inference and should be labelled as such.

### BUG-005 — OVERSTATED
- Source: src/services/OktaAuthService.ts:71-84
- Test: src/services/OktaAuthService.test.ts:181
- Verdict reason: The *behavior* is real — `removeLocalData('code_verifier')` is on the success path
  only, the `catch (error) { throw error; }` is a genuine no-op, and I confirmed nothing downstream
  compensates (`pages/Auth.tsx:88-98` catches a failed `fetchTokenAsync` and only calls `setError`;
  it never calls `removeAuthData`). But the *characterization as an RFC 7636 single-use violation is
  incorrect*, and the file's own test disproves the persistence angle: the test at line 105 ("mints a
  fresh verifier and challenge on every login attempt") proves `getLoginUrlAsync` unconditionally
  overwrites the stored verifier, so the stale value survives only until the next login attempt (or
  any `logout()`, which clears `code_verifier` via `removeAuthData`). Further, a verifier is inert
  without its matching authorization code, and that code is already spent or expired in every
  failure scenario listed; retaining the verifier is in fact what a legitimate retry of the *same*
  exchange requires. RFC 7636 forbids reusing a verifier across authorization requests — which this
  code never does — it does not require erasing it from client storage on failure. So the test
  asserts a hygiene policy, not a spec requirement. Recommendation: keep the observation, drop the
  "defect"/"RFC violation" framing, and demote it to the Suspicious Patterns list alongside the
  other non-bug notes. The test itself should not ship as a failing bug test.

### BUG-006 — OVERSTATED
- Source: src/services/CognitoAuthService.ts:75-85
- Test: src/services/CognitoAuthService.test.ts:203
- Verdict reason: Byte-identical situation to BUG-005, including the disproving sibling test at
  `CognitoAuthService.test.ts:128`. Same verdict for the same reasons. Filing it separately is
  correct *if* it is a bug at all; since it is not, both entries should move together.

### BUG-007 — CONFIRMED
- Source: src/api/fhirApi.ts:186-195
- Test: src/api/fhirApi.test.ts:677
- Verdict reason: `sendRequest` creates its own `TextDecoder` for the `onChunk` wrapper, calls it
  only with `{ stream: true }`, and never makes the final argument-less `decode()`. Both siblings do
  — `BaseApi.streamRequest` at baseApi.ts:249 (`bodyText + decoder.decode()`) and
  `BaileyApi.streamChat` at baileyApi.ts:60-63. Because `BaseApi` uses a *separate* decoder for
  `text`, the two genuinely diverge: `rawText` ends in `U+FFFD` while the concatenated `onChunk`
  text does not. The test reproduces exactly this (`expected 'ok' to be 'ok�'`) and asserts the
  correct invariant (streamed text equals the returned body). LOW is the right severity: needs a
  body that ends mid-multi-byte-character, and the consequence is a display discrepancy in the API
  Console, not data loss.

---

## Failing Tests — Specific Problems

**src/api/adminApi.test.ts:222** — "turns a bare parameter with no '=' into the literal string
'undefined' (characterization)". Asserts `url.searchParams.get('status') === 'undefined'`. The same
deliverable's BUG-001 write-up names this exact behavior as a secondary effect of the bug and
prescribes "skip entries with no `=`" as part of the fix. Shipping a green test that pins the
broken output means the prescribed fix turns this into a red test, and whoever does the fix has to
decide whether the test or the finding is authoritative. A real test here would either (a) assert
the corrected behavior — a bare `status` entry is skipped, `url.searchParams.has('status') === false`
— and be filed as a second failing bug test, or (b) be deleted and left to the finding's own
write-up.

**src/api/adminApi.test.ts:447** — "resolves dot segments in a trigger id against the admin path
(characterization)". The body is one `new URL('/admin/triggerExport/../deletePatientDataGraph', FHIR_URL)`
and one assertion on `.pathname`. No `AdminApi` method is invoked; the only thing under test is the
WHATWG URL parser. The stated concern (an `exportStatusId` containing `..` collapsing the admin
path) is worth a test — but it has to go through the real code: call
`newApi().triggerExport('../deletePatientDataGraph')` with a stubbed `fetch` and assert on
`new URL(mockFetch.mock.calls[0][0]).pathname`. That version would actually fail if
`triggerExport`'s interpolation were changed to encode the id, which is the whole point.

**src/context/LastRequestContext.test.ts:55, :85, :113** — all three install their own value via
`LastRequestContext.Provider` and then assert that React delivered it. The module's only executable
content is a `createContext` call whose default is `{ lastRequest: null, recordRequest: () => {} }`;
replacing the entire module body with `createContext<any>(undefined)` leaves all three green. Test
:85 is additionally pure mock-wiring: the test supplies a `vi.fn()` as `recordRequest`, clicks a
button that calls it with a literal the test hard-coded, and asserts the mock saw that literal.
There is little genuinely testable surface here — tests :35 and :43 already cover the default value,
which is the module's whole contribution — so the honest move is to keep those two and delete
:55/:85/:113 rather than to rewrite them. If provider/consumer wiring is worth asserting, it belongs
in a test of `App.tsx`'s `recordRequest`/`lastRequest` implementation (the code that actually
derives `pathname` and updates state), not of the context declaration.

**src/hooks/useResourceCount.test.ts:184** — "keeps a stale count behind the error flag when a
refetch fails (characterization)". Asserts `count === 5` after the refetch rejects. BUG-004's own
"Suggested fix" section says to reset `count`/`atLimit`/`error` "on the `.catch` path" too, so this
test is a tripwire against the fix the same document recommends. Its stated justification ("both
consumers render the count only when `!error && !isLoading`, so the stale value is never shown") is
an argument that the behavior is currently *harmless*, not that it is *correct* — and it depends on
a property of two call sites that no test enforces. Either assert the correct behavior
(`count` null after a failed refetch) and file it as part of BUG-004, or drop the test and rely on
the Suspicious Patterns note.

### Weaknesses noted but not failed
- `src/utils/resourceDefinitions.test.ts:117` — titled "supports HomePage's case-insensitive
  substring name filter", but `filterByName` is re-implemented inside the test file; `HomePage.tsx`
  is never imported, so a change to the real filter goes unnoticed. It does assert real properties
  of the real exported table (falsifiable), so it passes the four criteria — but it is mistitled and
  brittle (adding any legitimate resource whose name contains "patient" breaks it).
- `src/utils/resourceDefinitions.test.ts` overall — nine data-integrity checks on an auto-generated
  static table. Legitimate (they would catch a hand-edit) but they test a generator's output, not
  app behavior.
- `src/utils/uploadDocument.utils.test.ts:20, :25, :30, :41, :47` — assert only
  `'error' in result === true`, never the message. Falsifiable, so passing, but they would not
  notice the wrong error being returned (e.g. the size message for an unsupported extension).
- Group B coverage gap: `extractMergeFailureMessage` (`src/utils/uploadDocument.utils.ts:72-84`) is
  exported, carries four distinct branches and a documented `$merge`-always-answers-2xx rationale,
  and has **no test at all**. It is the highest-value untested export I found in Group B.

---

## Recommendations
- **Files to DELETE entirely (>50% FAIL):** none. `src/context/LastRequestContext.test.ts` is the
  closest at 3/5 (60%) — but the two surviving tests (:35, :43) are the only meaningful ones
  available for a module that is a type declaration plus a `createContext` default, so delete the
  three failing tests rather than the file.
- **Files to REWRITE (20-50% FAIL):** none. No file is in that band.
- **Individual tests to fix (<20% FAIL in file):**
  - `src/api/adminApi.test.ts:222` — invert to assert the corrected behavior, or delete.
  - `src/api/adminApi.test.ts:447` — route through `triggerExport()` + stubbed `fetch`, or delete.
  - `src/context/LastRequestContext.test.ts:55, :85, :113` — delete (see above).
  - `src/hooks/useResourceCount.test.ts:184` — invert to assert `count` is cleared, or delete.
- **Findings to RETRACT (false positives):** none. All 7 findings describe behavior the source
  genuinely exhibits, and all 7 tests fail for the right reason. In particular **BUG-002 must not be
  retracted** — the suspected test defect does not exist; the test sets LOGOUT_URL and the throw
  originates from the `!wellKnownUrl` guard at line 46.
- **Findings to DOWNGRADE (overstated):** BUG-005 and BUG-006. Both are already at the LOW floor, so
  the correction is not numeric — it is reclassification: drop the "RFC 7636 single-use violation"
  framing (the verifier is never reused; `getLoginUrlAsync` mints a new one every time, as those
  files' own tests at :105 / :128 prove) and move both out of the bug list into
  `domain-invariants.md`'s Suspicious Patterns section as code-hygiene observations. Their two
  currently-failing tests should be removed or re-scoped accordingly, which would take the suite to
  5 failing bug tests.
  Two findings also deserve a *reachability* caveat added to their write-ups without a severity
  change: BUG-003 (the app's own write path can never produce an unparseable `darkMode` value, so an
  external writer is required) and BUG-004 (the green-checkmark impact requires index-key instance
  reuse *and* a slash-less reference; the hook-state defect itself is not conditional).
- **Findings with INVERTED tests:** none. Each of the 7 asserts the correct behavior and fails on
  current code; I confirmed every failure message is the assertion firing, not a setup error. (The
  four inverted-polarity tests I did find — adminApi:222, adminApi:447 is a separate issue,
  useResourceCount:184 — are *passing* characterization tests that pin defective behavior, which is
  the mirror image of the problem this section asks about.)

---

## Self-Check
- Did I read every test file? **YES** — all 35 (22 Group A + 13 Group B), in full, with the Read tool.
- Did I read every source file? **YES** — all 34 modules under test in full, plus 7 corroborating
  files read specifically to check reachability claims (`App.tsx`, `index.tsx`, `pages/Auth.tsx`,
  `partials/Reference.tsx`, `partials/ReferenceLink.tsx`, `runtimeEnv.ts`, `test/setup.ts`) and two
  grepped (`components/SearchContainer.tsx`, `admin/manageExport.tsx`).
- Does my PASS+FAIL count equal total test functions? **YES** — 460 PASS + 6 FAIL = 466 declarations.
  Verified against a mechanical count of `^\s*it(\.each)?[(<]` per file: 349 (Group A) + 117
  (Group B) = 466, matching the brief's figures exactly. The 553 runtime cases reported by Vitest
  differ only by the `it.each` expansion, itemized in the Summary.
- Did I write a line for every single test function? **YES** — one line per declaration, in source
  order, every line starting at column 0 with PASS or FAIL.
- Did I verify every finding in bugs-found.md? **YES** — all 7, each by reading the full cited code
  path (not just the cited lines), reading the proving test, re-running `yarn test` myself to
  confirm the failure and its exact cause, and independently checking each write-up's reachability
  claim against the real call sites.
