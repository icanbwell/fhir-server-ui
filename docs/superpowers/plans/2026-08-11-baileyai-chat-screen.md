# Bailey AI Chat Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/bailey` screen to fhir-server-ui with a chat interface to the Bailey AI assistant, wired so Bailey can query FHIR data on this server via the new fhir-server MCP endpoint ([PR #2482](https://github.com/icanbwell/fhir-server/pull/2482)).

**Architecture:** fhir-server-ui stays a pure static SPA — the new screen calls baileyai's `POST /bailey/v1/responses` directly from the browser, reusing the same bearer token the app already holds from login. Every request declares the fhir-server MCP endpoint (`${fhirUrl}/mcp`) inline via the request's `tools` array, so no change to baileyai's deployment config is required for this feature to work.

**Tech Stack:** React 19 + TypeScript, Vite, MUI, react-router. New dependency: `react-markdown` (rendering assistant responses).

**Spec:** `docs/superpowers/specs/2026-08-11-baileyai-screen-design.md`

## Global Constraints

- No new backend — fhir-server-ui remains a pure static SPA calling external services directly from the browser, matching the existing `FhirApi`/`ConnectionFhirApi`/`TokenServiceApi` pattern.
- Reuse the session's existing bearer token for Bailey calls (no separate Bailey login flow).
- A 401/403 from Bailey must **not** log the user out of fhir-server-ui — it reflects a config mismatch between fhir-server-ui's token issuer and Bailey's `AUTH_PROVIDERS`, not an invalid fhir-server-ui session.
- No thread/session persistence — conversation lives in React state only, lost on navigation away, matching baileyai-skills-service's own chat model.
- No `allowed_tools` restriction is hard-coded into the MCP tool declaration — the fhir-server MCP endpoint's own tool registry is authoritative, and hard-coding a possibly-stale tool list here would silently drift from it.
- This repo uses Yarn (`packageManager: "yarn@4.14.1"` in `package.json`, `yarn.lock` present, no `package-lock.json`) — use `yarn`, not `npm`, for every command in this plan.
- This repo has **no test runner** (`package.json` has only `dev`/`build`/`preview`/`lint`). Per user decision, no test framework is being introduced by this plan — every task is verified via `yarn lint` and `yarn build` (which runs `tsc` via Vite), and the final task is verified manually by running the dev server and using the screen in a browser.
- Follow existing file organization: `pages/`, `components/`, `hooks/`, `api/`, `constants/`, `types/`, `utils/`.

---

### Task 1: Environment & context plumbing

**Files:**
- Modify: `.env.example`
- Modify: `docker-compose.yml:14-18`
- Modify: `src/context/EnvironmentContext.ts`

**Interfaces:**
- Produces: `EnvContext` gains `baileyUrl: string` and `baileyModel: string`, consumed by Task 3 (`baileyApi.ts`) and Task 4 (`useBaileyChat.ts`).

- [ ] **Step 1: Add the two new env vars to `.env.example`**

Insert after line 8 (`REACT_APP_TOKEN_SERVICE_URL='https://your-token-service.example.com/api/v1.0'`):

```
# Bailey AI base URL, used by the /bailey chat screen.
REACT_APP_BAILEY_URL='https://your-baileyai.example.com'
# Model id Bailey should use for chat responses on this screen.
REACT_APP_BAILEY_MODEL='REPLACE_WITH_REAL_MODEL_ID'
```

- [ ] **Step 2: Pass the two new env vars through in `docker-compose.yml`**

Replace lines 14-18:

```yaml
      # Set REACT_APP_FHIR_SERVER_URL and REACT_APP_TOKEN_SERVICE_URL in .env — no defaults
      # here so no internal hostname ends up committed to this tracked file.
      REACT_APP_FHIR_SERVER_URL: ${REACT_APP_FHIR_SERVER_URL}
      # Aperture Token Service (ATS) base URL, used by the /connections screens.
      REACT_APP_TOKEN_SERVICE_URL: ${REACT_APP_TOKEN_SERVICE_URL}
```

