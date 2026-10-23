import { act, render, renderHook, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBaileyChat, type BaileyChatTransport } from '@icanbwell/baileyai-chat-ui';

vi.mock('../utils/auth.utils', () => ({ logout: vi.fn(), removeAuthData: vi.fn() }));

import { logout, removeAuthData } from '../utils/auth.utils';
import { NETWORK_ERROR_COPY, useBaileyChatTransport } from './useBaileyChatTransport';
import BaileyApi from '../api/baileyApi';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';

const BAILEY_URL = 'https://bailey.example.com';
const CONVERSATION_ID = 'user-1:chat-0123abcd';
const encoder = new TextEncoder();
const fetchMock = vi.fn();
const setUserDetails = vi.fn();

const sse = (text: string) =>
    `data: ${JSON.stringify({ type: 'response.output_text.delta', delta: text })}\n\ndata: [DONE]\n\n`;

const sseResponse = (text: string, headers: Record<string, string> = {}) =>
    new Response(encoder.encode(sse(text)), { status: 200, headers });

const streamParams = (overrides: Record<string, unknown> = {}) => ({
    model: 'm',
    instructions: 'i',
    input: [{ role: 'user' as const, content: 'hello' }],
    tools: [
        {
            type: 'mcp' as const,
            server_url: 'https://fhir.example.com/mcp',
            server_label: 'fhir-server',
        },
    ],
    signal: new AbortController().signal,
    onChunk: vi.fn(),
    ...overrides,
});

function Wrapper({ baileyUrl = BAILEY_URL, children }: PropsWithChildren<{ baileyUrl?: string }>) {
    return (
        <EnvContext.Provider
            value={{
                fhirUrl: 'https://fhir.example.com',
                AUTH_PROVIDERS: '',
                FHIR_APP_VERSION: 'null',
                AWS_REGION: '',
                baileyUrl,
                baileyModel: 'm',
                baileyEnabled: true,
                getFhirServerVersion: () => 'null',
            }}
        >
            <UserContext.Provider value={{ userDetails: null, setUserDetails }}>
                {children}
            </UserContext.Provider>
        </EnvContext.Provider>
    );
}

const renderTransport = () =>
    renderHook(() => useBaileyChatTransport(), { wrapper: Wrapper }).result.current;

const fetchedHeaders = (call = 0) =>
    fetchMock.mock.calls.at(call)?.[1].headers as Record<string, string>;
const fetchedBody = (call = 0) => JSON.parse(fetchMock.mock.calls.at(call)?.[1].body);

