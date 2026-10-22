# Adopt the library-owned Bailey client in fhir-server-ui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fhir-server-ui's own Bailey HTTP transport with the `@icanbwell/baileyai-chat-ui` Bailey client, with the smallest host change that preserves today's auth behavior, and (only where server persistence is on) give each chat one stable, server-issued conversation ID.

**Architecture:** `BaileyApi` stops streaming and only builds auth headers from the session token. `useBaileyChatTransport` builds a library client from `baileyUrl`, `getHeaders` and a no-op `onAuthError`, and returns it as the `BaileyChatTransport` that `useBaileyChat` already accepts, so `BaileyChatContainer` and `BaileyChatPanel` keep working. Conversation ids are server-issued (decision D1): the library never mints one, it adopts the id the server reports (`X-Conversation-Id`) and, once it holds one, sends only the newest message (D2). Because that changes what the model receives, PR A pins `sendFullTranscript: true` and `storage: null`, so it stays behavior-neutral; a second, separately shippable step flips `sendFullTranscript` off through a runtime host flag, only in environments where backend persistence is on.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4 + Testing Library (jsdom), Yarn 4 (`yarn.lock`), `@icanbwell/baileyai-chat-ui`.

**Spec:** `~/git/baileyai-chat-ui` branch `origin/IQ-BAI-1237`: `docs/superpowers/specs/2026-10-21-chat-ui-bailey-client-design.md` (draft, PR #54).
**Backend contract:** `~/git/baileyai` branch `origin/IQ-BAI-1237`: `docs/tech-designs/conversation-api-for-chat-ui-client.md` (draft, PR #543); baileyai #545 ("always return the id actually used") and CORS `expose_headers` for `X-Conversation-Id` (baileyai #541) are prerequisites for the stable-id step.
**Decisions applied (2026-10-22, from the owner):** D1 server-issued ids, no client minting; D2 persistence-off is host config, no probe, `sendFullTranscript: true` is the manual override, and once an id is held the library sends only the newest message; D3 the library persists the held id in `sessionStorage` by default and `storage: null` disables it; D4 the library's opt-in history drawer is out of scope for this tool; the Tech Design Review and EA exception are on hold.
**Jira:** BAI-1237. Branch `IQ-BAI-1237`. Every commit message and the PR title start with `BAI-1237` (enforced by `.github/workflows/check-commit-message.yml`, pattern `^(Bump|Merge|Revert|Reapply|build\(deps(-dev)?\): bump|([A-Z]+-[0-9]+))\s+.+`). No AI-attribution trailer.

## Repo conventions that apply

- `AGENTS.md` / `CLAUDE.md` (symlink) in this repo currently describe a different project (Karate HP validation tests); only its "Commit Messages & PR Titles" section applies here. Flag to the repo owner (EA owns the file per CODEOWNERS); not changed by this plan.
- `copilot-instructions.md` (org baseline): no PHI in logs or fixtures, no new dependency without `approved-tech.yaml`, parameterized tests for more than two input variations, mock only at external boundaries. No new dependency is added here (version bump of an existing one).
- Yarn only. Commands: `yarn lint`, `yarn tsc --noEmit` (the Makefile `lint` target runs both), `yarn test` (`vitest run`), `yarn build`. CI (`.github/workflows/node.js.yml`) runs `yarn lint` and `yarn test`.
- Plans live in `docs/superpowers/plans/YYYY-MM-DD-<name>.md`.
- PR labels (risk/type/semver) are required by org policy; this repo has no label workflow in `.github/workflows`. Invoke `pr-label-classifier` when opening the PR rather than labeling by hand.

## Global Constraints

- Conversation ids are `<sub>:chat-<8 hex>`, issued by the server. This host never mints one and never sends one it did not receive from the server.
- The server ignores a client-supplied id that is not prefixed with the caller's `sub` (it logs a warning and mints another). An id embeds the `sub`, so treat it like the `sub`: not logged, not shown, not stored by this host.
- This host sets `storage: null`: the held id is never written to `sessionStorage` or `localStorage`. Reason: the 2026-08-11 screen design fixed "no thread/session persistence", an internal admin tool wanted no resume across reload, and the library otherwise persists the id in `sessionStorage` by default (D3).
- Once the library holds an id it sends only the newest message, which is correct only if the backend persists conversations. Until a runtime flag says persistence is on, this host sets `sendFullTranscript: true`.
- No PHI or message text in logs, console output, the trace panel, test fixtures or this plan; the same holds for conversation titles and the `sub`.
- Additive: an unchanged host must keep working; no change to backend routes or the `/bailey/v1/responses` request shape.
- A 401 (or 403) from Bailey must not log the user out of fhir-server-ui, clear `jwt`/`id_token`, or call `setUserDetails`. Reason: the session token comes from a different issuer than Bailey's `AUTH_PROVIDERS` trusts, so a Bailey 401 is a config mismatch, not an invalid session. It must be preserved through the library's `onAuthError` and `getHeaders`.
- Library version required: a `@icanbwell/baileyai-chat-ui` release that exports `createBaileyClient` with `getHeaders` and `onAuthError` (ASSUMED API, section "Interfaces"; the same release must have the server-issued-id handling, `storage` and `sendFullTranscript`). The release number is not known; the plan uses `<RELEASE>` and Task 1 fixes it. The current pin is `^1.0.9` (installed 1.0.9, which has no client).
- The session token is read on every request, never captured at construction, and `Authorization` is omitted (not `Bearer null`) when no token exists.
- The token must only be sent to `baileyUrl` (`REACT_APP_BAILEY_URL`).

## Decision: should this internal admin tool adopt, and how little?

Verified facts (re-read in this worktree on 2026-10-21):

- `src/api/baileyApi.ts` posts to `/bailey/v1/responses` through `BaseApi.streamRequest`, sends no `x-chat-id`, never reads `X-Conversation-Id` (its `onHeaders` reads only `x-request-id`). The backend therefore stores each turn as its own one-message conversation.
- `useBaileyChat` re-sends the whole transcript in `input` each turn.
- `BaileyApi.handleUnauthorized` is a no-op on purpose (different token issuer). `BaseApi.streamRequest` calls it after every response; the default implementation logs out on a 401.
- `BAILEY_SYSTEM_INSTRUCTIONS` (`src/constants/baileyConstants.ts`) requires a fresh tool call each turn and forbids answering from a prior turn.
- The 2026-08-11 plan for this screen fixed "no thread/session persistence"; nothing since has changed that.
- Bailey is called directly from the browser at `REACT_APP_BAILEY_URL` (not via the api-gateway). Bailey's CORS uses `allow_headers=["*"]` (`baileyai/api.py:288,358` on `origin/main`), so a request header such as `x-chat-id` passes preflight. `expose_headers` is not set on `main`, so a browser cannot read `X-Conversation-Id` until baileyai #541 merges, and streaming responses report the id only when the request carried `x-chat-id` until baileyai #545 lands. Under D1 this host sends none, so the stable-id step cannot work until both are deployed to the target environment.

Options:

| Tier | What changes | Behavior change | Value to this host |
|---|---|---|---|
| 0 | Nothing | None | None; keeps ~40 lines of own transport |
| 1a | Library client replaces `BaileyApi.streamChat`; auth via `getHeaders`/`onAuthError`; `storage: null`, `sendFullTranscript: true` | None intended | Removes duplicated stream/parse/timeout code; picks up library fixes |
| 1b | 1a plus a runtime flag that turns `sendFullTranscript` off; the library adopts the server-reported id and sends only the newest message | One conversation per chat in the backend instead of one per message; smaller requests | Cleaner stored data; prerequisite for any later history/feedback |
| 2 | Library history drawer (opt-in), persistence across reload, feedback buttons | Visible UI, stored conversations resumed | Low: internal admin tool, no stated need; the drawer is built in the library but this host does not opt in |

**Recommendation: Tier 1a now, Tier 1b gated, Tier 2 out of scope.** Reasons:

1. Tier 2 has no requester. The screen is an internal admin helper whose prompt demands fresh tool calls each turn; resuming old conversations works against that and persisted admin queries about patient data are PHI-adjacent data at rest that nobody asked for. (Every turn is already stored today, so 1b adds no new class of storage; it only groups it. The drawer is opt-in and this host passes no history client; `storage: null` keeps the held id out of the browser.)
2. Tier 1a is behavior-neutral by intent; its risks (the 401 rule, request shape, token origin, stream handling) are each pinned by a named test in Tasks 1-3, run against a stubbed `fetch` so a library that differs from the ASSUMED items fails. Value is code deletion, not features.
3. Tier 1b changes what the model receives: with a held id the library sends only the newest message and the server replays history. That removes the duplicated-context risk this plan carried before D2, but it makes persistence a hard requirement: if an environment's backend persistence is off, the model would see one message per turn and lose all context. So 1b is enabled per environment by a runtime flag (default off) and `sendFullTranscript: true` stays the override.
4. Order within the four hosts: adopt last (spec rollout step 5: "only if it is worth it for an internal admin tool"). If the library release slips, stay at Tier 0. If baileyai #545 and the CORS exposure are not deployed in an environment, stay at 1a there.

PR boundaries: **PR A** = Tasks 1-3 (Tier 1a). **PR B** = Task 4 (Tier 1b, behind the runtime flag), opened only after its prerequisites (see "Dependencies on other work") are deployed. Task 5 is verification and rollout for each PR.

## Review Focus

Failure modes the spec implies but its own tests do not pin, most likely first. Each has a test in the task named.

1. **Bailey returns 401/403 and the host logs the user out or wipes the token.** Expected: chat shows an error, session and `localStorage` untouched. Test: Task 3, `does not log out or clear the session when Bailey answers 401 or 403`.
2. **Token missing, expired-and-cleared, or not a JWT.** Expected: no `Authorization` header (not `Bearer null`), no exception while building headers, chat behaves as today. Test: Task 2, `omits Authorization when no session token exists` (and a non-JWT opaque token is sent as-is, since the host no longer decodes it).
3. **Token rotates mid-session.** Expected: the next request carries the new token. Test: Task 3, `getHeaders reads the current token on every call`.
4. **Persistence is off on the backend in some environment while the stable-id flag is on.** Expected: the host does not enable it there (flag defaults off); with the flag off the full transcript is sent, so context is intact. Tests: Task 3, `sends the full transcript each turn even after the server reports an id`; Task 4, `sends only the newest message once an id is held when the flag is on`.
5. **The held id leaks into browser storage, or survives a reload.** Expected: no `sessionStorage`/`localStorage` entry containing the id or the `sub`; a reload starts a new chat (today's behavior). Test: Task 3, `does not persist the conversation id` (real library hook, stubbed fetch that reports an id).
6. **The browser cannot read `X-Conversation-Id` (CORS `expose_headers` missing) or the server reports no id.** Expected: the library holds no id, so with the flag on the host must still behave correctly (full transcript is sent, or at minimum no context loss), and never invents an id. Test: Task 4, `does not drop context when no conversation id is reported`.

## File structure

| File | Responsibility | Change |
|---|---|---|
| `package.json`, `yarn.lock` | library version | modify (Task 1) |
| `src/api/baileyClientContract.test.ts` | pins the ASSUMED library API so a wrong release fails fast | create (Task 1) |
| `src/api/baileyApi.ts` | header building from the session token; no streaming | modify (Task 2) |
| `src/api/baileyApi.test.ts` | header tests; streaming tests removed | modify (Task 2) |
| `src/hooks/useBaileyChatTransport.ts` | builds the library client; `onAuthError` no-op | modify (Task 3) |
| `src/hooks/useBaileyChatTransport.test.tsx` | referential stability, 401 rule, token freshness | modify (Task 3) |
| `src/components/BaileyChatContainer.tsx` and `.test.tsx` | pass `conversation: { storage: null, sendFullTranscript }` | modify (Task 3 pins `true`; Task 4 derives it from the flag) |
| `src/context/EnvironmentContext.ts` and `.test.ts`, `.env.example`, `docker-compose.yml` | runtime flag `REACT_APP_BAILEY_STABLE_CONVERSATIONS` (opt-in) exposed as `baileyStableConversations: boolean` | modify (Task 4, PR B); the context value is also built by hand in `BaileyChatContainer.test.tsx:35-45` and `useBaileyChatTransport.test.tsx:20-30`, update those fixtures |
| `src/api/baseApi.ts` | unchanged (`buildHeaders` stays `protected`) | none |
| `UserContext.ts`, `src/constants/baileyConstants.ts`, `src/pages/BaileyAIPage.tsx` | unchanged | none |

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

// ASSUMED (decisions D1-D3; exact names to confirm against the release): the library never mints an id.
export interface UseBaileyChatConversationOptions {
    initialConversationId?: string;       // seed to resume; this host passes none
    storage?: null | ConversationStorage; // library default persists the held id in sessionStorage; null disables (D3)
    sendFullTranscript?: boolean;         // true => always send the whole transcript, even when an id is held (D2 override)
    subject?: string;                     // optional; only keys/validates a STORED id. This host passes none (storage is null)
    onConversationId?: (id: string) => void; // optional notification; this host does not use it (the id embeds the sub)
}
// useBaileyChat(config & { conversation?: UseBaileyChatConversationOptions }) => result gains `conversationId: string | undefined`
// The id comes from the response's `X-Conversation-Id` (later a `conversation` body field). Once held, and
// unless `sendFullTranscript` is true, only the newest message is sent.
```

Existing, verified in installed 1.0.9 `dist/index.d.ts`: `BaileyChatTransport.streamChat(params: { model; instructions; input; tools; toolChoice?; signal; onChunk; onRequestId? }): Promise<{ status?: number; text: string; errorMessage?: string }>`; `UseBaileyChatConfig { transport; model; instructions; tools?; ... }`.

ASSUMED behaviors to confirm: (a) `getHeaders` output is merged under the library's own `Content-Type` and `Accept`; (b) the client keeps `onRequestId` for `x-request-id` (the trace panel uses it); (c) a non-2xx body and a network `errorMessage` still reach `useBaileyChat` as today; (d) an aborted turn rejects with `AbortError`; (e) a mid-stream drop returns partial text; (f) the client refuses to send to any origin other than `baseUrl`; (g) with `storage: null` nothing is written to browser storage; (h) with `sendFullTranscript: true` the whole transcript is sent every turn regardless of any held id; (i) with the flag off the library sends no `x-chat-id` and tolerates a response that reports no id.

### Produced by this plan

```ts
// src/api/baileyApi.ts
class BaileyApi extends BaseApi {
    /** Authorization (from the session token, per identityProvider) and Origin-Service only. */
    getAuthHeaders(): Record<string, string>;
}

// src/hooks/useBaileyChatTransport.ts  (name and return type unchanged)
export function useBaileyChatTransport(): BaileyChatTransport;

// src/context/EnvironmentContext.ts (Task 4): EnvContext gains `baileyStableConversations: boolean`,
// true only when REACT_APP_BAILEY_STABLE_CONVERSATIONS is a true value; unset or empty => false.
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

### Task 2: Reduce `BaileyApi` to auth headers

**Files:**
- Modify: `src/api/baileyApi.ts` (remove `StreamChatParams`, `streamChat`, the `handleUnauthorized` override and its comment; add `getAuthHeaders`)
- Modify: `src/api/baileyApi.test.ts`

**Interfaces:**
- Consumes: `BaseApi.buildHeaders(extra?)` (`src/api/baseApi.ts:74`, `protected`, selects the token via `identityProvider` and `AuthUrlProvider.tokenToSendToFhirServer`, drops a caller-supplied `Authorization`, omits it when no token).
- Produces: `getAuthHeaders()` as above, used by Task 3.

- [ ] **Step 1: Write the failing tests** (replace the streaming tests). `baileyApi.test.ts` today only calls `localStorage.clear()` and sets `jwt`; it never sets `identityProvider` and never mocks `AuthUrlProvider`. `BaseApi.buildHeaders` (`src/api/baseApi.ts:75-81`) calls `getAuthInfo` whenever `identityProvider` is set, and the real `getAuthInfo` throws unless five `REACT_APP_AUTH_<P>_*` variables exist (`src/utils/authUrlProvider.ts:83-94`). So mock it the way `src/api/baseApi.test.ts:3-9` does: `vi.hoisted` `mockGetAuthInfo` and `vi.mock('../utils/authUrlProvider', ...)` returning `{ getAuthInfo: mockGetAuthInfo }`; the working pattern for varying the token key is `baseApi.test.ts:324-355`.
  - `getAuthHeaders attaches the session bearer token` -> `Authorization === 'Bearer <token>'`.
  - `getAuthHeaders sends Origin-Service fhir-ui` -> `'Origin-Service' === 'fhir-ui'`.
  - `getAuthHeaders returns only Authorization and Origin-Service` -> keys equal exactly those two (no `Accept`, `Cache-Control`, `Content-Type`, so the library's own `Accept`/`Content-Type` are not fought).
  - `omits Authorization when no session token exists` -> no `Authorization` key, not `Bearer null`. (Review Focus 2.)
  - `uses the token chosen by the identity provider` -> set `localStorage.identityProvider`, have `mockGetAuthInfo` return `{ tokenToSendToFhirServer }`, parameterized over `'id_token'`, `'jwt'` and `undefined` (which must fall back to `'jwt'`, as `buildHeaders` does at `baseApi.ts:79`); assert `Authorization` carries the value stored under the matching key. There is no provider list to iterate: `tokenToSendToFhirServer` comes per provider from `REACT_APP_AUTH_<P>_TOKEN_TO_SEND_TO_FHIR_SERVER` and defaults to `'jwt'` (`authUrlProvider.ts:100-104`).
  - `sends an opaque non-JWT token unchanged` -> stored value `not-a-jwt` yields `Authorization === 'Bearer not-a-jwt'` (the host never decodes the token for Bailey now). (Review Focus 2.)
  - Streaming tests in this file are removed only after each guarantee has a replacement in Task 3 (below); the commit message lists the mapping. Port table (old test at `src/api/baileyApi.test.ts`, line numbers on `origin/main`): `:54` POST to `/bailey/v1/responses` with body `{model, instructions, input, stream: true, tools}` -> Task 3 `sends the chat request to /bailey/v1/responses`; `:75` JSON + SSE negotiation -> Task 3 `sends one Content-Type and Accept: application/json, text/event-stream`; `:90` bearer token -> Task 2 test above; `:101` one onChunk per chunk -> Task 3 `streams decoded text to onChunk`; `:115` invariant 11 multi-byte split -> Task 3 `reassembles a multi-byte character split across chunks`; `:134` trailing flush -> Task 3 `flushes a trailing partial character`; `:150`/`:162` request id -> Task 3 `reports x-request-id`/`does not call onRequestId without it`; `:172` invariant 6 -> Task 3 401 test; `:186` non-2xx body -> Task 3; `:198` fetch failure -> Task 3 `returns errorMessage with no status when fetch fails`; `:210` invariant 14 -> Task 3 AbortError test.
- [ ] **Step 2: Run** `yarn test src/api/baileyApi.test.ts`. Expected: FAIL (`getAuthHeaders is not a function`).
- [ ] **Step 3: Implement** `getAuthHeaders(): Record<string, string>` by calling `this.buildHeaders()` and keeping only `Authorization` and `Origin-Service` (case-insensitive key match); Do not duplicate `BaseApi`'s token selection. No `sub` is extracted: under D1 the library does not need it.
- [ ] **Step 4: Run** `yarn test src/api/baileyApi.test.ts`. Expected: PASS. Then `yarn lint && yarn tsc --noEmit`. `tsc` fails in `useBaileyChatTransport.ts` (calls the removed `streamChat`); that is fixed in Task 3, so commit Tasks 2 and 3 together or keep `streamChat` until Task 3 lands. Choose: commit both in one commit.
- [ ] **Step 5: Commit** (with Task 3).

### Task 3: Build the library client in `useBaileyChatTransport` and pin conversation options

**Files:**
- Modify: `src/hooks/useBaileyChatTransport.ts`
- Modify: `src/hooks/useBaileyChatTransport.test.tsx`
- Modify: `src/components/BaileyChatContainer.tsx` and `src/components/BaileyChatContainer.test.tsx` (pass `conversation: { storage: null, sendFullTranscript: true }`)

**Interfaces:**
- Consumes: `createBaileyClient` (Task 1), `BaileyApi.getAuthHeaders` (Task 2), `EnvContext.baileyUrl`.
- Produces: `BaileyChatContainer` passes `conversation: { storage: null, sendFullTranscript: true }` to `useBaileyChat` (Task 4 changes the second value); `useBaileyChatTransport(): BaileyChatTransport`, referentially stable across renders while `baileyUrl` is unchanged. It no longer reads `UserContext` or takes `setUserDetails`: the library never calls `BaseApi`, so no code path reaches `logout`.

- [ ] **Step 1: Write the failing tests** (the file mocks `../api/baileyApi` today; keep mocking only at external boundaries: stub global `fetch` and `localStorage` instead, so the real `BaileyApi` runs; mock `../utils/authUrlProvider` as in `src/api/baseApi.test.ts:3-9` whenever a test sets `localStorage.identityProvider`, including the 401 test below, whose spies are the `logout` and `removeAuthData` mocks from `../utils/auth.utils` as well as `setUserDetails`):
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
  - Container (`BaileyChatContainer.test.tsx`, which already records the `useBaileyChat` config): `pins storage null and sendFullTranscript true` -> config `conversation` deep-equals `{ storage: null, sendFullTranscript: true }`, so PR A is behavior-neutral even when the backend starts reporting an id.
  - `does not persist the conversation id` (Review Focus 5; real library hook, fetch stub whose response carries `X-Conversation-Id: user-1:chat-0123abcd`): after a send, `sessionStorage.length === 0` and `localStorage` holds no key or value containing `chat-0123abcd`.
  - `sends the full transcript each turn even after the server reports an id` (Review Focus 4): two sends; the second request body's `input` contains both user messages and the first assistant reply; no `x-chat-id` header on either request.
  - `sends only to baileyUrl's origin`: for every fetch call in this file, `new URL(url).origin === new URL('https://bailey.example.com').origin` (origin comparison, never `startsWith`). The refusal case is covered in Task 1.
- [ ] **Step 2: Run** `yarn test src/hooks/useBaileyChatTransport.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** `useBaileyChatTransport` with `useMemo` keyed on `[baileyUrl]`: one `BaileyApi` (constructed with `fhirUrl: baileyUrl`, `setUserDetails: undefined`), `createBaileyClient({ baseUrl: baileyUrl, getHeaders: async () => api.getAuthHeaders(), onAuthError: () => undefined })`. Move the "why a Bailey 401 must not log out" comment from the deleted `handleUnauthorized` onto `onAuthError`. If an asserted item in Step 1 fails because the library differs from ASSUMED, stop and raise it with the library owner rather than patching around it in the host.
- [ ] **Step 4: Run** `yarn test src/hooks/useBaileyChatTransport.test.tsx src/api/baileyApi.test.ts src/components/BaileyChatContainer.test.tsx`, then `yarn lint && yarn tsc --noEmit && yarn test && yarn build`. Expected: all PASS. `BaileyChatContainer.test.tsx` keeps its existing two tests and gains the one above.
- [ ] **Step 5: Commit** (Tasks 2 and 3 together)

```bash
git add src/api/baileyApi.ts src/api/baileyApi.test.ts src/hooks/useBaileyChatTransport.ts src/hooks/useBaileyChatTransport.test.tsx src/components/BaileyChatContainer.tsx src/components/BaileyChatContainer.test.tsx
git commit -m "BAI-1237 Use the library Bailey client for chat transport, keep Bailey 401 from logging out"
```

### Task 4 (PR B, behind a runtime flag): Stable server-issued conversation per chat

Do not start until the dependencies marked "Task 4" in "Dependencies on other work" are deployed to the target environment, and the library exposes the ASSUMED options (confirm names in Task 1). No `sub` is read or passed; no client-side id is minted.

**Files:**
- Modify: `src/context/EnvironmentContext.ts` (+ `EnvironmentContext.test.ts`), `.env.example`, `docker-compose.yml`
- Modify: `src/components/BaileyChatContainer.tsx`, `src/components/BaileyChatContainer.test.tsx`, `src/hooks/useBaileyChatTransport.test.tsx` (fixtures only)

**Interfaces:**
- Consumes: `UseBaileyChatConversationOptions` (ASSUMED), `baileyEnabled`-style flag parsing already in `EnvironmentContext.ts` (`isTrue`).
- Produces: `EnvContext.baileyStableConversations: boolean` (default `false`, opt-in; read through `APP_ENV` so it can be set at container start per `docs/runtime-environment-config.md`); `BaileyChatContainer` passes `conversation: { storage: null, sendFullTranscript: !baileyStableConversations }`.

- [ ] **Step 1: Write the failing tests**:
  - `EnvironmentContext.test.ts`: `REACT_APP_BAILEY_STABLE_CONVERSATIONS $flagLabel -> baileyStableConversations $expected` (parameterized over unset, empty, `'true'`, `'false'`; unset and empty are `false`, unlike `REACT_APP_ENABLE_BAILEY` which defaults on).
  - Container: `sends the full transcript when the flag is off` -> config `conversation.sendFullTranscript === true`; `lets the library send only the newest message when the flag is on` -> `false`; both keep `storage === null`.
  - Real hook, stubbed fetch reporting `X-Conversation-Id`, flag on: `sends only the newest message once an id is held` (second request body `input` has one user message; the first request carried no `x-chat-id`); `New chat drops the held id` (after `newChat()` the next request again carries the full transcript of the new chat, a single message, and no id); `does not drop context when no conversation id is reported` (Review Focus 6; response without the header: the second request still contains the whole transcript, or the test asserts the library's documented fallback, whichever the release defines).
  - `never sends an id this host did not receive`: no request in any test carries `x-chat-id` before a response reported one; and an id reported with a different `sub` prefix is accepted or ignored as the library defines, without logging it.
- [ ] **Step 2: Run** `yarn test src/context/EnvironmentContext.test.ts src/components/BaileyChatContainer.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** the flag in `EnvironmentContext.ts` (add the field to the context type and default value, parsed with `isTrue`, same file pattern as `baileyEnabled`), `.env.example` (`REACT_APP_BAILEY_STABLE_CONVERSATIONS='false'` with a comment that it must be `true` only where baileyai persists conversations), `docker-compose.yml` passthrough; derive `sendFullTranscript` in `BaileyChatContainer`. Update the hand-built context values in the two test fixtures named above.
- [ ] **Step 4: Run** `yarn lint && yarn tsc --noEmit && yarn test && yarn build`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/context/EnvironmentContext.ts src/context/EnvironmentContext.test.ts .env.example docker-compose.yml src/components/BaileyChatContainer.tsx src/components/BaileyChatContainer.test.tsx src/hooks/useBaileyChatTransport.test.tsx
git commit -m "BAI-1237 Enable stable server-issued Bailey conversations behind a runtime flag"
```

### Task 5: Verify in dev, roll out, keep rollback ready

**Files:** none (verification and release steps). Add nothing to the repo unless a finding requires it.

- [ ] **Step 1: Local** (`yarn dev` with `.env` pointing `REACT_APP_BAILEY_URL` at dev Bailey): three-turn chat with a table answer and a chart answer; confirm streaming is incremental, tables/charts render, the trace panel shows a request id, Stop works mid-stream.
- [ ] **Step 2: 401 rule**, in an environment whose Bailey does not trust the app's token issuer: send a message; expect an error in the chat and the user still logged in after a page reload. (PR A and PR B.)
- [ ] **Step 3 (PR B only, in an environment with persistence on, #545 and `expose_headers` deployed, flag set to `true`)**: after a three-turn chat, the caller's conversation list in the backend shows one conversation with 3 turns, not three; the browser's network tab shows `X-Conversation-Id` readable on the response and later requests sending only the newest message; the model still answers using earlier turns; after reload `sessionStorage` has no conversation key. If the list shows three, the id is not reaching the browser (CORS or #545): record it and leave the flag off.
- [ ] **Step 4: Release.** Merge after CI is green (`lint`, `test`, `Check Commit Message`). Tag `fhir-server-ui`; deploy via `bwell-fhir-server-ui` workflows dev, staging, prod in order (see "Sibling repo" below). Run PR A and PR B as separate tags.
- [ ] **Step 5: Rollback.** Revert the PR and cut a new tag, or pin `@icanbwell/baileyai-chat-ui` back to `^1.0.9` with the revert. Fast disable without a rebuild: `REACT_APP_ENABLE_BAILEY=false` (the opt-out kill switch in `EnvironmentContext.ts`; runtime-configurable per `docs/runtime-environment-config.md`) hides Bailey entirely. PR B alone is turned off at runtime by setting `REACT_APP_BAILEY_STABLE_CONVERSATIONS=false` (or unsetting it), which restores `sendFullTranscript: true` with no rebuild; the backend keeps whatever conversations it already stored.

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
| 3 | PR B (Task 4, 5), flag off by default, turned on per environment | baileyai #545 and `expose_headers` deployed there; backend persistence on there; Task 5 step 3 passes |

## Dependencies on other work

| Item | Owner | Needed by | If not available |
|---|---|---|---|
| Library release exporting `createBaileyClient` with `getHeaders`, `onAuthError` | baileyai-chat-ui (PR #54) | Task 1 | Stay at Tier 0 |
| Library server-issued-id handling and options (`storage`, `sendFullTranscript`, optional `subject`, `initialConversationId`) | baileyai-chat-ui (PR #55 and follow-ups: D3 makes `sessionStorage` persistence the default, which #55 does not yet do) | Tasks 3-4 | Skip PR B; PR A needs `storage: null` accepted or no default persistence |
| baileyai #545: always return `X-Conversation-Id` with the id actually used, including on streams | baileyai | Task 4 | Skip PR B (the library never learns the id) |
| CORS `expose_headers` for `X-Conversation-Id` (baileyai #541) | baileyai | Task 4 | Skip PR B (the browser cannot read the header) |
| Backend persistence on in the target environment (D2: host config, no probe) | platform / baileyai config | Task 4 | Leave the flag off there |
| Ordering: a fast follow-up send could load history before the previous streamed turn is committed (unverified; chat-ui plan Task 12 Step 0) | baileyai / baileyai-chat-ui | Task 4 | Leave the flag off until verified |
| `<RELEASE>` resolvable in JFrog | platform / bwell-fhir-server-ui | deploy | deploy blocked |

## Open questions to resolve before executing

Resolved by the owner and applied above: ids are server-issued (D1); persistence-off is host config with no probe (D2); the library persists the held id by default and this host opts out (D3); the history drawer is opt-in and not used here (D4); the Tech Design Review and EA exception are on hold, so nothing here merges until they are filed.

1. **Confirm that this host should keep `storage: null`** (no resume across reload, matching the 2026-08-11 design). If persistence is wanted instead, drop `storage: null`, clear the stored id on logout (this host has `logout` in `src/utils/auth.utils.ts` and `removeAuthData`), and decide whether to pass `subject` so the library can validate a stored id. This plan chose opt-out because an internal admin tool gains nothing from resuming old conversations.
2. Which environments have backend persistence on? Needed to know where the Task 4 flag can be `true`.
3. The ordering risk in the dependencies table: does a follow-up send ever load history before the previous turn is committed?
4. Does the library release accept `storage: null` and `sendFullTranscript` under those names, and what does it do when a response carries no id (Task 4, Review Focus 6)? Replace the ASSUMED names after reading the release.
5. Exact library release number (replace `<RELEASE>`).
6. Does the owner still want PR B at all for this tool? Value is cleaner stored conversations and a prerequisite for later history; if not wanted, stop after PR A.

## Self-review

- **Spec coverage:** spec section 6.1 (client, `getHeaders`, `onAuthError`) -> Tasks 1 and 3; 6.2 (id, storage; revised by D1-D3 to server-issued ids, default persistence, send-only-newest) -> Tasks 3 and 4; 6.3 history UI (opt-in in the library, D4) and 6.4 feedback -> not adopted by this host (Tier 2); 6.5 "stays in hosts" (auth, base URL, flags) -> `BaileyApi.getAuthHeaders`, `baileyUrl`, `REACT_APP_ENABLE_BAILEY` untouched; section 10 success criterion for this host ("one multi-turn conversation per chat, confirmed in the backend's conversation list") -> Task 5 step 3; "hosts that opt into nothing see no change" -> Task 3 pins `storage: null` and `sendFullTranscript: true`, so a library default that persists or sends only the newest message cannot change this host's behavior.
- **Step scan:** every test names its assertions; implementations are signatures plus one-line approach. No placeholder logic remains except `<RELEASE>`, which Task 1 resolves.
- **Type consistency:** `getAuthHeaders`, `useBaileyChatTransport`, `baileyStableConversations`, `conversation.storage`/`sendFullTranscript` are used with the same names in every task.
- **Review Focus:** six items, each tied to a named test above.
- **Proportion:** small source changes (`baileyApi.ts`, the transport hook, the container, one env flag); the document is mostly decisions and tests. `getSubject`/`useBaileySubject` from the earlier draft are gone (D1).
- **Known unverified:** library behavior (all ASSUMED items), the library's option names, backend persistence per environment, the commit-ordering risk, the library version mapping (`baileyai-chat-ui` `origin/main` is `0.3.1-pre.2` with tags up to `v0.4.1-pre.0`, while hosts pin `^1.0.9`; how the published 1.x relates is not verified).