with:

```yaml
      # Set REACT_APP_FHIR_SERVER_URL and REACT_APP_TOKEN_SERVICE_URL in .env — no defaults
      # here so no internal hostname ends up committed to this tracked file.
      REACT_APP_FHIR_SERVER_URL: ${REACT_APP_FHIR_SERVER_URL}
      # Aperture Token Service (ATS) base URL, used by the /connections screens.
      REACT_APP_TOKEN_SERVICE_URL: ${REACT_APP_TOKEN_SERVICE_URL}
      # Set REACT_APP_BAILEY_URL and REACT_APP_BAILEY_MODEL in .env — no defaults here either.
      # Used by the /bailey chat screen.
      REACT_APP_BAILEY_URL: ${REACT_APP_BAILEY_URL}
      REACT_APP_BAILEY_MODEL: ${REACT_APP_BAILEY_MODEL}
```

- [ ] **Step 3: Extend `EnvironmentContext.ts`**

Current file:

```ts
import { createContext } from 'react';
import FhirApi from '../api/fhirApi';

let fhirServerVersion = 'null';
new FhirApi({ fhirUrl: import.meta.env.REACT_APP_FHIR_SERVER_URL, setUserDetails: undefined })
    .getVersion()
    .then((version: string) => (fhirServerVersion = version));

const EnvContext = createContext<{
    fhirUrl: string;
    AUTH_PROVIDERS: string;
    FHIR_APP_VERSION: string;
    AWS_REGION: string;
    getFhirServerVersion:() => string;
}>({
    fhirUrl: import.meta.env.REACT_APP_FHIR_SERVER_URL || '',
    AUTH_PROVIDERS: import.meta.env.REACT_APP_AUTH_PROVIDERS || '',
    FHIR_APP_VERSION: import.meta.env.REACT_APP_VERSION || 'null',
    AWS_REGION: import.meta.env.REACT_APP_AWS_REGION || '',
    getFhirServerVersion: () => fhirServerVersion,
});

export default EnvContext;
```

Replace the `createContext` call with:

```ts
const EnvContext = createContext<{
    fhirUrl: string;
    AUTH_PROVIDERS: string;
    FHIR_APP_VERSION: string;
    AWS_REGION: string;
    baileyUrl: string;
    baileyModel: string;
    getFhirServerVersion:() => string;
}>({
    fhirUrl: import.meta.env.REACT_APP_FHIR_SERVER_URL || '',
    AUTH_PROVIDERS: import.meta.env.REACT_APP_AUTH_PROVIDERS || '',
    FHIR_APP_VERSION: import.meta.env.REACT_APP_VERSION || 'null',
    AWS_REGION: import.meta.env.REACT_APP_AWS_REGION || '',
    baileyUrl: import.meta.env.REACT_APP_BAILEY_URL || '',
    baileyModel: import.meta.env.REACT_APP_BAILEY_MODEL || '',
    getFhirServerVersion: () => fhirServerVersion,
});

export default EnvContext;
```

(Only the `createContext` block changes — the `fhirServerVersion`/`FhirApi` lines above it are untouched.)

- [ ] **Step 4: Verify**

Run: `yarn lint && yarn build`
Expected: both succeed with no new errors/warnings beyond the pre-existing baseline.

- [ ] **Step 5: Commit**

```bash
git add .env.example docker-compose.yml src/context/EnvironmentContext.ts
git commit -m "Add Bailey AI env config to EnvironmentContext"
```

---

### Task 2: Types, constants, and SSE frame parser

**Files:**
- Create: `src/types/baileyChat.ts`
- Create: `src/constants/baileyConstants.ts`
- Create: `src/utils/baileySse.ts`

**Interfaces:**
- Produces: `BaileyMessage`, `BaileyToolCall`, `BaileyStreamEvent`, `BaileyOutputItem`, `BaileyChatInputMessage`, `BaileyMcpToolConfig` (types, consumed by Tasks 3–5); `BAILEY_SYSTEM_INSTRUCTIONS: string`, `BAILEY_MCP_SERVER_LABEL: string` (constants, consumed by Task 4); `parseSseFrames(buffer: string): { events: BaileyStreamEvent[]; remainder: string; done: boolean }` (consumed by Task 4).