describe('useBaileyChatTransport', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        fetchMock.mockReset();
        setUserDetails.mockReset();
        vi.mocked(logout).mockReset();
        vi.mocked(removeAuthData).mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('is referentially stable across re-renders when baileyUrl is unchanged', () => {
        const seen: unknown[] = [];
        function Probe() {
            seen.push(useBaileyChatTransport());
            return null;
        }

        const { rerender } = render(
            <Wrapper>
                <Probe />
            </Wrapper>
        );
        rerender(
            <Wrapper>
                <Probe />
            </Wrapper>
        );

        expect(seen).toHaveLength(2);
        expect(seen[0]).toBe(seen[1]);
    });

    it('creates a new transport when baileyUrl changes', () => {
        const seen: unknown[] = [];
        function Probe() {
            seen.push(useBaileyChatTransport());
            return null;
        }

        const { rerender } = render(
            <Wrapper baileyUrl="https://a.example.com">
                <Probe />
            </Wrapper>
        );
        rerender(
            <Wrapper baileyUrl="https://b.example.com">
                <Probe />
            </Wrapper>
        );

        expect(seen[0]).not.toBe(seen[1]);
    });

    it('getHeaders reads the current token on every call', async () => {
        fetchMock.mockImplementation(async () => sseResponse('ok'));
        const transport = renderTransport();

        localStorage.setItem('jwt', 'token-one');
        await transport.streamChat(streamParams());
        localStorage.setItem('jwt', 'token-two');
        await transport.streamChat(streamParams());

        expect(fetchedHeaders(0)['Authorization']).toBe('Bearer token-one');
        expect(fetchedHeaders(1)['Authorization']).toBe('Bearer token-two');
    });

    it.each([401, 403])(
        'does not log out or clear the session when Bailey answers %i',
        async (status) => {
            localStorage.setItem('jwt', 'session-token');
            fetchMock.mockResolvedValue(new Response('{"error":"issuer not trusted"}', { status }));
            const replace = vi.fn();
            vi.stubGlobal('location', { ...window.location, replace });
            const transport = renderTransport();

            const result = await transport.streamChat(streamParams());

            expect(result.status).toBe(status);
            expect(setUserDetails).not.toHaveBeenCalled();
            expect(logout).not.toHaveBeenCalled();
            expect(removeAuthData).not.toHaveBeenCalled();
            expect(replace).not.toHaveBeenCalled();
            expect(localStorage.getItem('jwt')).toBe('session-token');
        }
    );

    it('surfaces the response body and the status of a non-2xx answer', async () => {
        fetchMock.mockResolvedValue(new Response('{"detail":"unknown model id"}', { status: 422 }));

        const result = await renderTransport().streamChat(streamParams());

        expect(result).toMatchObject({ status: 422, text: '{"detail":"unknown model id"}' });
    });

    it('reports x-request-id through onRequestId, and not when the header is absent', async () => {
        const onRequestId = vi.fn();
        fetchMock.mockResolvedValueOnce(sseResponse('ok', { 'X-Request-Id': 'bailey-req-42' }));
        fetchMock.mockResolvedValueOnce(sseResponse('ok'));
        const transport = renderTransport();

        await transport.streamChat(streamParams({ onRequestId }));
        expect(onRequestId).toHaveBeenCalledTimes(1);
        expect(onRequestId).toHaveBeenCalledWith('bailey-req-42');

        onRequestId.mockClear();
        await transport.streamChat(streamParams({ onRequestId }));
        expect(onRequestId).not.toHaveBeenCalled();
    });

    it('sends the chat request to /bailey/v1/responses with the same body shape as before', async () => {
        fetchMock.mockImplementation(async () => sseResponse('ok'));
        const params = streamParams();

        await renderTransport().streamChat(params);

        const [url, init] = fetchMock.mock.calls[0];
        expect(init.method).toBe('POST');
        expect(new URL(url).origin).toBe(BAILEY_URL);
        expect(new URL(url).pathname).toBe('/bailey/v1/responses');
        expect(fetchedBody()).toEqual({
            model: params.model,
            instructions: params.instructions,
            input: params.input,
            stream: true,
            tools: params.tools,
        });
    });

    it('sends one Content-Type, the library Accept, the bearer token and Origin-Service', async () => {
        localStorage.setItem('jwt', 'session-token');
        fetchMock.mockImplementation(async () => sseResponse('ok'));

        await renderTransport().streamChat(streamParams());

        const headers = fetchedHeaders();
        const names = Object.keys(headers).map((name) => name.toLowerCase());
        expect(names.filter((name) => name === 'content-type')).toHaveLength(1);
        expect(names.filter((name) => name === 'accept')).toHaveLength(1);
        expect(headers['Content-Type']).toBe('application/json');
        // Library sends text/event-stream only; Task 5 confirms Bailey streams with it.
        expect(headers['Accept']).toBe('text/event-stream');
        expect(headers['Authorization']).toBe('Bearer session-token');
        expect(headers['Origin-Service']).toBe('fhir-ui');
    });

    it('streams decoded text to onChunk and reassembles a multi-byte character split across chunks', async () => {
        const body = encoder.encode('price €9');
        const euroAt = body.indexOf(0xe2);
        fetchMock.mockResolvedValue(
            new Response(
                new ReadableStream<Uint8Array>({
                    start(controller) {
                        controller.enqueue(body.slice(0, euroAt + 2));
                        controller.enqueue(body.slice(euroAt + 2));
                        controller.close();
                    },
                }),
                { status: 200 }
            )
        );
        const chunks: string[] = [];

        await renderTransport().streamChat(
            streamParams({ onChunk: (t: string) => chunks.push(t) })
        );

        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.join('')).toBe('price €9');
    });

    it('never sends the request anywhere but the configured Bailey origin', async () => {
        fetchMock.mockImplementation(async () => sseResponse('ok'));
        const transport = renderTransport();

        await transport.streamChat(streamParams());
        await transport.streamChat(streamParams());

        expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
        fetchMock.mock.calls.forEach(([url]) => expect(new URL(url).origin).toBe(BAILEY_URL));
    });

    it('returns interrupted, with the partial text already delivered, when the stream drops mid-body', async () => {
        fetchMock.mockResolvedValue(
            new Response(
                new ReadableStream<Uint8Array>({
                    start(controller) {
                        controller.enqueue(encoder.encode('partial'));
                    },
                    pull() {
                        throw new TypeError('network error');
                    },
                }),
                { status: 200 }
            )
        );
        const onChunk = vi.fn();

        const result = await renderTransport().streamChat(streamParams({ onChunk }));

        expect(onChunk).toHaveBeenCalledWith('partial');
        expect(result).toMatchObject({ interrupted: true });
        expect(setUserDetails).not.toHaveBeenCalled();
    });

    it('a fetch failure resolves with no status, errorKind network, the original cause and host copy', async () => {
        const failure = new TypeError('Failed to fetch');
        fetchMock.mockRejectedValue(failure);
        const onChunk = vi.fn();

        const result = await renderTransport().streamChat(streamParams({ onChunk }));

        expect(result.status).toBeUndefined();
        expect(result.errorKind).toBe('network');
        expect(result.errorCause).toBe(failure);
        expect(result.errorMessage).toBe(NETWORK_ERROR_COPY);
        expect(onChunk).not.toHaveBeenCalled();
    });

    it('a getHeaders failure is reported as network with host copy and no cause', async () => {
        localStorage.setItem('jwt', 'session-token');
        fetchMock.mockResolvedValue(sseResponse('ok'));
        const transport = renderTransport();
        vi.spyOn(BaileyApi.prototype, 'getAuthHeaders').mockImplementation(() => {
            throw new Error('token store unavailable');
        });

        const result = await transport.streamChat(streamParams());

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            status: undefined,
            errorKind: 'network',
            errorMessage: NETWORK_ERROR_COPY,
        });
        expect(result.errorCause).toBeUndefined();
    });

    it('never puts the underlying error text or the request URL into the user-visible message', async () => {
        fetchMock.mockRejectedValue(
            new TypeError('CORS blocked https://bailey.example.com/bailey/v1/responses')
        );

        const result = await renderTransport().streamChat(streamParams());

        expect(result.errorMessage).not.toContain('CORS');
        expect(result.errorMessage).not.toContain('bailey.example.com');
    });

    it('leaves the message of a non-network failure (HTTP status) untouched', async () => {
        fetchMock.mockResolvedValue(new Response('{"detail":"nope"}', { status: 500 }));

        const result = await renderTransport().streamChat(streamParams());

        expect(result.errorKind).toBeUndefined();
        expect(result.errorMessage).not.toBe(NETWORK_ERROR_COPY);
    });

    it('rejects when the caller aborts', async () => {
        const controller = new AbortController();
        fetchMock.mockImplementation(
            (_url: string, init: RequestInit) =>
                new Promise((_resolve, reject) => {
                    init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
                })
        );

        const pending = renderTransport().streamChat(streamParams({ signal: controller.signal }));
        controller.abort(new DOMException('aborted', 'AbortError'));

        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    });
});

