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
            const trimmed = last && last.role === 'assistant' ? prev.slice(0, -1) : prev;
            runTurn(trimmed);
            return trimmed;
        });
    }, [runTurn]);

    return { messages, status, error, send, stop, retryLast };
};

export default useBaileyChat;