- [ ] **Step 1: Write `src/types/baileyChat.ts`**

```ts
export interface BaileyChatInputMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface BaileyMcpToolConfig {
    type: 'mcp';
    server_url: string;
    server_label: string;
    // Deliberately no `allowed_tools` here — see baileyConstants.ts for why.
}

export interface BaileyOutputItem {
    type: 'function_call' | 'mcp_call';
    name?: string;
    arguments?: string;
    output?: string;
    is_error?: boolean;
    runtime_seconds?: number;
}

export type BaileyStreamEvent =
    | { type: 'response.output_text.delta'; delta: string }
    | { type: 'response.output_item.added'; item: BaileyOutputItem }
    | { type: 'response.output_item.done'; item: BaileyOutputItem }
    | { type: 'task.progress'; status: string; message?: string }
    | { type: 'response.completed' }
    | { type: 'error'; message: string };

export interface BaileyToolCall {
    name: string;
    arguments?: string;
    output?: string;
    isError?: boolean;
}

export interface BaileyMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    streaming?: boolean;
    toolCalls?: BaileyToolCall[];
}
```

- [ ] **Step 2: Write `src/constants/baileyConstants.ts`**

```ts
export const BAILEY_SYSTEM_INSTRUCTIONS =
    'You are Bailey, an AI assistant embedded in the FHIR Server admin UI. You can search FHIR ' +
    'resources on this server via your fhir-server MCP tools to answer questions about patients, ' +
    'encounters, observations, and other clinical data. Only use read/search tools — never attempt ' +
    'to create, update, or delete resources. If a request requires a write operation, explain that ' +
    "you can't perform it here and suggest using the API Console instead. Keep answers concise and " +
    'cite the specific resource IDs you used.';

export const BAILEY_MCP_SERVER_LABEL = 'fhir-server';
```

*(No `BAILEY_ALLOWED_TOOLS` list — the fhir-server MCP endpoint's tool registry is the source of truth for which tools exist; hard-coding a list here would drift from it as fhir-server's MCP tool set evolves. Omitting `allowed_tools` gives Bailey access to every tool the endpoint exposes.)*

- [ ] **Step 3: Write `src/utils/baileySse.ts`**

```ts
import { BaileyStreamEvent } from '../types/baileyChat';

export interface ParsedSseFrames {
    events: BaileyStreamEvent[];
    remainder: string;
    done: boolean;
}

// Bailey streams standard SSE: frames separated by a blank line, each frame made of an
// optional `event: <name>` line and one or more `data: <payload>` lines. The payload's own
// `type` field (not the SSE event name) discriminates BaileyStreamEvent — except `event: error`
// frames, whose payload may be plain text rather than JSON. `buffer` may end mid-frame (a
// network chunk boundary rarely lines up with an SSE frame boundary); the incomplete tail is
// returned as `remainder` for the caller to prepend to the next chunk.
export function parseSseFrames(buffer: string): ParsedSseFrames {
    const frames = buffer.split('\n\n');
    const remainder = frames.pop() ?? '';
    const events: BaileyStreamEvent[] = [];
    let done = false;

    for (const frame of frames) {
        const lines = frame.split('\n').filter((line) => line.length > 0);
        let eventName = 'message';
        const dataLines: string[] = [];

        for (const line of lines) {
            if (line.startsWith('event:')) {
                eventName = line.slice('event:'.length).trim();
            } else if (line.startsWith('data:')) {
                dataLines.push(line.slice('data:'.length).trim());
            }
        }

        if (dataLines.length === 0) {
            continue;
        }
        const data = dataLines.join('\n');
        if (data === '[DONE]') {
            done = true;
            continue;
        }

        let parsed: any;
        try {
            parsed = JSON.parse(data);
        } catch {
            parsed = undefined;
        }

        if (eventName === 'error') {
            events.push({ type: 'error', message: parsed?.message ?? data });
        } else if (parsed && typeof parsed.type === 'string') {
            events.push(parsed as BaileyStreamEvent);
        }
    }

    return { events, remainder, done };
}
```