describe('useBaileyChat with the library client', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        fetchMock.mockReset();
        setUserDetails.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const renderChat = (onContextLoss = vi.fn()) =>
        renderHook(
            () => {
                const transport: BaileyChatTransport = useBaileyChatTransport();
                return useBaileyChat({
                    transport,
                    model: 'm',
                    instructions: 'i',
                    tools: [],
                    storage: false,
                    sendFullTranscript: true,
                    onContextLoss,
                });
            },
            { wrapper: Wrapper }
        );

    const sendAndSettle = async (chat: ReturnType<typeof renderChat>, text: string) => {
        act(() => chat.result.current.send(text));
        await waitFor(() => expect(chat.result.current.status).not.toBe('streaming'));
    };

    it('reports persistence off and no context loss', async () => {
        fetchMock.mockImplementation(async () =>
            sseResponse('hi', { 'X-Conversation-Id': CONVERSATION_ID })
        );
        const onContextLoss = vi.fn();
        const chat = renderChat(onContextLoss);

        await sendAndSettle(chat, 'first');

        expect(chat.result.current.persistence).toBe('off');
        expect(chat.result.current.contextLost).toBe(false);
        expect(onContextLoss).not.toHaveBeenCalled();
    });

    it('does not persist the conversation id', async () => {
        fetchMock.mockImplementation(async () =>
            sseResponse('hi', { 'X-Conversation-Id': CONVERSATION_ID })
        );
        const chat = renderChat();

        await sendAndSettle(chat, 'first');

        expect(sessionStorage.length).toBe(0);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) as string;
            expect(key).not.toContain('chat-0123abcd');
            expect(localStorage.getItem(key)).not.toContain('chat-0123abcd');
        }
    });

    it('sends the full transcript each turn even after the server reports an id, and never an id', async () => {
        fetchMock.mockImplementation(async () =>
            sseResponse('reply', { 'X-Conversation-Id': CONVERSATION_ID })
        );
        const chat = renderChat();

        await sendAndSettle(chat, 'first question');
        await sendAndSettle(chat, 'second question');

        const secondInput = fetchedBody(1).input as { role: string; content: unknown }[];
        const text = JSON.stringify(secondInput);
        expect(text).toContain('first question');
        expect(text).toContain('reply');
        expect(text).toContain('second question');
        fetchMock.mock.calls.forEach((_c, i) => {
            expect(Object.keys(fetchedHeaders(i)).map((n) => n.toLowerCase())).not.toContain(
                'x-chat-id'
            );
        });
    });

    it('does not log out or call setUserDetails when Bailey answers 401, and shows an error', async () => {
        fetchMock.mockResolvedValue(new Response('{"error":"issuer"}', { status: 401 }));
        const chat = renderChat();

        await sendAndSettle(chat, 'first');

        expect(chat.result.current.status).toBe('error');
        expect(setUserDetails).not.toHaveBeenCalled();
    });

    it('shows the host network copy, not the raw reason, when fetch fails', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
        const chat = renderChat();

        await sendAndSettle(chat, 'first');

        expect(chat.result.current.status).toBe('error');
        expect(chat.result.current.error).toContain(NETWORK_ERROR_COPY);
        expect(chat.result.current.error).not.toContain('Failed to fetch');
        expect(setUserDetails).not.toHaveBeenCalled();
    });

    it('keeps the library message for an HTTP failure', async () => {
        fetchMock.mockResolvedValue(new Response('{"detail":"boom"}', { status: 500 }));
        const chat = renderChat();

        await sendAndSettle(chat, 'first');

        expect(chat.result.current.error).toContain('status 500');
        expect(chat.result.current.error).not.toContain(NETWORK_ERROR_COPY);
    });

    it('treats a caller stop as idle, not an error', async () => {
        fetchMock.mockImplementation(
            (_url: string, init: RequestInit) =>
                new Promise((_resolve, reject) => {
                    init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
                })
        );
        const chat = renderChat();

        act(() => chat.result.current.send('first'));
        await waitFor(() => expect(chat.result.current.status).toBe('streaming'));
        act(() => chat.result.current.stop());

        await waitFor(() => expect(chat.result.current.status).toBe('idle'));
        expect(chat.result.current.error).toBeNull();
    });

    it('ends the turn in the error state when the stream drops mid-body', async () => {
        fetchMock.mockResolvedValue(
            new Response(
                new ReadableStream<Uint8Array>({
                    start(controller) {
                        controller.enqueue(
                            encoder.encode(
                                'data: {"type":"response.output_text.delta","delta":"par"}\n\n'
                            )
                        );
                    },
                    pull() {
                        throw new TypeError('network error');
                    },
                }),
                { status: 200 }
            )
        );
        const chat = renderChat();

        await sendAndSettle(chat, 'first');

        expect(chat.result.current.status).toBe('error');
        expect(setUserDetails).not.toHaveBeenCalled();
    });
});
