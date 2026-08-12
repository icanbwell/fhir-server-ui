import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaileyApi from '../api/baileyApi';
import { parseSseFrames } from '../utils/baileySse';
import { BAILEY_MCP_SERVER_LABEL, BAILEY_SYSTEM_INSTRUCTIONS } from '../constants/baileyConstants';
import { BaileyMessage, BaileyStreamEvent, BaileyTraceEvent } from '../types/baileyChat';

export interface UseBaileyChatResult {
    messages: BaileyMessage[];
    traceEvents: BaileyTraceEvent[];
    status: 'idle' | 'streaming' | 'error';
    error: string | null;
    send: (text: string) => void;
    stop: () => void;
    retryLast: () => void;
    clearTrace: () => void;
}

// Bailey's error bodies can be long (validation dumps, stack traces). Show enough to identify
// the cause in the banner without flooding the screen.
const MAX_ERROR_DETAIL_LENGTH = 200;

const buildHttpErrorMessage = (
    httpStatus: number | undefined,
    responseText: string,
    errorMessage: string | undefined
): string => {
    if (httpStatus === 401 || httpStatus === 403) {
        return "Bailey isn't reachable with your current login.";
    }
    const base = `Bailey request failed (status ${httpStatus ?? 'network error'}).`;
    const detail = (errorMessage || responseText || '').trim();
    if (!detail) {
        return base;
    }
    const truncated =
        detail.length > MAX_ERROR_DETAIL_LENGTH ? `${detail.slice(0, MAX_ERROR_DETAIL_LENGTH)}…` : detail;
    return `${base} ${truncated}`;
};

