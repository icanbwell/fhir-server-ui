# Adopt the library-owned Bailey client in fhir-server-ui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fhir-server-ui's own Bailey HTTP transport with the `@icanbwell/baileyai-chat-ui` Bailey client, with the smallest host change that preserves today's auth behavior, and (only after a gate) give each chat one stable conversation ID.

**Architecture:** `BaileyApi` stops streaming and only builds auth headers from the session token. `useBaileyChatTransport` builds a library client from `baileyUrl`, `getHeaders` and a no-op `onAuthError`, and returns it as the `BaileyChatTransport` that `useBaileyChat` already accepts, so `BaileyChatContainer` and `BaileyChatPanel` keep working. A second, separately shippable step passes the user's `sub` so the library mints `<sub>:chat-<8 hex>`; it is gated on a backend answer (open question 1).

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4 + Testing Library (jsdom), Yarn 4 (`yarn.lock`), `@icanbwell/baileyai-chat-ui`.

**Spec:** `~/git/baileyai-chat-ui` branch `origin/IQ-BAI-1237`: `docs/superpowers/specs/2026-10-21-chat-ui-bailey-client-design.md` (draft, PR #54).
**Backend contract:** `~/git/baileyai` branch `origin/IQ-BAI-1237`: `docs/tech-designs/conversation-api-for-chat-ui-client.md` (draft, PR #543).
**Jira:** BAI-1237. Branch `IQ-BAI-1237`. Every commit message and the PR title start with `BAI-1237` (enforced by `.github/workflows/check-commit-message.yml`, pattern `^(Bump|Merge|Revert|Reapply|build\(deps(-dev)?\): bump|([A-Z]+-[0-9]+))\s+.+`). No AI-attribution trailer.

## Repo conventions that apply

- `AGENTS.md` / `CLAUDE.md` (symlink) in this repo currently describe a different project (Karate HP validation tests); only its "Commit Messages & PR Titles" section applies here. Flag to the repo owner (EA owns the file per CODEOWNERS); not changed by this plan.
- `copilot-instructions.md` (org baseline): no PHI in logs or fixtures, no new dependency without `approved-tech.yaml`, parameterized tests for more than two input variations, mock only at external boundaries. No new dependency is added here (version bump of an existing one).
- Yarn only. Commands: `yarn lint`, `yarn tsc --noEmit` (the Makefile `lint` target runs both), `yarn test` (`vitest run`), `yarn build`. CI (`.github/workflows/node.js.yml`) runs `yarn lint` and `yarn test`.
- Plans live in `docs/superpowers/plans/YYYY-MM-DD-<name>.md`.
- PR labels (risk/type/semver) are required by org policy; this repo has no label workflow in `.github/workflows`. Invoke `pr-label-classifier` when opening the PR rather than labeling by hand.

## Global Constraints

- Conversation ids are `<sub>:chat-<8 hex>`.
- The server ignores a client-supplied id that is not prefixed with the caller's `sub` (it logs a warning and mints another).
- No PHI or message text in logs, console output, the trace panel, test fixtures or this plan; the same holds for conversation titles and the `sub`.
- Additive: an unchanged host must keep working; no change to backend routes or the `/bailey/v1/responses` request shape.
- A 401 (or 403) from Bailey must not log the user out of fhir-server-ui, clear `jwt`/`id_token`, or call `setUserDetails`. Reason: the session token comes from a different issuer than Bailey's `AUTH_PROVIDERS` trusts, so a Bailey 401 is a config mismatch, not an invalid session. It must be preserved through the library's `onAuthError` and `getHeaders`.
- Library version required: a `@icanbwell/baileyai-chat-ui` release that exports `createBaileyClient` with `getHeaders` and `onAuthError` (ASSUMED API, section "Interfaces"). The release number is not known; the plan uses `<RELEASE>` and Task 1 fixes it. The current pin is `^1.0.9` (installed 1.0.9, which has no client).
- The session token is read on every request, never captured at construction, and `Authorization` is omitted (not `Bearer null`) when no token exists.
- The token must only be sent to `baileyUrl` (`REACT_APP_BAILEY_URL`).

## Decision: should this internal admin tool adopt, and how little?

Verified facts (re-read in this worktree on 2026-10-21):

- `src/api/baileyApi.ts` posts to `/bailey/v1/responses` through `BaseApi.streamRequest`, sends no `x-chat-id`, never reads `X-Conversation-Id` (its `onHeaders` reads only `x-request-id`). The backend therefore stores each turn as its own one-message conversation.
- `useBaileyChat` re-sends the whole transcript in `input` each turn.
- `BaileyApi.handleUnauthorized` is a no-op on purpose (different token issuer). `BaseApi.streamRequest` calls it after every response; the default implementation logs out on a 401.
- `BAILEY_SYSTEM_INSTRUCTIONS` (`src/constants/baileyConstants.ts`) requires a fresh tool call each turn and forbids answering from a prior turn.
- The 2026-08-11 plan for this screen fixed "no thread/session persistence"; nothing since has changed that.
- Bailey is called directly from the browser at `REACT_APP_BAILEY_URL` (not via the api-gateway). Bailey's CORS uses `allow_headers=["*"]` (`baileyai/api.py:288,358` on `origin/main`), so a new `x-chat-id` request header passes preflight. `expose_headers` is not set on `main`, so a browser cannot read `X-Conversation-Id` until baileyai #541 merges.

Options:

| Tier | What changes | Behavior change | Value to this host |
|---|---|---|---|
| 0 | Nothing | None | None; keeps ~40 lines of own transport |
| 1a | Library client replaces `BaileyApi.streamChat`; auth via `getHeaders`/`onAuthError` | None intended | Removes duplicated stream/parse/timeout code; picks up library fixes |
| 1b | 1a plus pass `sub`; library mints one id per chat | One conversation per chat in the backend instead of one per message | Cleaner stored data; prerequisite for any later history/feedback |
| 2 | Default history UI, persistence across reload, feedback buttons | Visible UI, stored conversations resumed | Low: internal admin tool, no stated need |

**Recommendation: Tier 1a now, Tier 1b gated, Tier 2 out of scope.** Reasons:

1. Tier 2 has no requester. The screen is an internal admin helper whose prompt demands fresh tool calls each turn; resuming old conversations works against that and persisted admin queries about patient data are PHI-adjacent data at rest that nobody asked for. (Every turn is already stored today, so 1b adds no new class of storage; it only groups it.)
2. Tier 1a is behavior-neutral by intent; its risks (the 401 rule, request shape, token origin, stream handling) are each pinned by a named test in Tasks 1-3, run against a stubbed `fetch` so a library that differs from the ASSUMED items fails. Value is code deletion, not features.
3. Tier 1b changes what the backend stores and may double the model's context (the library holds an id while still sending the full transcript; baileyai tech design open question 3 is unverified). Do not ship it until that is answered.
4. Order within the four hosts: adopt last (spec rollout step 5: "only if it is worth it for an internal admin tool"). If the library release slips or open question 1 answers "duplicates context and the library cannot stop re-sending", stay at Tier 0.

PR boundaries: **PR A** = Tasks 1-3 (Tier 1a). **PR B** = Task 4 (Tier 1b), opened only after the gate in "Open questions to resolve before executing" is answered. Task 5 is verification and rollout for each PR.

## Review Focus

Failure modes the spec implies but its own tests do not pin, most likely first. Each has a test in the task named.

1. **Bailey returns 401/403 and the host logs the user out or wipes the token.** Expected: chat shows an error, session and `localStorage` untouched. Test: Task 3, `does not log out or clear the session when Bailey answers 401 or 403`.
2. **Token missing, expired-and-cleared, or not a JWT.** Expected: no `Authorization` header (not `Bearer null`), no exception from subject extraction, chat behaves as today. Tests: Task 2, `omits Authorization when no session token exists` and `getSubject returns undefined for a non-JWT token`.
3. **Token rotates mid-session.** Expected: the next request carries the new token. Test: Task 3, `getHeaders reads the current token on every call`.
4. **`sub` of the fhir-server-ui token differs from the `sub` Bailey derives (different issuer, different claim).** Expected: server silently replaces the id; chat still works and is no worse than today. Test: Task 4, `chat still sends when the subject is undefined` plus manual check in Task 5.
5. **Conversation id persisted across reload or leaked to storage.** Expected: no `sessionStorage`/`localStorage` write containing the `sub`; reload starts a new chat (today's behavior). Test: Task 4, `does not persist the conversation id`.

## File structure

| File | Responsibility | Change |
|---|---|---|
| `package.json`, `yarn.lock` | library version | modify (Task 1) |
| `src/api/baileyClientContract.test.ts` | pins the ASSUMED library API so a wrong release fails fast | create (Task 1) |
| `src/api/baileyApi.ts` | header building from the session token; no streaming | modify (Task 2) |
| `src/api/baileyApi.test.ts` | header and subject tests; streaming tests removed | modify (Task 2) |
| `src/hooks/useBaileyChatTransport.ts` | builds the library client; `onAuthError` no-op | modify (Task 3) |
| `src/hooks/useBaileyChatTransport.test.tsx` | referential stability, 401 rule, token freshness | modify (Task 3) |
| `src/components/BaileyChatContainer.tsx` and `.test.tsx` | pass subject, opt out of persistence | modify (Task 4, PR B) |
| `src/api/baseApi.ts` | unchanged (`buildHeaders` stays `protected`) | none |
| `src/context/EnvironmentContext.ts`, `UserContext.ts`, `src/constants/baileyConstants.ts`, `src/pages/BaileyAIPage.tsx` | unchanged | none |

## Interfaces

### Consumed from `@icanbwell/baileyai-chat-ui` (ASSUMED, from spec section 6; confirm against the real release in Task 1)

```ts
// ASSUMED
export interface BaileyClientConfig {
    baseUrl: string;
    getHeaders: () => Promise<Record<string, string>>;
    fetch?: typeof fetch;
    onAuthError?: (error: { status: number }) => void;   // fires on 401/403
}
export interface BaileyClient extends BaileyChatTransport {} // streamChat has the existing transport contract
export function createBaileyClient(config: BaileyClientConfig): BaileyClient;

// ASSUMED: option names are not in the spec; spec 6.2 only says "an option, or decoded from the token"
// (open question 5) and "storage option, default sessionStorage".
export interface UseBaileyChatConversationOptions {
    subject?: string;                 // the user's sub; undefined => library sends no x-chat-id
    storage?: null | ConversationStorage; // null => do not persist (ASSUMED to be accepted)
}
// useBaileyChat(config & { conversation?: UseBaileyChatConversationOptions }) => result gains `conversationId: string | undefined`
```

Existing, verified in installed 1.0.9 `dist/index.d.ts`: `BaileyChatTransport.streamChat(params: { model; instructions; input; tools; toolChoice?; signal; onChunk; onRequestId? }): Promise<{ status?: number; text: string; errorMessage?: string }>`; `UseBaileyChatConfig { transport; model; instructions; tools?; ... }`.

ASSUMED behaviors to confirm: (a) `getHeaders` output is merged under the library's own `Content-Type` and `Accept`; (b) the client keeps `onRequestId` for `x-request-id` (the trace panel uses it); (c) a non-2xx body and a network `errorMessage` still reach `useBaileyChat` as today; (d) an aborted turn rejects with `AbortError`; (e) a mid-stream drop returns partial text; (f) the client refuses to send to any origin other than `baseUrl`.

### Produced by this plan

```ts
// src/api/baileyApi.ts
class BaileyApi extends BaseApi {
    /** Authorization (from the session token, per identityProvider) and Origin-Service only. */
    getAuthHeaders(): Record<string, string>;
    /** `sub` claim of the token that getAuthHeaders sends, or undefined if absent or not a JWT. Never throws. */
    getSubject(): string | undefined;
}

// src/hooks/useBaileyChatTransport.ts  (name and return type unchanged)
export function useBaileyChatTransport(): BaileyChatTransport;
```

---

### Task 1: Pin the library release and its API

**Files:**
- Modify: `package.json` (`@icanbwell/baileyai-chat-ui`), `yarn.lock`
- Create: `src/api/baileyClientContract.test.ts`

**Interfaces:**
- Consumes: the library release containing `createBaileyClient`.
- Produces: `createBaileyClient`, `BaileyClientConfig` importable from `@icanbwell/baileyai-chat-ui` for Tasks 3-4.

- [ ] **Step 1: Write the failing test** in `baileyClientContract.test.ts`: `exports createBaileyClient`, asserting `typeof createBaileyClient === 'function'`; `a client built from {baseUrl, getHeaders} exposes streamChat`, asserting `typeof client.streamChat === 'function'`; `calls onAuthError with the status on a 401 and a 403` (parameterized over `[401, 403]`, global `fetch` stubbed to return that status, asserts `onAuthError` called once with `expect.objectContaining({ status })`); `sends getHeaders output to baseUrl's origin` (fetch stub; asserts `new URL(fetchedUrl).origin === new URL(baseUrl).origin`, never a string prefix, since `https://bailey.example.com.evil.net` starts with `https://bailey.example.com`, and that the stubbed `Authorization` header is present); `refuses to send the token to a different origin` (ASSUMED (f), parameterized over a look-alike host `https://bailey.example.com.evil.net`, a scheme-relative `//evil.example.net/x`, and a different port; the client is driven so that its resolved request URL would leave `baseUrl`, e.g. a `baseUrl` with a userinfo or path-absolute trick, or a response redirect to another origin; asserts `fetch` is never called with an `Authorization` header for that origin, or the call rejects/returns an error status). If the library offers no way to produce such a URL, the origin guard is not confirmable here: drop (f) from the confirmed list and keep the Task 3 origin assertion and the Task 5 network-tab check as the only evidence. Today this guard lives in `BaseApi.streamRequest` (`src/api/baseApi.ts:165`) and Task 2 removes it from Bailey traffic. These tests confirm the ASSUMED items they name (and only those); fix the plan's interface block if the real signature differs.
- [ ] **Step 2: Run** `yarn test src/api/baileyClientContract.test.ts`. Expected: FAIL (`createBaileyClient` is not exported by 1.0.9).
- [ ] **Step 3: Bump** with `yarn up @icanbwell/baileyai-chat-ui@<RELEASE>`; confirm only that package and its own transitive deps change in `yarn.lock`. Check `approved-tech.yaml` is unaffected (no new package).
- [ ] **Step 4: Run** `yarn test src/api/baileyClientContract.test.ts`. Expected: PASS. Then `yarn tsc --noEmit` and `yarn test` (whole suite; existing Bailey tests must still pass because nothing else changed).
- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock src/api/baileyClientContract.test.ts
git commit -m "BAI-1237 Bump baileyai-chat-ui to the release with the Bailey client"
```

### Task 2: Reduce `BaileyApi` to auth headers and subject

**Files:**
- Modify: `src/api/baileyApi.ts` (remove `StreamChatParams`, `streamChat`, the `handleUnauthorized` override and its comment; add `getAuthHeaders`, `getSubject`)
- Modify: `src/api/baileyApi.test.ts`

**Interfaces:**
- Consumes: `BaseApi.buildHeaders(extra?)` (`src/api/baseApi.ts:74`, `protected`, selects the token via `identityProvider` and `AuthUrlProvider.tokenToSendToFhirServer`, drops a caller-supplied `Authorization`, omits it when no token).
- Produces: `getAuthHeaders()`, `getSubject()` as above, used by Tasks 3 and 4.

- [ ] **Step 1: Write the failing tests** (replace the streaming tests). `baileyApi.test.ts` today only calls `localStorage.clear()` and sets `jwt`; it never sets `identityProvider` and never mocks `AuthUrlProvider`. `BaseApi.buildHeaders` (`src/api/baseApi.ts:75-81`) calls `getAuthInfo` whenever `identityProvider` is set, and the real `getAuthInfo` throws unless five `REACT_APP_AUTH_<P>_*` variables exist (`src/utils/authUrlProvider.ts:83-94`). So mock it the way `src/api/baseApi.test.ts:3-9` does: `vi.hoisted` `mockGetAuthInfo` and `vi.mock('../utils/authUrlProvider', ...)` returning `{ getAuthInfo: mockGetAuthInfo }`; the working pattern for varying the token key is `baseApi.test.ts:324-355`.
  - `getAuthHeaders attaches the session bearer token` -> `Authorization === 'Bearer <token>'`.
  - `getAuthHeaders sends Origin-Service fhir-ui` -> `'Origin-Service' === 'fhir-ui'`.
  - `getAuthHeaders returns only Authorization and Origin-Service` -> keys equal exactly those two (no `Accept`, `Cache-Control`, `Content-Type`, so the library's own `Accept`/`Content-Type` are not fought).
  - `omits Authorization when no session token exists` -> no `Authorization` key, not `Bearer null`. (Review Focus 2.)
  - `uses the token chosen by the identity provider` -> set `localStorage.identityProvider`, have `mockGetAuthInfo` return `{ tokenToSendToFhirServer }`, parameterized over `'id_token'`, `'jwt'` and `undefined` (which must fall back to `'jwt'`, as `buildHeaders` does at `baseApi.ts:79`); assert `Authorization` carries the value stored under the matching key. There is no provider list to iterate: `tokenToSendToFhirServer` comes per provider from `REACT_APP_AUTH_<P>_TOKEN_TO_SEND_TO_FHIR_SERVER` and defaults to `'jwt'` (`authUrlProvider.ts:100-104`).
  - `getSubject returns the sub claim of the token it sends` -> token built in the test from `btoa` of `{"sub":"user-1"}` segments, expects `'user-1'`.
  - `getSubject returns undefined for a non-JWT token, an empty token and no token` (parameterized over three inputs). (Review Focus 2.)
  - Streaming tests in this file are removed only after each guarantee has a replacement in Task 3 (below); the commit message lists the mapping. Port table (old test at `src/api/baileyApi.test.ts`, line numbers on `origin/main`): `:54` POST to `/bailey/v1/responses` with body `{model, instructions, input, stream: true, tools}` -> Task 3 `sends the chat request to /bailey/v1/responses`; `:75` JSON + SSE negotiation -> Task 3 `sends one Content-Type and Accept: application/json, text/event-stream`; `:90` bearer token -> Task 2 test above; `:101` one onChunk per chunk -> Task 3 `streams decoded text to onChunk`; `:115` invariant 11 multi-byte split -> Task 3 `reassembles a multi-byte character split across chunks`; `:134` trailing flush -> Task 3 `flushes a trailing partial character`; `:150`/`:162` request id -> Task 3 `reports x-request-id`/`does not call onRequestId without it`; `:172` invariant 6 -> Task 3 401 test; `:186` non-2xx body -> Task 3; `:198` fetch failure -> Task 3 `returns errorMessage with no status when fetch fails`; `:210` invariant 14 -> Task 3 AbortError test.
- [ ] **Step 2: Run** `yarn test src/api/baileyApi.test.ts`. Expected: FAIL (`getAuthHeaders is not a function`).
- [ ] **Step 3: Implement** `getAuthHeaders(): Record<string, string>` by calling `this.buildHeaders()` and keeping only `Authorization` and `Origin-Service` (case-insensitive key match); implement `getSubject(): string | undefined` by decoding the bearer value from `getAuthHeaders()` with `jwtDecode` (already a dependency, used in `src/utils/jwtParser.ts`), returning `undefined` on `InvalidTokenError`, a missing token, or a non-string `sub`. Do not duplicate `BaseApi`'s token selection.
- [ ] **Step 4: Run** `yarn test src/api/baileyApi.test.ts`. Expected: PASS. Then `yarn lint && yarn tsc --noEmit`. `tsc` fails in `useBaileyChatTransport.ts` (calls the removed `streamChat`); that is fixed in Task 3, so commit Tasks 2 and 3 together or keep `streamChat` until Task 3 lands. Choose: commit both in one commit.
- [ ] **Step 5: Commit** (with Task 3).

### Task 3: Build the library client in `useBaileyChatTransport`

**Files:**
- Modify: `src/hooks/useBaileyChatTransport.ts`
- Modify: `src/hooks/useBaileyChatTransport.test.tsx`

**Interfaces:**
- Consumes: `createBaileyClient` (Task 1), `BaileyApi.getAuthHeaders` (Task 2), `EnvContext.baileyUrl`.
- Produces: `useBaileyChatTransport(): BaileyChatTransport`, referentially stable across renders while `baileyUrl` is unchanged. It no longer reads `UserContext` or takes `setUserDetails`: the library never calls `BaseApi`, so no code path reaches `logout`.

- [ ] **Step 1: Write the failing tests** (the file mocks `../api/baileyApi` today; keep mocking only at external boundaries: stub global `fetch` and `localStorage` instead, so the real `BaileyApi` runs, so the real `BaileyApi` runs; mock `../utils/authUrlProvider` as in `src/api/baseApi.test.ts:3-9` whenever a test sets `localStorage.identityProvider`, including the 401 test below, whose spies are the `logout` and `removeAuthData` mocks from `../utils/auth.utils` as well as `setUserDetails`):
  - `is referentially stable across re-renders when baileyUrl is unchanged` (existing, keep).
  - `creates a new transport when baileyUrl changes`.
  - `getHeaders reads the current token on every call` (Review Focus 3): send, change the stored token, send again, assert the second request's `Authorization` is the new token.
  - `does not log out or clear the session when Bailey answers 401 or 403` (Review Focus 1; invariant 6; parameterized over `[401, 403]`): `UserContext.setUserDetails` is a spy; fetch returns the status; after `streamChat` resolves, `setUserDetails` not called, `localStorage.getItem('jwt')` and `identityProvider` unchanged, `window.location.replace` not called, and the returned `status` equals the response status so the chat can show an error.
  - `surfaces the response body and the status of a non-2xx answer` (assertion on the `streamChat` result `{ status, text }`; confirms ASSUMED (c)).
  - `reports x-request-id through onRequestId` (confirms ASSUMED (b)).
  - `rethrows AbortError when the signal aborts` (confirms ASSUMED (d)).
  - `sends the chat request to /bailey/v1/responses` (ASSUMED (a), Global Constraint 'no change to the request shape'): fetch stub; asserts method `POST`, `new URL(url).origin === 'https://bailey.example.com'` and `pathname === '/bailey/v1/responses'`, and `JSON.parse(body)` deep-equals `{ model, instructions, input, stream: true, tools }`.
  - `sends one Content-Type and Accept: application/json, text/event-stream` (ASSUMED (a)): asserts exactly one `content-type` entry (case-insensitive, `application/json`), `accept` equal to `application/json, text/event-stream`, and the bearer token still present.
  - `streams decoded text to onChunk` (one call per network chunk).
  - `reassembles a multi-byte character split across chunks` (invariant 11; a body whose chunk boundary splits one 3-byte character; concatenated `onChunk` text equals the original).
  - `flushes a trailing partial character` (stream ending mid-character; no bytes silently dropped, per the existing `baileyApi.test.ts:134` behavior).
  - `returns the partial text when the stream drops mid-body` (ASSUMED (e); a `ReadableStream` that errors after one chunk; `streamChat` resolves with that text, does not reject).
  - `returns errorMessage and no status when fetch itself fails` (ASSUMED (c), network half; `fetch` rejects with `TypeError('Failed to fetch')`; result `status === undefined`, `errorMessage` contains the failure text).
  - `sends only to baileyUrl's origin`: for every fetch call in this file, `new URL(url).origin === new URL('https://bailey.example.com').origin` (origin comparison, never `startsWith`). The refusal case is covered in Task 1.
- [ ] **Step 2: Run** `yarn test src/hooks/useBaileyChatTransport.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** `useBaileyChatTransport` with `useMemo` keyed on `[baileyUrl]`: one `BaileyApi` (constructed with `fhirUrl: baileyUrl`, `setUserDetails: undefined`), `createBaileyClient({ baseUrl: baileyUrl, getHeaders: async () => api.getAuthHeaders(), onAuthError: () => undefined })`. Move the "why a Bailey 401 must not log out" comment from the deleted `handleUnauthorized` onto `onAuthError`. If an asserted item in Step 1 fails because the library differs from ASSUMED, stop and raise it with the library owner rather than patching around it in the host.
- [ ] **Step 4: Run** `yarn test src/hooks/useBaileyChatTransport.test.tsx src/api/baileyApi.test.ts src/components/BaileyChatContainer.test.tsx`, then `yarn lint && yarn tsc --noEmit && yarn test && yarn build`. Expected: all PASS. `BaileyChatContainer.test.tsx` must pass unchanged (it mocks the hook).
- [ ] **Step 5: Commit** (Tasks 2 and 3 together)

```bash
git add src/api/baileyApi.ts src/api/baileyApi.test.ts src/hooks/useBaileyChatTransport.ts src/hooks/useBaileyChatTransport.test.tsx
git commit -m "BAI-1237 Use the library Bailey client for chat transport, keep Bailey 401 from logging out"
```

### Task 4 (PR B, gated): One stable conversation id per chat, not persisted

Do not start until open question 1 is answered and the library exposes the ASSUMED conversation options (confirm names in Task 1).

**Files:**
- Modify: `src/components/BaileyChatContainer.tsx`
- Modify: `src/components/BaileyChatContainer.test.tsx`
- Modify: `src/hooks/useBaileyChatTransport.ts` only if the subject has to come from the same `BaileyApi` instance (see Interfaces below)

**Interfaces:**
- Consumes: `UseBaileyChatConversationOptions` (ASSUMED), `BaileyApi.getSubject()` (Task 2).
- Produces: `BaileyChatContainer` passes `conversation: { subject, storage: null }` to `useBaileyChat`. To avoid a second `BaileyApi`, the hook may return the client plus the subject; prefer a small `useBaileySubject(): string | undefined` in `src/hooks/useBaileySubject.ts` (memoized on `baileyUrl`, calls `new BaileyApi(...).getSubject()` once per render of the container) over changing the transport hook's return type.

- [ ] **Step 1: Write the failing tests** (the container test already mocks `useBaileyChat` and records its config):
  - `passes the session subject to useBaileyChat` -> config `conversation.subject === 'user-1'` for a stored JWT with that `sub`.
  - `chat still sends when the subject is undefined` (Review Focus 4) -> no JWT; config `conversation.subject === undefined`; the panel still renders; no throw.
  - `does not persist the conversation id` (Review Focus 5) -> config `conversation.storage === null` (opt-out), and in an un-mocked variant using the real library hook, after a send neither `sessionStorage` nor `localStorage` contains the subject string.
  - `New chat resets the id` -> through the real hook with a stubbed fetch: two sends share one `x-chat-id`; after `newChat()` the next send carries a different one; every sent id matches `^user-1:chat-[0-9a-f]{8}$`.
  - `second turn sends x-chat-id with the same value as the first` (header assertion on the stubbed `fetch`).
- [ ] **Step 2: Run** `yarn test src/components/BaileyChatContainer.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the wiring in `BaileyChatContainer`; `useBaileySubject` as above. Do not decode the token inside the component.
- [ ] **Step 4: Run** `yarn lint && yarn tsc --noEmit && yarn test && yarn build`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/components/BaileyChatContainer.tsx src/components/BaileyChatContainer.test.tsx src/hooks/useBaileySubject.ts
git commit -m "BAI-1237 Send one conversation id per Bailey chat from fhir-server-ui"
```

### Task 5: Verify in dev, roll out, keep rollback ready

**Files:** none (verification and release steps). Add nothing to the repo unless a finding requires it.

- [ ] **Step 1: Local** (`yarn dev` with `.env` pointing `REACT_APP_BAILEY_URL` at dev Bailey): three-turn chat with a table answer and a chart answer; confirm streaming is incremental, tables/charts render, the trace panel shows a request id, Stop works mid-stream.
- [ ] **Step 2: 401 rule**, in an environment whose Bailey does not trust the app's token issuer: send a message; expect an error in the chat and the user still logged in after a page reload. (PR A and PR B.)
- [ ] **Step 3 (PR B only): one conversation per chat**: after a three-turn chat, the caller's conversation list in the backend shows one conversation with 3 turns, not three conversations. If it shows three, the token `sub` differs from Bailey's (Review Focus 4): stop and record it as the finding; PR B is then not worth merging.
- [ ] **Step 4: Release.** Merge after CI is green (`lint`, `test`, `Check Commit Message`). Tag `fhir-server-ui`; deploy via `bwell-fhir-server-ui` workflows dev, staging, prod in order (see "Sibling repo" below). Run PR A and PR B as separate tags.
- [ ] **Step 5: Rollback.** Revert the PR and cut a new tag, or pin `@icanbwell/baileyai-chat-ui` back to `^1.0.9` with the revert. Fast disable without a rebuild: `REACT_APP_ENABLE_BAILEY=false` (the opt-out kill switch in `EnvironmentContext.ts`; runtime-configurable per `docs/runtime-environment-config.md`) hides Bailey entirely. PR B alone is reverted by removing the `conversation` option; the library falls back to sending no `x-chat-id`.

## Sibling repo: `~/git/bwell-fhir-server-ui`

Verified: it is the private deployment wrapper for this repo (README: "manages JFrog-resolved dependencies and deployment workflows"). It has no `src/`; its `Dockerfile` builds `../fhir-server-ui` at a tag, and takes `package.json`, `yarn.lock` and `.yarnrc.yml` from itself (JFrog-resolved). Its `package.json` and `package.original.json` both list `@icanbwell/baileyai-chat-ui: ^1.0.9` only because they are copies of this repo's `package.json` (the only differences are rootio resolutions); there is no code usage, which is why none was found. The README's drift workflow opens a PR that copies this repo's `package.json`/`yarn.lock` after a new tag and blocks deployment until merged.

**No manual change is needed there for this adoption.** Expected follow-ups, not part of this plan's PRs:

1. After Task 1 merges and a tag is cut, the drift PR in `bwell-fhir-server-ui` carries the bumped dependency. Re-run `make rootIOPatch` afterwards, as its README says, since the drift PR reverts rootio changes.
2. The `<RELEASE>` of the library must resolve in JFrog (`artifacts.bwell.com`, `virtual-npm`) or its `yarn install --immutable` fails. Check before tagging.
3. CSP: `docker-entrypoint.d/security.conf` `connect-src` already allows `https://*.bwell.zone` and `https://*.icanbwell.com`, which covers `baileyai.<env>.bwell.zone`; no change for the same-origin-as-today Bailey URL. The CSP is Report-Only.

Do not write a plan file in that repo.

## Rollout summary

| Step | What | Gate |
|---|---|---|
| 1 | Library release with the client | library PR #54 implemented and published; JFrog has it |
| 2 | PR A (Tasks 1-3, 5) to dev, staging, prod | Task 5 steps 1-2 pass |
| 3 | PR B (Task 4, 5) | open question 1 answered; Task 5 step 3 passes |

## Dependencies on other work

| Item | Owner | Needed by | If not available |
|---|---|---|---|
| Library release exporting `createBaileyClient` with `getHeaders`, `onAuthError` | baileyai-chat-ui (PR #54) | Task 1 | Stay at Tier 0 |
| Library `conversation` options (`subject`, `storage: null`) | baileyai-chat-ui | Task 4 | Skip PR B |
| Backend answer to: with an id plus a full `input`, does `LoadHistoryStep` duplicate context? | baileyai (PR #543, open question 3) | Task 4 | Skip PR B |
| Backend item 1 (report the id used) and item 2 (`expose_headers`, baileyai #541) | baileyai | Not needed for Tier 1a or 1b as designed here (the host never reads `X-Conversation-Id`); needed only if the library reads it | none |
| `<RELEASE>` resolvable in JFrog | platform / bwell-fhir-server-ui | deploy | deploy blocked |

## Open questions to resolve before executing

1. **Does fhir-server-ui want persisted conversations at all, or should it opt out?** This plan assumes opt out of persistence across reloads and Tier 1b only if the backend gate passes. If "no conversations at all" is preferred, stop after PR A: it already removes the duplicated transport, and the backend keeps storing one-message conversations as today.
2. Does Bailey's `sub` equal the `sub` of the token fhir-server-ui sends (the token's issuer is not in Bailey's `AUTH_PROVIDERS` in some environments)? Not verified; decided by Task 5 step 3.
3. Backend open question 3 (above).
4. Open question 5 of the spec: whether the library takes `subject` as an option (assumed here) or decodes the token itself. If it decodes the token, Task 4 shrinks to `storage: null` and `getSubject` (Task 2) is dropped.
5. Exact library release number and exact option names (replace `<RELEASE>` and the ASSUMED names in Task 1).

## Self-review

- **Spec coverage:** spec section 6.1 (client, `getHeaders`, `onAuthError`) -> Tasks 1 and 3; 6.2 (id, `sub`, storage) -> Task 4; 6.3 history UI and 6.4 feedback -> deliberately not adopted (decision, Tier 2); 6.5 "stays in hosts" (auth, base URL, flags) -> `BaileyApi.getAuthHeaders`, `baileyUrl`, `REACT_APP_ENABLE_BAILEY` untouched; section 10 success criterion for this host ("one multi-turn conversation per chat, confirmed in the backend's conversation list") -> Task 5 step 3; "hosts that opt into nothing see no change" -> Task 3 keeps `BaileyChatContainer` and its test unchanged.
- **Step scan:** every test names its assertions; implementations are signatures plus one-line approach. No placeholder logic remains except `<RELEASE>`, which Task 1 resolves.
- **Type consistency:** `getAuthHeaders`, `getSubject`, `useBaileyChatTransport`, `useBaileySubject`, `conversation.subject`/`storage` are used with the same names in every task.
- **Review Focus:** five items, each tied to a named test above.
- **Proportion:** three small source files change; the document is mostly decisions and tests.
- **Known unverified:** library behavior (all ASSUMED items), the `sub` match, backend context duplication, the library version mapping (`baileyai-chat-ui` `origin/main` is `0.3.1-pre.2` with tags up to `v0.4.1-pre.0`, while hosts pin `^1.0.9`; how the published 1.x relates is not verified).
