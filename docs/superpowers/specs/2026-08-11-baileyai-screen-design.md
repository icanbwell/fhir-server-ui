# Bailey AI Chat Screen — Design

**Date:** 2026-08-11
**Status:** Approved for planning

## Summary

Add a new `/bailey` screen to fhir-server-ui: a chat interface to the Bailey AI
assistant, wired so Bailey can use the new fhir-server MCP endpoint
([fhir-server PR #2482](https://github.com/icanbwell/fhir-server/pull/2482))
as a tool source for FHIR data queries.

## Background / research findings

- `~/git/baileyai-skills-service` has no screen for registering/managing MCP
  server *connections* — that premise (from the original ask) didn't hold up.
  What it does have is a chat panel (`frontend/src/components/chat/`:
  `ChatTranscript`, `ChatComposer`, `useChatStream`, `ChatTracePanel`) embedded
  in its skill-authoring UI, calling its own backend proxy
  `POST /api/ui/responses`.
- That proxy is a thin wrapper: `OPEN_RESPONSES_URL` resolves to baileyai
  itself (`http://baileyai:5000/bailey/v1/responses` in dev/docker-compose;
  `https://baileyai.<env>.bwell.zone/bailey/v1/responses` in deployed
  environments). baileyai's `api_router.py` implements this endpoint directly
  as an OpenAI-Responses-API-compatible route, authenticated via the same
  `Authorization: Bearer` + `AUTH_PROVIDERS` issuer-trust pattern used
  elsewhere at b.well. The proxy's only value-add is defaulting `model` and
  `tools` when the caller omits them — not required if we supply both
  ourselves.
- baileyai supports two independent ways to register an MCP server:
  1. **Static, deploy-time config** (`.mcp.json` / `MCP_FHIR_URL` env var) —
     admin-owned, affects every Bailey consumer. Today this already has a
     "fhir-server" entry, but it points at a legacy, separate
     `mcp-fhir-agent` service, not the new fhir-server `/mcp` endpoint.
  2. **Dynamic, per-request `tools` array** in the chat payload itself
     (`tools: [{type: "mcp", server_url, server_label, allowed_tools}]`),
     gated by `REQUEST_TOOLS_ENABLED` (already `true` in baileyai's base
     `docker-compose.yml`).
  Path 2 lets fhir-server-ui introduce the new MCP endpoint to Bailey without
  any baileyai deployment change — this is the chosen integration point.
- fhir-server-ui is a pure static SPA (Vite, no backend of its own) that
  already calls external services directly from the browser using
  `REACT_APP_*_URL` env vars and a bearer token acquired at login
  (`cognito`/`okta`/`bwellapp`/`clientcredentials` — see
  `REACT_APP_AUTH_PROVIDERS`). The existing `/connections` and `/api-console`
  screens are the closest structural precedents.
- The new fhir-server `/mcp` endpoint sits behind fhir-server's own existing
  passport auth — the same auth fhir-server-ui's token already satisfies for
  its other FHIR REST calls. Pass-through auth from baileyai to this new
  endpoint should work without server-side reconciliation, unlike the
  documented Keycloak/Okta-Cognito issuer mismatch that affects the legacy
  `mcp-fhir-agent` path.

## Approach

Call baileyai directly from the browser (`POST <REACT_APP_BAILEY_URL>/bailey/v1/responses`),
reusing fhir-server-ui's existing login token, and declare the fhir-server MCP
tool inline on every request:

```json
{
  "model": "<REACT_APP_BAILEY_MODEL>",
  "instructions": "<default system prompt, see baileyConstants.ts>",
  "input": [{ "role": "user", "content": "..." }, ...],
  "stream": true,
  "tools": [
    {
      "type": "mcp",
      "server_url": "<fhirUrl>/mcp",
      "server_label": "fhir-server",
      "allowed_tools": ["search_patient", "search_observation", "search_encounter", "fhir_search", "..."]
    }
  ]
}
```

Considered and rejected:
- **Routing through baileyai-skills-service's `/api/ui/responses` proxy** —
  adds a third service to the request path for no benefit once we supply
  `model`/`tools` ourselves; its default tool allowlist is tuned for skill
  authoring, not FHIR queries.
- **Repointing baileyai's static `.mcp.json`/`MCP_FHIR_URL` globally** — would
  also upgrade every other Bailey surface to the new endpoint, which is
  valuable but is a separate, broader change that shouldn't block or be
  bundled with this screen. Tracked as a follow-up (see below), not a
  dependency.

## Architecture

- New route `/bailey` in `src/routes/fhirRoutes.tsx`, lazy-loaded like the
  other pages; nav link added to `Header`.
- New env vars in `.env` / `.env.example`, read via `EnvironmentContext`:
  - `REACT_APP_BAILEY_URL` — baileyai base URL (e.g. `https://baileyai.dev.bwell.zone`).
  - `REACT_APP_BAILEY_MODEL` — model name to send (required since we bypass
    the skills-service proxy's default-injection); ships with a sensible
    default.
- No new env var for the MCP server URL — derived as `${fhirUrl}/mcp` from the
  `fhirUrl` already in `EnvironmentContext`.
- No new backend. fhir-server-ui remains a pure static SPA.

## Components

New files, following the existing `pages/` + `components/` + `hooks/` +
`api/` + `constants/` + `types/` split:

- **`pages/BaileyAIPage.tsx`** — `Header`/`Footer` shell; renders a
  config-missing message if `REACT_APP_BAILEY_URL` is unset (mirrors
  `ConnectionConsolePage`'s `configMissing` pattern); otherwise renders
  `BaileyChatPanel`.
- **`components/BaileyChatPanel.tsx`** — MUI-based message list + composer:
  - User/assistant bubbles; assistant content rendered as markdown (new dep
    `react-markdown`, sanitized via the existing `dompurify` dependency).
  - Streaming/blinking-cursor indicator while a response is in flight.
  - Inline, collapsed-by-default tool-call chips (e.g.
    "🔧 search_patient(family=Smith)") for `mcp_call` output items — enough
    to show Bailey actually queried FHIR data, without porting the full
    `ChatTracePanel` from baileyai-skills-service.
  - No session/thread list, no artifact-save UX — both are authoring-specific
    in the upstream UI and don't apply here. Conversation is in-memory only,
    matching baileyai-skills-service's own stateless-per-mount model (full
    history resent each turn).
- **`hooks/useBaileyChat.ts`** — state machine: holds `messages`, sends full
  history as `input` each turn, parses the SSE stream
  (`response.output_text.delta`, `response.output_item.added|done`,
  `task.progress`, `response.completed`, `error`, `[DONE]`); exposes `send`,
  `stop`, `messages`, `status`.
- **`api/baileyApi.ts`** — builds the request body shown above, attaches
  `Authorization: Bearer <token>`, POSTs, returns the stream for the hook to
  parse.
- **`constants/baileyConstants.ts`** — default system `instructions` string
  and default `allowed_tools` (read-only FHIR search tools only — no writes).
- **`types/baileyChat.ts`** — `BaileyMessage`, `BaileyStreamEvent`
  discriminated union for the SSE frame shapes.

## Data flow

User types → `useBaileyChat.send` appends a user message → `baileyApi`
streams the request → SSE parsed frame-by-frame → `response.output_text.delta`
frames append to the in-progress assistant message; `response.output_item.done`
frames with `type: "mcp_call"` render a tool-call chip; `response.completed`
finalizes the message; `[DONE]` closes the stream. Nothing is persisted;
navigating away loses the conversation.

## Error handling

Non-2xx responses or a stream `error` frame surface an inline error banner
with a "Retry last message" action (same shape as `ConnectionConsolePage`'s
`error` + `Retry` button). A 401/403 is shown as a generic "Bailey isn't
reachable with your current login" message — which fhir-server-ui auth
providers produce a token baileyai's `AUTH_PROVIDERS` will trust can't be
determined client-side in advance, so we let the request fail rather than
pre-gating on login provider.

## Testing

- Unit tests for `useBaileyChat`'s SSE-frame reducer (feed canned frame
  sequences, assert final message state).
- Unit tests for `baileyApi`'s request-body construction (assert the `tools`/
  `server_url` shape).
- No new E2E/Playwright coverage in scope for this plan; a possible fast
  follow if UI test tooling is added to this screen later.

## Cross-repo dependency (baileyai) — tracked separately, not blocking

1. Verify `REQUEST_TOOLS_ENABLED=true` in each environment's Helm values
   (confirmed `true` in the base `docker-compose.yml`; per-environment Helm
   values not yet confirmed).
2. Verify baileyai's `AUTH_PROVIDERS` in each environment trusts the issuer of
   the token fhir-server-ui's active login provider produces; add if missing.
3. No fhir-server-side change expected: the new `/mcp` endpoint sits behind
   fhir-server's existing passport auth, which the token fhir-server-ui
   already uses against fhir-server today should satisfy.

## Follow-up (not part of this plan)

Repoint baileyai's static `.mcp.json` "fhir-server" entry / `MCP_FHIR_URL` to
the new fhir-server `/mcp` endpoint, so other Bailey surfaces (e.g.
skills-service authoring chat) also move off the legacy `mcp-fhir-agent`
service. Own PR, own testing, own timing — independent of this screen.
