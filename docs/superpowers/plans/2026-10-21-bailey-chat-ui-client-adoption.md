# Adopt the library-owned Bailey client in fhir-server-ui Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fhir-server-ui's own Bailey HTTP transport with the `@icanbwell/baileyai-chat-ui` Bailey client, with the smallest host change that preserves today's auth behavior, and (only where server persistence is on) give each chat one stable, server-issued conversation ID.

**Architecture:** `BaileyApi` stops streaming and only builds auth headers from the session token. `useBaileyChatTransport` builds a library client from `baileyUrl`, `getHeaders` and a no-op `onAuthError`, and returns it as the `BaileyChatTransport` that `useBaileyChat` already accepts, so `BaileyChatContainer` and `BaileyChatPanel` keep working. Conversation ids are server-issued (decision D1): the library never mints one, it adopts the id the server reports (`X-Conversation-Id`) and, once it holds one, sends only the newest message (D2). Because that changes what the model receives, PR A pins `sendFullTranscript: true` and `storage: false`, so it stays behavior-neutral; a second, separately shippable step flips `sendFullTranscript` off through a runtime host flag, only in environments where backend persistence is on.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4 + Testing Library (jsdom), Yarn 4 (`yarn.lock`), `@icanbwell/baileyai-chat-ui`.

**Spec:** `~/git/baileyai-chat-ui` branch `origin/IQ-BAI-1237` (checked at `d043cb0`): `docs/superpowers/specs/2026-10-21-chat-ui-bailey-client-design.md` (draft, PR #54), `docs/superpowers/specs/2026-10-22-history-ui-design-notes.md`, and the library plan `docs/superpowers/plans/2026-10-21-chat-ui-bailey-client.md` (Tasks 1-15). Option and result names below are the ones in that spec and plan; the library is not released yet, so they are still confirmed against the release in Task 1.
**Backend contract:** `~/git/baileyai` branch `origin/IQ-BAI-1237`: `docs/tech-designs/conversation-api-for-chat-ui-client.md` (draft, PR #543); baileyai #545 item 1 ("always return the id actually used", derived once per request, including on streaming responses) and CORS `expose_headers` for `X-Conversation-Id` (`70a9326` on baileyai #541, not merged on `main`) are prerequisites for the stable-id step; they are library release gates, and they must be deployed in every environment this host runs in.
**Decisions applied (2026-10-22, from the owner):** D1 server-issued ids, no client minting; D2 persistence-off is host config, no probe, `sendFullTranscript: true` is the manual override, and once an id is held the library sends only the newest message; D3 the library persists the held id in `sessionStorage` per tab by default and `storage: false` disables it (a host can also pass its own `storage` or `storageKey`); D4 the default history drawer is in the library v1 but opt-in (`history={{ client }}`; a host `onHistoryClick` overrides it; `locale` prop), and this host does not opt in; D9 no Tech Design Review and no EA exception is filed (decided 2026-10-22 by Imran Qureshi; EA agrees per Imran Qureshi, no approval artifact is linked); failure signals are surfaced, never silent (`persistence`, `onStorageError`, `contextLost`, `onContextLoss`, fallback to the full transcript).
**Release status (2026-10-23):** `@icanbwell/baileyai-chat-ui` 1.0.18 is published on public npm (library `main` acc9859). It exports `createBaileyClient`; its `streamChat` result carries optional `errorKind` (`'network'`, `'timeout'`) and `errorCause` (the error `fetch` threw; absent when `getHeaders` threw); `onContextLoss` receives `reason: 'id' | 'history'`; the decoder flushes a stream that ends mid-character. A failed `fetch` or `getHeaders` resolves with `status: undefined` and `errorKind: 'network'` rather than rejecting. Task 1 therefore uses `^1.0.18`. Implementation: PR #308.

**Decisions applied (2026-10-23, Imran Qureshi):** D5 error text: the underlying reason is kept (library 1.0.18: `errorKind` and `errorCause` on the `streamChat` result; the message stays a fixed string), this host chooses its chat error copy from `errorKind` and status, and may log `errorKind`, status and `errorCause` for diagnostics only (never the request URL, never `cause.message` shown to users unreviewed); D6 context loss UX is silent (no notice, nothing logged), relying on the automatic full-transcript fallback; D7 telemetry: this host has no telemetry hook (only `@sentry/react` error reporting initialised in `src/index.tsx`, no counters or event tracking), so `onStorageError` and `onContextLoss` emit nothing here; if a hook is added later they may emit a counter only (no ids, no text); D8 the library release does not wait for the BAI-1263 history signal; the residual risk stands until it is deployed.
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
- This host sets `storage: false`: the held id is never written to `sessionStorage` or `localStorage`, so `persistence` reads `'off'` by design (not a fault). Reason: the 2026-08-11 screen design fixed "no thread/session persistence", an internal admin tool wanted no resume across reload, and the library otherwise persists the id in `sessionStorage` per tab by default (D3). Because `storage` is `false`, `sub`, `storageKey` and `onStorageError` are not passed.
- Once the library holds an id it sends only the newest message, which is correct only if the backend persists conversations. Until a runtime flag says persistence is on, this host sets `sendFullTranscript: true`, which sends the full transcript and never the id (an id would make the server prepend its stored history to the full transcript and duplicate it). The library does not probe for persistence; the flag is the host's assertion that persistence is on in that environment (a library release gate).
- Failure signals are not hidden: with the flag on, a turn that sent a held id and got back no id or a different one sets `contextLost`, calls `onContextLoss`, drops the id and makes the next turn a first turn with the full transcript. This host must not log `sentId` or `reportedId` (they embed the `sub`). A silent history-load failure under an unchanged id is an accepted residual risk (owner Imran Qureshi) until the per-turn history signal (BAI-1263, library Task 15, spec 6.8) is deployed in the backend and consumed; it is not covered by `contextLost` before then.
- No PHI or message text in logs, console output, the trace panel, test fixtures or this plan; the same holds for conversation titles and the `sub`.
- Additive: an unchanged host must keep working; no change to backend routes or the `/bailey/v1/responses` request shape.
- A 401 (or 403) from Bailey must not log the user out of fhir-server-ui, clear `jwt`/`id_token`, or call `setUserDetails`. Reason: the session token comes from a different issuer than Bailey's `AUTH_PROVIDERS` trusts, so a Bailey 401 is a config mismatch, not an invalid session. It must be preserved through the library's `onAuthError` and `getHeaders`.
- Library version required: a `@icanbwell/baileyai-chat-ui` release that exports `createBaileyClient` with `getHeaders` and `onAuthError` (API per the spec, section "Interfaces"; the same release must have the server-issued-id handling, `storage` and `sendFullTranscript`, and must have passed the library's release gates). The release number is not known; the plan uses `<RELEASE>` and Task 1 fixes it. The current range in `package.json` on `main` is `^1.0.9`; `yarn.lock` resolves 1.0.9, which has no client. Public npm lists versions up to 1.0.16 (checked 2026-10-22); that none of them contains the client is not verified, but the client is unreleased per the spec (superseded: the client is in 1.0.17 and 1.0.18 is current, see the release status above). This repo is open source: the dependency must resolve from public npm, and nothing here may assume a b.well private registry.
- `conversationVia` stays at its default `'header'`. The `conversation` request-body field (spec 6.7, BAI-1242) is a later, backend-gated option; this host does not adopt it in these PRs. When it does, a body field is readable by the browser without CORS `expose_headers`.
- The session token is read on every request, never captured at construction, and `Authorization` is omitted (not `Bearer null`) when no token exists.
- The token must only be sent to `baileyUrl` (`REACT_APP_BAILEY_URL`).

## Decision: should this internal admin tool adopt, and how little?

Verified facts (re-read in this worktree on 2026-10-21):

- `src/api/baileyApi.ts` posts to `/bailey/v1/responses` through `BaseApi.streamRequest`, sends no `x-chat-id`, never reads `X-Conversation-Id` (its `onHeaders` reads only `x-request-id`). The backend therefore stores each turn as its own one-message conversation.
- `useBaileyChat` re-sends the whole transcript in `input` each turn.
- `BaileyApi.handleUnauthorized` is a no-op on purpose (different token issuer). `BaseApi.streamRequest` calls it after every response; the default implementation logs out on a 401.
- `BAILEY_SYSTEM_INSTRUCTIONS` (`src/constants/baileyConstants.ts`) requires a fresh tool call each turn and forbids answering from a prior turn.
- The 2026-08-11 plan for this screen fixed "no thread/session persistence"; nothing since has changed that.
- Bailey is called directly from the browser at `REACT_APP_BAILEY_URL` (not via the api-gateway). Bailey's CORS uses `allow_headers=["*"]` (`baileyai/api.py:288,358` on `origin/main`), so a request header such as `x-chat-id` passes preflight. `expose_headers` is not set on `main` (commit `70a9326` on baileyai #541 adds it, unmerged), so a browser cannot read `X-Conversation-Id` until it is deployed, and streaming responses report the id only when the request carried `x-chat-id` (and echo it even if the server ignored it) until baileyai #545 item 1 lands. Under D1 this host sends none, so the stable-id step cannot work until both are deployed to the target environment.

Options:

| Tier | What changes | Behavior change | Value to this host |
|---|---|---|---|
| 0 | Nothing | None | None; keeps ~40 lines of own transport |
| 1a | Library client replaces `BaileyApi.streamChat`; auth via `getHeaders`/`onAuthError`; `storage: false`, `sendFullTranscript: true` | None intended | Removes duplicated stream/parse/timeout code; picks up library fixes |
| 1b | 1a plus a runtime flag that turns `sendFullTranscript` off; the library adopts the server-reported id and sends only the newest message | One conversation per chat in the backend instead of one per message; smaller requests | Cleaner stored data; prerequisite for any later history/feedback |
| 2 | Library history drawer (opt-in via `history={{ client }}`), persistence across reload, feedback buttons | Visible UI, stored conversations resumed | Low: internal admin tool, no stated need; the drawer ships in library v1 but this host passes neither `history` nor `onHistoryClick`, so no history entry renders |

**Recommendation: Tier 1a now, Tier 1b gated, Tier 2 out of scope.** Reasons:

1. Tier 2 has no requester. The screen is an internal admin helper whose prompt demands fresh tool calls each turn; resuming old conversations works against that and persisted admin queries about patient data are PHI-adjacent data at rest that nobody asked for. (Every turn is already stored today, so 1b adds no new class of storage; it only groups it. The drawer is opt-in and this host passes no history client; `storage: false` keeps the held id out of the browser.)
2. Tier 1a is behavior-neutral by intent; its risks (the 401 rule, request shape, token origin, stream handling) are each pinned by a named test in Tasks 1-3, run against a stubbed `fetch` so a library that differs from the spec's behavior fails. Value is code deletion, not features.
3. Tier 1b changes what the model receives: with a held id the library sends only the newest message and the server replays history. That removes the duplicated-context risk this plan carried before D2, but it makes persistence a hard requirement: if an environment's backend persistence is off, the model would see one message per turn and lose all context. So 1b is enabled per environment by a runtime flag (default off) and `sendFullTranscript: true` stays the override.
4. Order within the four hosts: adopt last (spec rollout step 5: "only if it is worth it for an internal admin tool"). If the library release slips, stay at Tier 0. If baileyai #545 item 1, the CORS `expose_headers` or backend persistence are not in place in an environment, stay at 1a there.

PR boundaries: **PR A** = Tasks 1-3 (Tier 1a). **PR B** = Task 4 (Tier 1b, behind the runtime flag), opened only after its prerequisites (see "Dependencies on other work") are deployed. Task 5 is verification and rollout for each PR.

## Review Focus

Failure modes the spec implies but its own tests do not pin, most likely first. Each has a test in the task named.

1. **Bailey returns 401/403 and the host logs the user out or wipes the token.** Expected: chat shows an error, session and `localStorage` untouched. Test: Task 3, `does not log out or clear the session when Bailey answers 401 or 403`.
2. **Token missing, expired-and-cleared, or not a JWT.** Expected: no `Authorization` header (not `Bearer null`), no exception while building headers, chat behaves as today. Test: Task 2, `omits Authorization when no session token exists` (and a non-JWT opaque token is sent as-is, since the host no longer decodes it).
3. **Token rotates mid-session.** Expected: the next request carries the new token. Test: Task 3, `getHeaders reads the current token on every call`.
4. **Persistence is off on the backend in some environment while the stable-id flag is on.** Expected: the host does not enable it there (flag defaults off); with the flag off the full transcript is sent, so context is intact. If the flag is on by mistake, the library detects a turn that sent a held id and got back no id or a different one, sets `contextLost`, calls `onContextLoss`, and the next turn is a first turn with the full transcript; a 4xx/5xx on the turn (including the 503 the conversation routes return when persistence is off) rejects as an error, which the chat shows. Only a silent history-load failure under an unchanged id is undetected until BAI-1263 is deployed (accepted residual risk, owner Imran Qureshi). Tests: Task 3, `sends the full transcript each turn even after the server reports an id`; Task 4, `sends only the newest message once an id is held when the flag is on` and `falls back to the full transcript and signals contextLost when the reported id is missing or changes`.
5. **The held id leaks into browser storage, or survives a reload.** Expected: no `sessionStorage`/`localStorage` entry containing the id or the `sub` (the library's default would store it in `sessionStorage`; this host passes `storage: false`); a reload starts a new chat (today's behavior). Test: Task 3, `does not persist the conversation id` (real library hook, stubbed fetch that reports an id).
6. **The browser cannot read `X-Conversation-Id` (CORS `expose_headers` missing) or the server reports no id.** Expected (spec 6.2): the library never holds an id, so every turn sends the full transcript exactly as today, history and feedback stay unavailable, nothing is logged, and the host never invents an id. Test: Task 4, `does not drop context when no conversation id is reported`.

## File structure

| File | Responsibility | Change |
|---|---|---|
| `package.json`, `yarn.lock` | library version | modify (Task 1) |
| `src/api/baileyClientContract.test.ts` | pins the library API this plan relies on so a wrong release fails fast | create (Task 1) |
| `src/api/baileyApi.ts` | header building from the session token; no streaming | modify (Task 2) |
| `src/api/baileyApi.test.ts` | header tests; streaming tests removed | modify (Task 2) |
| `src/hooks/useBaileyChatTransport.ts` | builds the library client; `onAuthError` no-op | modify (Task 3) |
| `src/hooks/useBaileyChatTransport.test.tsx` | referential stability, 401 rule, token freshness | modify (Task 3) |
| `src/components/BaileyChatContainer.tsx` and `.test.tsx` | pass `storage: false` and `sendFullTranscript` as top-level `useBaileyChat` options | modify (Task 3 pins `true`; Task 4 derives it from the flag) |
| `src/context/EnvironmentContext.ts` and `.test.ts`, `.env.example`, `docker-compose.yml` | runtime flag `REACT_APP_BAILEY_STABLE_CONVERSATIONS` (opt-in) exposed as `baileyStableConversations: boolean` | modify (Task 4, PR B); the context value is also built by hand in `BaileyChatContainer.test.tsx:35-45` and `useBaileyChatTransport.test.tsx:20-30`, update those fixtures |
| `src/api/baseApi.ts` | unchanged (`buildHeaders` stays `protected`) | none |
| `UserContext.ts`, `src/constants/baileyConstants.ts`, `src/pages/BaileyAIPage.tsx` | unchanged | none |

## Interfaces

### Consumed from `@icanbwell/baileyai-chat-ui` (names per the spec and the library plan, Tasks 1-5, 13-15; confirm against the real release in Task 1)

```ts
export interface BaileyClientOptions {
    baseUrl: string;                                       // API root including /bailey/v1 (library plan Q5: confirm against this host's REACT_APP_BAILEY_URL)
    getHeaders: () => Promise<Record<string, string>>;
    fetch?: typeof fetch;
    onAuthError?: (error: BaileyApiError) => void;         // fires once on 401/403; error.status carries the status
    requestTimeoutMs?: number;                             // default 30_000 (non-stream calls)
    idleTimeoutMs?: number;                                // default 150_000 (stream idle gap, not a total timeout)
    conversationVia?: 'header' | 'body';                   // default 'header'; this host keeps the default
}
export interface BaileyClient extends BaileyChatTransport {} // plus conversation/feedback calls this host does not use
export function createBaileyClient(options: BaileyClientOptions): BaileyClient;

// useBaileyChat config: these are top-level options (not nested), all optional. The library never mints an id.
//   conversationId?: string          // seed to resume; this host passes none
//   storage?: BaileyConversationStorage | false   // default: sessionStorage per tab; `false` disables persistence (D3)
//   storageKey?: string              // default 'baileyai-chat-ui:conversation'; not used with storage:false
//   sub?: string                     // optional; only keys/validates a STORED id; this host passes none
//   sendFullTranscript?: boolean     // true => full transcript every turn and never the id (D2 override)
//   onStorageError?: (error, operation) => void                          // not used (storage is false)
//   onContextLoss?: (info: { sentId: string; reportedId?: string; reason: 'id' | 'history' }) => void
// useBaileyChat result gains: conversationId: string | undefined; persistence: 'ok' | 'degraded' | 'off';
//   contextLost: boolean (true until the next turn after a context loss); historyStatus, loadConversation, loadEarlier, hasEarlier (not used here)
// The id comes from the response's X-Conversation-Id header (conversationVia 'header'; later the `conversation` body field, spec 6.7).
// Once held, and unless sendFullTranscript is true, only the newest user message is sent.
// BaileyChatPanel: `history?: { client }` (opt-in drawer), `onHistoryClick` (overrides it), `locale?: string`; this host passes none of them.
```

Existing, verified in installed 1.0.9 `dist/index.d.ts`: `BaileyChatTransport.streamChat(params: { model; instructions; input; tools; toolChoice?; signal; onChunk; onRequestId? }): Promise<{ status?: number; text: string; errorMessage?: string }>`; `UseBaileyChatConfig { transport; model; instructions; tools?; ... }`. The library adds optional `conversationId`, `onConversationId` (and `onMessageId`) to the same params (library Task 3), so `BaileyClient` still satisfies `BaileyChatTransport`.

Behavior per the spec and library plan, still to confirm against the release (each has a test in Tasks 1, 3 or 4): (a) `getHeaders` output is merged with the library's own request headers; the library plan says `Accept: text/event-stream` (this host sends `application/json, text/event-stream` today), so Task 3 asserts what the library sends and Task 5 confirms Bailey accepts it; (b) the client calls `onRequestId` from `X-Request-Id` (the trace panel uses it); (c) a non-2xx answer returns `{ status, text }` with the raw body and does not throw; a failure to get any response (`fetch` rejects, `getHeaders` throws) resolves (does not reject) with `{ status: undefined, errorMessage: 'Request failed', errorKind: 'network' }` (verified in 1.0.18), so the CORS/DNS reason text this host surfaces today in `errorMessage` is not in the message; the original error is carried as `errorCause` on the result with `errorKind: 'network'` (released in 1.0.18; Task 1 confirms) and this host does not display it (D5; behavior change, see Task 3); (d) a caller abort rejects with `BaileyApiError{kind:'aborted'}` and the hook handles it; the plan no longer assumes a raw `AbortError`; (e) a mid-stream reader failure resolves with `interrupted: true` and is never treated as a complete answer (verified in 1.0.18), so the partial text is not returned as an answer (this differs from today, where `streamRequest` returns the partial text); (f) not stated in the spec: whether the client refuses to send to another origin; unchanged from the earlier plan, drop it from the confirmed list if the library offers no way to test it; (g) with `storage: false` nothing is written to browser storage; (h) with `sendFullTranscript: true` the whole transcript is sent every turn and no id is sent; (i) with no id reported the library sends no `x-chat-id` and sends the full transcript; (j) the client never logs or writes bodies to the trace panel.

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

- [ ] **Step 1: Write the failing test** in `baileyClientContract.test.ts`: `exports createBaileyClient`, asserting `typeof createBaileyClient === 'function'`; `a client built from {baseUrl, getHeaders} exposes streamChat`, asserting `typeof client.streamChat === 'function'`; `calls onAuthError with the status on a 401 and a 403` (parameterized over `[401, 403]`, global `fetch` stubbed to return that status, asserts `onAuthError` called once with `expect.objectContaining({ status })`); `sends getHeaders output to baseUrl's origin` (fetch stub; asserts `new URL(fetchedUrl).origin === new URL(baseUrl).origin`, never a string prefix, since `https://bailey.example.com.evil.net` starts with `https://bailey.example.com`, and that the stubbed `Authorization` header is present); `refuses to send the token to a different origin` (item (f) in the behavior list, parameterized over a look-alike host `https://bailey.example.com.evil.net`, a scheme-relative `//evil.example.net/x`, and a different port; the client is driven so that its resolved request URL would leave `baseUrl`, e.g. a `baseUrl` with a userinfo or path-absolute trick, or a response redirect to another origin; asserts `fetch` is never called with an `Authorization` header for that origin, or the call rejects/returns an error status). If the library offers no way to produce such a URL, the origin guard is not confirmable here: drop (f) from the confirmed list and keep the Task 3 origin assertion and the Task 5 network-tab check as the only evidence. Today this guard lives in `BaseApi.streamRequest` (`src/api/baseApi.ts:165`) and Task 2 removes it from Bailey traffic. These tests confirm the items they name (and only those); fix the plan's interface block if the real signature differs. Also assert the `baseUrl` convention: the library plan assumes `baseUrl` is the API root including `/bailey/v1` and appends `/responses` (its open question Q5), while this host's `REACT_APP_BAILEY_URL` is the origin only; the Task 1 test pins the final request URL for a given `baseUrl`, so Task 3 passes the right value.
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
- Modify: `src/components/BaileyChatContainer.tsx` and `src/components/BaileyChatContainer.test.tsx` (pass top-level `storage: false, sendFullTranscript: true`)

**Interfaces:**
- Consumes: `createBaileyClient` (Task 1), `BaileyApi.getAuthHeaders` (Task 2), `EnvContext.baileyUrl`.
- Produces: `BaileyChatContainer` passes `storage: false` and `sendFullTranscript: true` to `useBaileyChat` as top-level options (Task 4 changes the second value); `useBaileyChatTransport(): BaileyChatTransport`, referentially stable across renders while `baileyUrl` is unchanged. It no longer reads `UserContext` or takes `setUserDetails`: the library never calls `BaseApi`, so no code path reaches `logout`.

- [ ] **Step 1: Write the failing tests** (the file mocks `../api/baileyApi` today; keep mocking only at external boundaries: stub global `fetch` and `localStorage` instead, so the real `BaileyApi` runs; mock `../utils/authUrlProvider` as in `src/api/baseApi.test.ts:3-9` whenever a test sets `localStorage.identityProvider`, including the 401 test below, whose spies are the `logout` and `removeAuthData` mocks from `../utils/auth.utils` as well as `setUserDetails`):
  - `is referentially stable across re-renders when baileyUrl is unchanged` (existing, keep).
  - `creates a new transport when baileyUrl changes`.
  - `getHeaders reads the current token on every call` (Review Focus 3): send, change the stored token, send again, assert the second request's `Authorization` is the new token.
  - `does not log out or clear the session when Bailey answers 401 or 403` (Review Focus 1; invariant 6; parameterized over `[401, 403]`): `UserContext.setUserDetails` is a spy; fetch returns the status; after `streamChat` resolves, `setUserDetails` not called, `localStorage.getItem('jwt')` and `identityProvider` unchanged, `window.location.replace` not called, and the returned `status` equals the response status so the chat can show an error.
  - `surfaces the response body and the status of a non-2xx answer` (assertion on the `streamChat` result `{ status, text }`; confirms item (c)).
  - `reports x-request-id through onRequestId` (confirms item (b)).
  - `rejects when the signal aborts and the chat treats it as a stop, not an error` (item (d); the library rejects with `BaileyApiError{kind:'aborted'}`, not a raw `AbortError`; drive it through the real `useBaileyChat` and assert status returns to idle with no error banner).
  - `sends the chat request to /bailey/v1/responses` (item (a), Global Constraint 'no change to the request shape'): fetch stub; asserts method `POST`, `new URL(url).origin === 'https://bailey.example.com'` and `pathname === '/bailey/v1/responses'` (so the `baseUrl` given to the library is `<REACT_APP_BAILEY_URL>/bailey/v1`, not the bare origin), and `JSON.parse(body)` deep-equals `{ model, instructions, input, stream: true, tools }` (no `tool_choice`, no `conversation` key).
  - `sends one Content-Type and the library's Accept` (item (a)): asserts exactly one `content-type` entry (case-insensitive, `application/json`), asserts `accept` equals whatever the release sends (the library plan says `text/event-stream`; today this host sends `application/json, text/event-stream`), and the bearer token and `Origin-Service: fhir-ui` still present. Task 5 confirms Bailey streams with that `Accept`.
  - `streams decoded text to onChunk` (one call per network chunk).
  - `reassembles a multi-byte character split across chunks` (invariant 11; a body whose chunk boundary splits one 3-byte character; concatenated `onChunk` text equals the original).
  - `flushes a trailing partial character` (stream ending mid-character; no bytes silently dropped, per the existing `baileyApi.test.ts:134` behavior).
  - `rejects, and does not report a finished answer, when the stream drops mid-body` (item (e); a `ReadableStream` that errors after one chunk; `onChunk` was called once, `streamChat` rejects with `BaileyApiError{kind:'network'}`, the chat shows its error state with copy chosen from `kind`, and no body text, `setUserDetails` not called). Behavior change from today, where `streamRequest` returns the partial text.
  - `a fetch failure resolves with errorKind network and the chat shows host copy chosen from errorKind` (item (c), network half; `fetch` rejects with `TypeError('Failed to fetch')`; the result has `status: undefined`, `errorKind: 'network'`, `errorCause` is the original `TypeError`, `errorMessage` is the host copy, and the chat error text is the copy mapped from `kind`/status, not `cause.message`). Behavior change from today, where `errorMessage` carries the CORS/DNS reason into the chat; record it in the PR description of PR A (decided, D5). Also: `a request timeout rejects with kind timeout and carries cause` (same assertions for kind `'timeout'`); `chat error copy is chosen from kind and status only` (parameterized over kinds `network`, `timeout` and statuses such as 500; the rendered text never includes `cause.message`, the request URL or the `sub`); `diagnostic logging, if any, contains only kind, status and cause` (spy on `console`; assert no call includes the request URL or a header value). Browsers do not expose whether a failed `fetch` was CORS, DNS or offline (every case is a generic `TypeError`), so the old reason text could not distinguish those either; `cause` keeps the same limited detail, not more.
  - Container (`BaileyChatContainer.test.tsx`, which already records the `useBaileyChat` config): `pins storage false and sendFullTranscript true` -> config has `storage === false` and `sendFullTranscript === true` and no `sub`, `conversationId`, `storageKey` or `onStorageError`, so PR A is behavior-neutral even when the backend starts reporting an id; `offers no history entry` -> the rendered panel gets neither `history` nor `onHistoryClick`, so no "Chat history" menu item appears.
  - `reports persistence off and no context loss` (real library hook, stubbed fetch that reports an id): `persistence === 'off'`, `contextLost === false`, `onContextLoss` not called, and `onStorageError` never fires.
  - `does not persist the conversation id` (Review Focus 5; real library hook, fetch stub whose response carries `X-Conversation-Id: user-1:chat-0123abcd`): after a send, `sessionStorage.length === 0` and `localStorage` holds no key or value containing `chat-0123abcd`.
  - `sends the full transcript each turn even after the server reports an id` (Review Focus 4): two sends; the second request body's `input` contains both user messages and the first assistant reply; no `x-chat-id` header on either request.
  - `sends only to baileyUrl's origin`: for every fetch call in this file, `new URL(url).origin === new URL('https://bailey.example.com').origin` (origin comparison, never `startsWith`). The refusal case is covered in Task 1.
- [ ] **Step 2: Run** `yarn test src/hooks/useBaileyChatTransport.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement** `useBaileyChatTransport` with `useMemo` keyed on `[baileyUrl]`: one `BaileyApi` (constructed with `fhirUrl: baileyUrl`, `setUserDetails: undefined`), `createBaileyClient({ baseUrl: `${baileyUrl.replace(/\/+$/, '')}/bailey/v1`, getHeaders: async () => api.getAuthHeaders(), onAuthError: () => undefined })` (the old transport posted to `/bailey/v1/responses` under the `baileyUrl` origin; the library appends `/responses` to `baseUrl`, so `baseUrl` must carry `/bailey/v1`; confirm against the release per library plan Q5). Move the "why a Bailey 401 must not log out" comment from the deleted `handleUnauthorized` onto `onAuthError`. If an asserted item in Step 1 fails because the library differs from the spec, stop and raise it with the library owner rather than patching around it in the host.
- [ ] **Step 4: Run** `yarn test src/hooks/useBaileyChatTransport.test.tsx src/api/baileyApi.test.ts src/components/BaileyChatContainer.test.tsx`, then `yarn lint && yarn tsc --noEmit && yarn test && yarn build`. Expected: all PASS. `BaileyChatContainer.test.tsx` keeps its existing two tests and gains the one above.
- [ ] **Step 5: Commit** (Tasks 2 and 3 together)

```bash
git add src/api/baileyApi.ts src/api/baileyApi.test.ts src/hooks/useBaileyChatTransport.ts src/hooks/useBaileyChatTransport.test.tsx src/components/BaileyChatContainer.tsx src/components/BaileyChatContainer.test.tsx
git commit -m "BAI-1237 Use the library Bailey client for chat transport, keep Bailey 401 from logging out"
```

### Task 4 (PR B, behind a runtime flag): Stable server-issued conversation per chat

Do not start until the dependencies marked "Task 4" in "Dependencies on other work" are deployed to the target environment, and the library release has passed its own release gates (send-only-newest tests; baileyai #545 item 1 and CORS `expose_headers` deployed in every environment the first adopters run in; persistence on in the environment). Confirm the option names in Task 1. No `sub` is read or passed; no client-side id is minted; `conversationVia` stays `'header'`.

**Files:**
- Modify: `src/context/EnvironmentContext.ts` (+ `EnvironmentContext.test.ts`), `.env.example`, `docker-compose.yml`
- Modify: `src/components/BaileyChatContainer.tsx`, `src/components/BaileyChatContainer.test.tsx`, `src/hooks/useBaileyChatTransport.test.tsx` (fixtures only)

**Interfaces:**
- Consumes: the `useBaileyChat` options `storage`, `sendFullTranscript`, `onContextLoss` and the result fields `conversationId`, `persistence`, `contextLost` (section "Interfaces"), `baileyEnabled`-style flag parsing already in `EnvironmentContext.ts` (`isTrue`).
- Produces: `EnvContext.baileyStableConversations: boolean` (default `false`, opt-in; read through `APP_ENV` so it can be set at container start per `docs/runtime-environment-config.md`); `BaileyChatContainer` passes `storage: false` and `sendFullTranscript: !baileyStableConversations`, plus an `onContextLoss` handler that does not log or store `sentId`/`reportedId` (they embed the `sub`). When `contextLost` is true the host shows nothing and logs nothing (D6, decided); the library already falls back to the full transcript on the next turn. This host has no telemetry hook (D7), so the handler is a no-op; `onStorageError` is not passed because `storage` is `false`.

- [ ] **Step 1: Write the failing tests**:
  - `EnvironmentContext.test.ts`: `REACT_APP_BAILEY_STABLE_CONVERSATIONS $flagLabel -> baileyStableConversations $expected` (parameterized over unset, empty, `'true'`, `'false'`; unset and empty are `false`, unlike `REACT_APP_ENABLE_BAILEY` which defaults on).
  - Container: `sends the full transcript when the flag is off` -> config `sendFullTranscript === true`; `lets the library send only the newest message when the flag is on` -> `false`; both keep `storage === false`.
  - Real hook, stubbed fetch reporting `X-Conversation-Id`, flag on: `sends only the newest message once an id is held` (second request body `input` has one user message; the first request carried no `x-chat-id`); `New chat drops the held id` (after `newChat()` the next request again carries the full transcript of the new chat, a single message, and no id); `does not drop context when no conversation id is reported` (Review Focus 6; response without the header: no id is held, every request still contains the whole transcript and no `x-chat-id`, `contextLost` stays false because no id was sent); `falls back to the full transcript and signals contextLost when the reported id is missing or changes` (second turn sent a held id and the stubbed response reports none, or a different one: `onContextLoss` called once with the sent and reported ids, `contextLost === true`, the third request carries the whole transcript and no `x-chat-id`, `contextLost` clears after that turn; the host handler is a no-op: nothing is written to the console, storage or the DOM, and no notice renders).
  - `never sends an id this host did not receive`: no request in any test carries `x-chat-id` before a response reported one, and `sendFullTranscript: true` never sends one even after a response reported one; no test fixture or handler logs an id.
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
- [ ] **Step 3 (PR B only, in an environment with persistence on, #545 and `expose_headers` deployed, flag set to `true`)**: after a three-turn chat, the caller's conversation list in the backend shows one conversation with 3 turns, not three; the browser's network tab shows `X-Conversation-Id` readable on the response and later requests sending only the newest message; the model still answers using earlier turns; after reload `sessionStorage` has no conversation key. If the list shows three, the id is not reaching the browser (CORS or #545): record it and leave the flag off. Also confirm that the persisted message count grows by two per turn (one user, one assistant), not by the transcript length, and that persistence is on in that environment (the conversation routes return 503 when it is off).
- [ ] **Step 4: Release.** Merge after CI is green (`lint`, `test`, `Check Commit Message`). Tag `fhir-server-ui`; deploy via `bwell-fhir-server-ui` workflows dev, staging, prod in order (see "Sibling repo" below). Run PR A and PR B as separate tags.
- [ ] **Step 5: Rollback.** Revert the PR and cut a new tag, or pin `@icanbwell/baileyai-chat-ui` back to `^1.0.9` with the revert. Fast disable without a rebuild: `REACT_APP_ENABLE_BAILEY=false` (the opt-out kill switch in `EnvironmentContext.ts`; runtime-configurable per `docs/runtime-environment-config.md`) hides Bailey entirely. PR B alone is turned off at runtime by setting `REACT_APP_BAILEY_STABLE_CONVERSATIONS=false` (or unsetting it), which restores `sendFullTranscript: true` with no rebuild; the backend keeps whatever conversations it already stored.

## Sibling repo: `~/git/bwell-fhir-server-ui`

Verified: it is a private deployment wrapper for this repo (README: "manages JFrog-resolved dependencies and deployment workflows"). It has no `src/`; its `Dockerfile` builds `../fhir-server-ui` at a tag, and takes `package.json`, `yarn.lock` and `.yarnrc.yml` from itself. Its `package.json` and `package.original.json` both list `@icanbwell/baileyai-chat-ui: ^1.0.9` only because they are copies of this repo's `package.json` (the only differences are rootio resolutions); there is no code usage, which is why none was found. The README's drift workflow opens a PR that copies this repo's `package.json`/`yarn.lock` after a new tag and blocks deployment until merged. This repo itself depends only on the public npm registry; that wrapper's registry setup is outside this plan and this repo must not depend on it.

**No manual change is needed there for this adoption.** Expected follow-ups, not part of this plan's PRs:

1. After Task 1 merges and a tag is cut, the drift PR in `bwell-fhir-server-ui` carries the bumped dependency. Re-run `make rootIOPatch` afterwards, as its README says, since the drift PR reverts rootio changes.
2. The wrapper's own dependency resolution must be able to install `<RELEASE>` or its `yarn install --immutable` fails; that is the wrapper owners' check before tagging, not something this repo's code or `package.json` encodes.
3. CSP: `docker-entrypoint.d/security.conf` `connect-src` already allows `https://*.bwell.zone` and `https://*.icanbwell.com`, which covers `baileyai.<env>.bwell.zone`; no change for the same-origin-as-today Bailey URL. The CSP is Report-Only.

Do not write a plan file in that repo.

## Rollout summary

| Step | What | Gate |
|---|---|---|
| 1 | Library release with the client | library PR #54 implemented, its release gates met, and published to public npm |
| 2 | PR A (Tasks 1-3, 5) to dev, staging, prod | Task 5 steps 1-2 pass |
| 3 | PR B (Task 4, 5), flag off by default, turned on per environment | baileyai #545 item 1 and CORS `expose_headers` deployed there; backend persistence on there; the library's send-only-newest tests pass; Task 5 step 3 passes |

## Dependencies on other work

| Item | Owner | Needed by | If not available |
|---|---|---|---|
| Library release exporting `createBaileyClient` with `getHeaders`, `onAuthError` (library plan Tasks 1-3) | baileyai-chat-ui (PR #54 design, implementation PRs under BAI-1242) | Task 1 | Stay at Tier 0 |
| Library server-issued-id handling and options (`storage`, `sendFullTranscript`, `conversationId` seed, optional `sub`; failure signals `persistence`, `onStorageError`, `contextLost`, `onContextLoss`; library plan Tasks 4-5), including the library's own release gates | baileyai-chat-ui | Tasks 3-4 | Skip PR B; PR A needs `storage: false` accepted |
| baileyai #545 item 1: always return `X-Conversation-Id` with the id actually used, derived once per request, including on streams | baileyai | Task 4 | Skip PR B (the library never learns the id) |
| CORS `expose_headers` for `X-Conversation-Id` and `X-Message-Id` (`70a9326` on baileyai #541, not merged on `main`) | baileyai | Task 4 | Skip PR B (the browser cannot read the header) |
| Backend persistence on in the target environment (D2: host config, no probe) | platform / baileyai config | Task 4 | Leave the flag off there |
| Ordering (persist-after-stream): the library's own composer cannot send a follow-up before the turn is committed, because the server persists after the last chunk and `createBaileyClient.streamChat` resolves only after the body closes (spec section 8, verified 2026-10-22 in `language-model-common`, `baileyai` and the library branch `IQ-BAI-1242`); remaining cases are a second tab or client using the same id, and a client disconnect before the post steps run | baileyai-chat-ui | Task 4 | Acceptable for this host (one chat per tab, no resume); not applicable to a custom transport |
| Per-turn history signal (BAI-1263, spec 6.8, library Task 15; needs `baileyai` and `language-model-common` releases) | baileyai, language-model-common, baileyai-chat-ui | not required | Until deployed and consumed, a silent history-load failure under an unchanged id is an accepted residual risk (owner Imran Qureshi); enable the flag knowing this, or wait |
| `conversation` request/response body field (spec 6.7, BAI-1242) | baileyai, language-model-common, baileyai-chat-ui | not required | Host stays on `conversationVia: 'header'`; revisit as a separate change once the backend is deployed in every environment this host runs in |
| `<RELEASE>` published to public npm (1.0.18, done 2026-10-23) | baileyai-chat-ui | Task 1 | Task 1 blocked |

## Open questions to resolve before executing

Resolved by the owner and applied above (questions 7-9 below were resolved on 2026-10-23): ids are server-issued (D1); persistence-off is host config with no probe (D2); the library persists the held id by default and this host opts out (D3); the default history drawer is in the library v1, opt-in, and not used here (D4); no Tech Design Review and no EA exception is filed (D9, decided 2026-10-22 by Imran Qureshi; EA agrees per Imran Qureshi, no approval artifact is linked), so this plan does not wait on either.

1. **Confirm that this host should keep `storage: false`** (no resume across reload, matching the 2026-08-11 design). If persistence is wanted instead, drop `storage: false` (the library then persists the held id in `sessionStorage` per tab), clear the stored id on logout through the same storage (this host has `logout` in `src/utils/auth.utils.ts` and `removeAuthData`; the library has no logout hook), and decide whether to pass `sub` and `storageKey` so the library can key and validate the stored id. This plan chose opt-out because an internal admin tool gains nothing from resuming old conversations.
2. Which environments have backend persistence on? Needed to know where the Task 4 flag can be `true`.
3. Resolved in the spec for the library's own composer (persist-after-stream, see the dependencies table): the library settles a turn only after the body closes. Nothing to decide here unless a custom transport is introduced.
4. Do the released option and result names match section "Interfaces" (top-level `storage: false`, `sendFullTranscript`, `onContextLoss`, `persistence`, `contextLost`), is `baseUrl` the API root including `/bailey/v1` (library plan Q5), and which `Accept` header does the client send? Replace the names after reading the release.
5. Exact library release number: resolved, 1.0.18 (replace `<RELEASE>`).
6. Does the owner still want PR B at all for this tool? Value is cleaner stored conversations and a prerequisite for later history; if not wanted, stop after PR A.
7. **Resolved (2026-10-23, Imran Qureshi, D5):** keep the underlying reason as `BaileyApiError.cause`; chat error copy comes from `kind` and status; `cause` is for diagnostics only. See Task 3.
8. **Resolved (2026-10-23, Imran Qureshi, D6):** context loss is silent: no notice, nothing logged; rely on the automatic full-transcript fallback. Telemetry (D7): no telemetry hook exists in this host, so `onStorageError`/`onContextLoss` are no-ops (counter only if a hook is added later).
9. **Resolved (2026-10-23, Imran Qureshi, D8):** the library release does not wait for BAI-1263; the residual risk stands until it is deployed.

## Self-review

- **Spec coverage:** spec section 6.1 (client, `getHeaders`, `onAuthError`) -> Tasks 1 and 3; 6.2 (id, storage; revised by D1-D3 to server-issued ids, default persistence, send-only-newest) -> Tasks 3 and 4; 6.3 history UI (in library v1, opt-in, D4) and 6.4 feedback -> not adopted by this host (Tier 2); 6.2 "Failure signals" -> Review Focus 4 and Task 4; 6.7 `conversation` body field and 6.8 per-turn history signal -> not adopted here, tracked in the dependencies table; 6.5 "stays in hosts" (auth, base URL, flags) -> `BaileyApi.getAuthHeaders`, `baileyUrl`, `REACT_APP_ENABLE_BAILEY` untouched; section 10 success criterion for this host ("one multi-turn conversation per chat, confirmed in the backend's conversation list") -> Task 5 step 3; "hosts that opt into nothing see no change" -> Task 3 pins `storage: false` and `sendFullTranscript: true`, so a library default that persists or sends only the newest message cannot change this host's behavior.
- **Step scan:** every test names its assertions; implementations are signatures plus one-line approach. No placeholder logic remains except `<RELEASE>`, which Task 1 resolves.
- **Type consistency:** `getAuthHeaders`, `useBaileyChatTransport`, `baileyStableConversations`, `storage`/`sendFullTranscript` are used with the same names in every task.
- **Review Focus:** six items, each tied to a named test above (item 4 now also covers the library's context-loss signal).
- **Proportion:** small source changes (`baileyApi.ts`, the transport hook, the container, one env flag); the document is mostly decisions and tests. `getSubject`/`useBaileySubject` from the earlier draft are gone (D1).
- **Known unverified:** library behavior against a real release (1.0.18 is published; parts of this plan still quote the spec and library plan at `d043cb0`, and PR #308 is the verified record of what the release does), the library's final option names and `baseUrl` convention, the `Accept` header the client sends, whether any published 1.0.x (public npm lists up to 1.0.16) contains the client, backend persistence per environment, whether the deployed gateway or ingress buffers streams in each environment this host runs in (spec open question 4), and whether any environment already has baileyai #545 item 1 and CORS `expose_headers` deployed.