- [ ] **Step 4: Verify**

Run: `yarn lint && yarn build`
Expected: both succeed. No behavior to eyeball yet — these are pure, uncalled units until Task 4 wires them in.

- [ ] **Step 5: Commit**

```bash
git add src/types/baileyChat.ts src/constants/baileyConstants.ts src/utils/baileySse.ts
git commit -m "Add Bailey chat types, constants, and SSE frame parser"
```

---

### Task 3: BaileyApi client

**Files:**
- Create: `src/api/baileyApi.ts`

**Interfaces:**
- Consumes: `BaseApi` (`src/api/baseApi.ts` — `streamRequest`, constructor `{ fhirUrl, setUserDetails }`); `HttpMethod` (`src/context/LastRequestContext.ts`); `BaileyChatInputMessage`, `BaileyMcpToolConfig` (`src/types/baileyChat.ts`, Task 2).
- Produces: `BaileyApi` class with `streamChat({ model, instructions, input, tools, signal, onChunk }): Promise<{ status: number | undefined }>`, consumed by Task 4.

- [ ] **Step 1: Write `src/api/baileyApi.ts`**

```ts
import BaseApi from './baseApi';
import { HttpMethod } from '../context/LastRequestContext';
import { BaileyChatInputMessage, BaileyMcpToolConfig } from '../types/baileyChat';

export interface StreamChatParams {
    model: string;
    instructions: string;
    input: BaileyChatInputMessage[];
    tools: BaileyMcpToolConfig[];
    signal?: AbortSignal;
    onChunk: (text: string) => void;
}

// Bailey validates the caller's bearer token against its own AUTH_PROVIDERS, which may not
// trust the same issuer fhir-server-ui's token came from — a config mismatch between two
// different services, not evidence this app's own session is invalid. Overriding
// handleUnauthorized to a no-op keeps a 401 from Bailey from logging the user out of
// fhir-server-ui, for the same reason ConnectionFhirApi avoids BaseApi's interceptor.
class BaileyApi extends BaseApi {
    protected async handleUnauthorized(_status: number | undefined): Promise<void> {
        // Intentionally does nothing — see class comment above.
    }

    async streamChat({
        model,
        instructions,
        input,
        tools,
        signal,
        onChunk,
    }: StreamChatParams): Promise<{ status: number | undefined }> {
        const decoder = new TextDecoder();
        const { status } = await this.streamRequest({
            method: 'POST' as HttpMethod,
            urlString: '/bailey/v1/responses',
            data: { model, instructions, input, stream: true, tools },
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream',
            },
            signal,
            onChunk: (chunk) => onChunk(decoder.decode(chunk, { stream: true })),
        });
        return { status };
    }
}

export default BaileyApi;
```

- [ ] **Step 2: Verify**

Run: `yarn lint && yarn build`
Expected: both succeed. `BaileyApi` isn't called from anywhere yet, so there's nothing to run manually.

- [ ] **Step 3: Commit**

```bash
git add src/api/baileyApi.ts
git commit -m "Add BaileyApi streaming chat client"
```

---

### Task 4: useBaileyChat hook

**Files:**
- Create: `src/hooks/useBaileyChat.ts`

**Interfaces:**
- Consumes: `EnvContext` (`src/context/EnvironmentContext.ts`, Task 1 — needs `baileyUrl`, `baileyModel`, `fhirUrl`); `UserContext` (`src/context/UserContext.ts` — needs `setUserDetails`); `BaileyApi` (`src/api/baileyApi.ts`, Task 3); `parseSseFrames` (`src/utils/baileySse.ts`, Task 2); `BAILEY_SYSTEM_INSTRUCTIONS`, `BAILEY_MCP_SERVER_LABEL` (`src/constants/baileyConstants.ts`, Task 2); `BaileyMessage`, `BaileyToolCall`, `BaileyStreamEvent` (`src/types/baileyChat.ts`, Task 2).
- Produces: `useBaileyChat(): { messages: BaileyMessage[]; status: 'idle' | 'streaming' | 'error'; error: string | null; send: (text: string) => void; stop: () => void; retryLast: () => void }`, consumed by Task 5.