const useBaileyChat = (): UseBaileyChatResult => {
    const { baileyUrl, baileyModel, fhirUrl } = useContext(EnvContext);
    const { setUserDetails } = useContext(UserContext);

    const [messages, setMessages] = useState<BaileyMessage[]>([]);
    const [traceEvents, setTraceEvents] = useState<BaileyTraceEvent[]>([]);
    const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    const lastUserTextRef = useRef<string>('');

    // `send`/`retryLast` need the current history to build the request body. Reading it from
    // inside a `setMessages` updater would make firing the request a side effect of a state
    // updater — and React StrictMode double-invokes updaters in development, so every send
    // would POST twice and render two assistant bubbles. Mirroring the latest messages into a
    // ref lets both callbacks compute the next history and start the turn as plain statements.
    const messagesRef = useRef<BaileyMessage[]>([]);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Returns true when the event actually contributed something visible to the assistant
    // turn (message text or a trace event), so the caller can tell "streamed a real answer"
    // from "parsed nothing at all". Ported from baileyai-skills-service's
    // frontend/src/api/chat.ts parseTraceEvent (the other real consumer of this same
    // endpoint): every non-text event becomes a BaileyTraceEvent tracked separately from the
    // message, instead of being rendered inline in the transcript.
    const applyEvent = useCallback((assistantId: string, event: BaileyStreamEvent): boolean => {
        if (event.type === 'response.output_text.delta') {
            if (!event.delta) {
                return false;
            }
            setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + event.delta } : m))
            );
            return true;
        }

        if (event.type === 'response.output_item.added' || event.type === 'response.output_item.done') {
            const item = event.item;
            // 'function_call' is a plain client-side tool; 'mcp_call' is a hosted/remote MCP
            // tool call. Both carry name/arguments on the same item. Anything else
            // (message/reasoning items, etc.) falls through to the raw fallback below.
            if (item.type === 'function_call' || item.type === 'mcp_call') {
                const at = Date.now();
                const name = item.name || 'unknown_tool';
                const trace: BaileyTraceEvent =
                    event.type === 'response.output_item.added'
                        ? { kind: 'tool_start', name, args: item.arguments, at }
                        : {
                              kind: 'tool_end',
                              name,
                              args: item.arguments,
                              at,
                              output: item.output,
                              isError: item.is_error,
                              runtimeSeconds: item.runtime_seconds,
                          };
                setTraceEvents((prev) => [...prev, trace]);
                return true;
            }
        } else if (event.type === 'task.progress') {
            setTraceEvents((prev) => [
                ...prev,
                { kind: 'progress', status: event.status, message: event.message, at: Date.now() },
            ]);
            return true;
        } else if (event.type === 'response.output_text.done') {
            // Fires on every turn that streams text — it's just the per-item echo of what
            // response.output_text.delta already accumulated, carrying no new information.
            // Deliberate deviation from baileyai-skills-service here: its ChatTrace has no
            // specific case for this either, so it falls into the same 'raw'/"unrecognized"
            // bucket there too — but that panel is a developer-facing debug tool where wire-level
            // completeness is the point. This app's details panel is aimed at chat users, so
            // labeling a routine per-turn event "unrecognized" would be noise, not information.
            return false;
        } else if (event.type === 'response.completed') {
            // Purely a completion signal — [DONE] already drives turn completion here (see
            // parseSseFrames), so there's nothing worth recording.
            return false;
        }

        // Every other event still gets recorded — never silently dropped — so the details
        // panel is a complete record of what happened on the wire.
        setTraceEvents((prev) => [
            ...prev,
            { kind: 'raw', eventType: event.type, raw: JSON.stringify(event), at: Date.now() },
        ]);
        return true;
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
            let receivedOutput = false;

            const processFrames = (events: BaileyStreamEvent[], done: boolean) => {
                events.forEach((event) => {
                    if (event.type === 'error') {
                        streamError = event.message;
                        setTraceEvents((prev) => [...prev, { kind: 'error', message: event.message, at: Date.now() }]);
                        return;
                    }
                    if (applyEvent(assistantId, event)) {
                        receivedOutput = true;
                    }
                });
                if (done) {
                    setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
                }
            };

            try {
                const { status: httpStatus, text: responseText, errorMessage } = await api.streamChat({
                    model: baileyModel,
                    instructions: BAILEY_SYSTEM_INSTRUCTIONS,
                    input: history.map((m) => ({ role: m.role, content: m.content })),
                    tools: [{ type: 'mcp', server_url: `${fhirUrl}/mcp`, server_label: BAILEY_MCP_SERVER_LABEL }],
                    signal: controller.signal,
                    onChunk: (chunkText) => {
                        buffer += chunkText;
                        const { events, remainder, done } = parseSseFrames(buffer);
                        buffer = remainder;
                        processFrames(events, done);
                    },
                });

                // A stream can end without the blank line that would terminate its last frame —
                // and that frame may carry the final delta and the `[DONE]` marker. Re-parse the
                // leftover remainder with an explicit terminator so it isn't silently dropped.
                if (buffer.trim()) {
                    const { events, done } = parseSseFrames(`${buffer}\n\n`);
                    buffer = '';
                    processFrames(events, done);
                }

                if (streamError) {
                    setStatus('error');
                    setError(streamError);
                    return;
                }
                if (httpStatus === undefined || httpStatus >= 400) {
                    const message = buildHttpErrorMessage(httpStatus, responseText, errorMessage);
                    setStatus('error');
                    setError(message);
                    setTraceEvents((prev) => [...prev, { kind: 'error', message, at: Date.now() }]);
                    return;
                }
                // HTTP success but nothing parseable ever came out of the stream. Reporting
                // 'idle' here would show an empty bubble and look like Bailey answered with
                // silence; a framing variant this parser doesn't understand is far more likely.
                if (!receivedOutput) {
                    const message = 'Bailey returned an empty response.';
                    setStatus('error');
                    setError(message);
                    setTraceEvents((prev) => [...prev, { kind: 'error', message, at: Date.now() }]);
                    return;
                }
                setStatus('idle');
            } catch (err: any) {
                if (err?.name === 'AbortError') {
                    setStatus('idle');
                    return;
                }
                const message = err?.message || 'Bailey request failed.';
                setStatus('error');
                setError(message);
                setTraceEvents((prev) => [...prev, { kind: 'error', message, at: Date.now() }]);
            } finally {
                // Drop the assistant placeholder entirely when the turn produced nothing (errored
                // before the first delta, or was stopped immediately). Keeping an empty-content
                // assistant message would both render a blank bubble and get replayed in the next
                // turn's `input` array, which Bailey can reject.
                setMessages((prev) =>
                    prev.flatMap((m) => {
                        if (m.id !== assistantId) {
                            return [m];
                        }
                        return m.content || receivedOutput ? [{ ...m, streaming: false }] : [];
                    })
                );
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
            const next: BaileyMessage[] = [
                ...messagesRef.current,
                { id: crypto.randomUUID(), role: 'user', content: trimmed },
            ];
            messagesRef.current = next;
            setMessages(next);
            runTurn(next);
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
        // Strip a trailing assistant message so the retried turn doesn't resend the failed
        // attempt's partial output as history. A turn that produced nothing has already removed
        // its own placeholder (see runTurn's finally), in which case the last message is the
        // user's and nothing needs stripping.
        const current = messagesRef.current;
        const last = current[current.length - 1];
        const trimmed = last && last.role === 'assistant' ? current.slice(0, -1) : current;
        messagesRef.current = trimmed;
        setMessages(trimmed);
        runTurn(trimmed);
    }, [runTurn]);

    const clearTrace = useCallback(() => setTraceEvents([]), []);

    return { messages, traceEvents, status, error, send, stop, retryLast, clearTrace };
};

export default useBaileyChat;