- [ ] **Step 1: Write `src/hooks/useBaileyChat.ts`**

```ts
import { useCallback, useContext, useRef, useState } from 'react';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaileyApi from '../api/baileyApi';
import { parseSseFrames } from '../utils/baileySse';
import { BAILEY_MCP_SERVER_LABEL, BAILEY_SYSTEM_INSTRUCTIONS } from '../constants/baileyConstants';
import { BaileyMessage, BaileyStreamEvent, BaileyToolCall } from '../types/baileyChat';

export interface UseBaileyChatResult {
    messages: BaileyMessage[];
    status: 'idle' | 'streaming' | 'error';
    error: string | null;
    send: (text: string) => void;
    stop: () => void;
    retryLast: () => void;
}

const useBaileyChat = (): UseBaileyChatResult => {
    const { baileyUrl, baileyModel, fhirUrl } = useContext(EnvContext);
    const { setUserDetails } = useContext(UserContext);

    const [messages, setMessages] = useState<BaileyMessage[]>([]);
    const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const lastUserTextRef = useRef<string>('');

    const applyEvent = useCallback((assistantId: string, event: BaileyStreamEvent) => {
        if (event.type === 'response.output_text.delta') {
            setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.delta } : m))
            );
            return;
        }
        if (event.type === 'response.output_item.done' && (event.item.type === 'mcp_call' || event.item.type === 'function_call')) {
            const toolCall: BaileyToolCall = {
                name: event.item.name || 'unknown_tool',
                arguments: event.item.arguments,
                output: event.item.output,
                isError: event.item.is_error,
            };
            setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, toolCalls: [...(m.toolCalls || []), toolCall] } : m))
            );
        }
    }, []);

    const runTurn = useCallback(
        async (history: BaileyMessage[]) => {
            setStatus('streaming');
            setError(null);

            const assistantId = crypto.randomUUID();
            setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }]);

            const api = new BaileyApi({ fhirUrl: baileyUrl, setUserDetails });
            const controller = new AbortController();
            abortRef.current = controller;

            let buffer = '';
            let streamError: string | null = null;

            try {
                const { status: httpStatus } = await api.streamChat({
                    model: baileyModel,
                    instructions: BAILEY_SYSTEM_INSTRUCTIONS,
                    input: history.map((m) => ({ role: m.role, content: m.content })),
                    tools: [{ type: 'mcp', server_url: `${fhirUrl}/mcp`, server_label: BAILEY_MCP_SERVER_LABEL }],
                    signal: controller.signal,
                    onChunk: (chunkText) => {
                        buffer += chunkText;
                        const { events, remainder, done } = parseSseFrames(buffer);
                        buffer = remainder;
                        events.forEach((event) => {
                            if (event.type === 'error') {
                                streamError = event.message;
                                return;
                            }
                            applyEvent(assistantId, event);
                        });
                        if (done) {
                            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
                        }
                    },
                });

                if (streamError) {
                    setStatus('error');
                    setError(streamError);
                    return;
                }
                if (httpStatus === undefined || httpStatus >= 400) {
                    setStatus('error');
                    setError(
                        httpStatus === 401 || httpStatus === 403
                            ? "Bailey isn't reachable with your current login."
                            : `Bailey request failed (status ${httpStatus ?? 'network error'}).`
                    );
                    return;
                }
                setStatus('idle');
            } catch (err: any) {
                if (err?.name === 'AbortError') {
                    setStatus('idle');
                    return;
                }
                setStatus('error');
                setError(err?.message || 'Bailey request failed.');
            } finally {
                setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
            }
        },
        [baileyUrl, baileyModel, fhirUrl, setUserDetails, applyEvent]
    );

    const send = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed) {
                return;
            }
            lastUserTextRef.current = trimmed;
            setMessages((prev) => {
                const next: BaileyMessage[] = [...prev, { id: crypto.randomUUID(), role: 'user', content: trimmed }];
                runTurn(next);
                return next;
            });
        },
        [runTurn]
    );

    const stop = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    const retryLast = useCallback(() => {
        if (!lastUserTextRef.current) {
            return;
        }
        setMessages((prev) => {
            const last = prev[prev.length - 1];
            const trimmed = last && last.role === 'assistant' && last.content === '' ? prev.slice(0, -1) : prev;
            runTurn(trimmed);
            return trimmed;
        });
    }, [runTurn]);

    return { messages, status, error, send, stop, retryLast };
};

export default useBaileyChat;
```

- [ ] **Step 2: Verify**

Run: `yarn lint && yarn build`
Expected: both succeed. Not wired into any component yet, so nothing to exercise manually.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBaileyChat.ts
git commit -m "Add useBaileyChat hook"
```

---

### Task 5: Chat UI, page, and routing

**Files:**
- Create: `src/components/BaileyChatPanel.tsx`
- Create: `src/pages/BaileyAIPage.tsx`
- Modify: `src/routes/fhirRoutes.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `package.json` (add `react-markdown` dependency)

**Interfaces:**
- Consumes: `useBaileyChat` (`src/hooks/useBaileyChat.ts`, Task 4); `EnvContext` (`src/context/EnvironmentContext.ts`, Task 1 — needs `baileyUrl`).

- [ ] **Step 1: Add the `react-markdown` dependency**

Run: `yarn add react-markdown`

*(`react-markdown` renders markdown to React elements directly — it does not use `dangerouslySetInnerHTML` and does not pass through raw HTML unless the `rehype-raw` plugin is explicitly added, which this plan does not do. No sanitizer (e.g. `dompurify`) is needed for this usage.)*

- [ ] **Step 2: Write `src/components/BaileyChatPanel.tsx`**

```tsx
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import Markdown from 'react-markdown';
import useBaileyChat from '../hooks/useBaileyChat';

const BaileyChatPanel = () => {
    const { messages, status, error, send, stop, retryLast } = useBaileyChat();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!input.trim() || status === 'streaming') {
            return;
        }
        send(input);
        setInput('');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '78vh' }}>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                {messages.map((message) => (
                    <Box
                        key={message.id}
                        sx={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}
                    >
                        <Paper
                            sx={{
                                p: 1.5,
                                maxWidth: '75%',
                                bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                                color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                            }}
                        >
                            {message.role === 'assistant' ? (
                                <Markdown>{message.content || (message.streaming ? '…' : '')}</Markdown>
                            ) : (
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
                            )}
                            {message.toolCalls?.map((toolCall, index) => (
                                <Chip
                                    key={`${message.id}-tool-${index}`}
                                    size="small"
                                    color={toolCall.isError ? 'error' : 'default'}
                                    label={`🔧 ${toolCall.name}${toolCall.arguments ? `(${toolCall.arguments})` : ''}`}
                                    sx={{ mt: 1, mr: 0.5 }}
                                />
                            ))}
                        </Paper>
                    </Box>
                ))}
                <div ref={bottomRef} />
            </Box>

            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={retryLast}>
                            Retry
                        </Button>
                    }
                    sx={{ mb: 1 }}
                >
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask Bailey about FHIR data on this server…"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={status === 'streaming'}
                />
                {status === 'streaming' ? (
                    <>
                        <CircularProgress size={20} />
                        <IconButton color="error" onClick={stop} aria-label="stop">
                            <StopIcon />
                        </IconButton>
                    </>
                ) : (
                    <IconButton color="primary" type="submit" aria-label="send" disabled={!input.trim()}>
                        <SendIcon />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
};

export default BaileyChatPanel;
```

- [ ] **Step 3: Write `src/pages/BaileyAIPage.tsx`**

```tsx
import { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BaileyChatPanel from '../components/BaileyChatPanel';
import EnvContext from '../context/EnvironmentContext';

const BaileyAIPage = () => {
    const { baileyUrl } = useContext(EnvContext);

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {!baileyUrl ? (
                        <Typography color="error">
                            Bailey AI is not configured (missing REACT_APP_BAILEY_URL).
                        </Typography>
                    ) : (
                        <BaileyChatPanel />
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default BaileyAIPage;
```

- [ ] **Step 4: Register the route in `src/routes/fhirRoutes.tsx`**

Add the lazy import next to the other page imports (after the `ConnectionConsolePage` import line):

```tsx
const BaileyAIPage = lazy(() => import('../pages/BaileyAIPage'));
```

Add the route next to the `connections` route in the exported array:

```tsx
<Route key="bailey" path="/bailey" element={<BaileyAIPage />} />,
```

- [ ] **Step 5: Add a nav link in `src/components/Header.tsx`**

Add the icon import near the other icon imports (after `HubIcon`):

```tsx
import SmartToyIcon from '@mui/icons-material/SmartToy';
```

Add a new `IconButton`, right after the existing Connections `Tooltip`/`IconButton` block (which links to `/connections`), inside the same `{userDetails && (...)}` conditional style but as its own block:

```tsx
{userDetails && (
    <Tooltip title="Bailey AI">
        <IconButton
            color="inherit"
            aria-label="bailey ai"
            id="btnBaileyAI"
            component={Link}
            to="/bailey"
            sx={{ ml: 1 }}
        >
            <SmartToyIcon />
        </IconButton>
    </Tooltip>
)}
```

- [ ] **Step 6: Automated verification**

Run: `yarn lint && yarn build`
Expected: both succeed with no new errors/warnings.

- [ ] **Step 7: Manual verification**

1. In your local `.env` (gitignored, not part of this commit), set `REACT_APP_BAILEY_URL` to a reachable baileyai environment (e.g. `https://baileyai.dev.bwell.zone`) and `REACT_APP_BAILEY_MODEL` to a valid model id for that environment.
2. Run `yarn dev`, open the app, and log in.
3. Confirm a new "Bailey AI" icon appears in the header next to the Connections icon; click it and confirm it navigates to `/bailey`.
4. Type a question about FHIR data on this server (e.g. "How many Patient resources are there?") and send it. Confirm:
   - The assistant message streams in incrementally (not all at once).
   - Markdown formatting (e.g. a bulleted list, if the response includes one) renders correctly, not as raw asterisks.
   - If Bailey calls the fhir-server MCP tool, a "🔧 …" chip appears on the assistant's message.
5. Click the stop icon mid-response and confirm streaming halts without an error banner.
6. Temporarily set `REACT_APP_BAILEY_MODEL` to an invalid value, restart the dev server, send another message, and confirm an error banner with a working "Retry" button appears (rather than the app logging you out). Revert the env var afterward.
7. Log out and confirm the "Bailey AI" icon disappears from the header (same gating as the Connections icon).

- [ ] **Step 8: Commit**

```bash
git add package.json yarn.lock src/components/BaileyChatPanel.tsx src/pages/BaileyAIPage.tsx src/routes/fhirRoutes.tsx src/components/Header.tsx
git commit -m "Add Bailey AI chat screen, route, and nav link"
```

---

## Follow-up (not part of this plan)

Repoint baileyai's static `.mcp.json` "fhir-server" entry / `MCP_FHIR_URL` to the new fhir-server `/mcp` endpoint, so other Bailey surfaces (e.g. skills-service authoring chat) also move off the legacy `mcp-fhir-agent` service. Separate PR, in the `baileyai` repo, independent of this plan. Also verify (in `baileyai`'s deployment config, not this repo): `REQUEST_TOOLS_ENABLED=true` in each environment's Helm values, and that baileyai's `AUTH_PROVIDERS` in each environment trusts the issuer of the token fhir-server-ui's active login provider produces.
