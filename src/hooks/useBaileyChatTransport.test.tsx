import { act, renderHook, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBaileyChat } from '@icanbwell/baileyai-chat-ui';
import { useBaileyChatTransport } from './useBaileyChatTransport';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';

const { mockGetAuthInfo, mockLogout, mockRemoveAuthData } = vi.hoisted(() => ({
    mockGetAuthInfo: vi.fn(),
    mockLogout: vi.fn(),
    mockRemoveAuthData: vi.fn(),
}));

vi.mock('../utils/auth.utils', () => ({ logout: mockLogout, removeAuthData: mockRemoveAuthData }));
vi.mock('../utils/authUrlProvider', () => ({
    default: vi.fn().mockImplementation(function AuthUrlProviderMock() {
        return { getAuthInfo: mockGetAuthInfo };
    }),
}));

const BAILEY_URL = 'https://bailey.example.com';
const CONVERSATION_ID = 'sub-1:chat-0123abcd';
const encoder = new TextEncoder();
const fetchMock = vi.fn();
const setUserDetailsSpy = vi.fn();

const streamOf = (...parts: Uint8Array[]) =>
    new ReadableStream<Uint8Array>({
        start(controller) {
            parts.forEach((part) => controller.enqueue(part));
            controller.close();
        },
    });

const sseDelta = (text: string) =>
    encoder.encode(`data: ${JSON.stringify({ type: 'response.output_text.delta', delta: text })}\n\n`);

const okResponse = (parts: Uint8Array[], headers: Record<string, string> = {}) =>
    new Response(streamOf(...parts), { status: 200, headers });

const makeWrapper = (baileyUrl: string) =>
    function Wrapper({ children }: PropsWithChildren) {
        return (
            <EnvContext.Provider
                value={{
                    fhirUrl: '',
                    AUTH_PROVIDERS: '',
                    FHIR_APP_VERSION: 'null',
                    AWS_REGION: '',
                    baileyUrl,
                    baileyModel: '',
                    baileyEnabled: true,
                    getFhirServerVersion: () => 'null',
                }}
            >
                <UserContext.Provider value={{ userDetails: null, setUserDetails: setUserDetailsSpy }}>
                    {children}
                </UserContext.Provider>
            </EnvContext.Provider>
        );
    };

const streamParams = (overrides: Partial<Parameters<ReturnType<typeof useBaileyChatTransport>['streamChat']>[0]> = {}) => ({
    model: 'gpt-5',
    instructions: 'be helpful',
    input: [{ role: 'user' as const, content: 'hello' }],
    tools: [{ type: 'mcp' as const, server_url: 'https://fhir.example.com/mcp', server_label: 'fhir-server' }],
    signal: new AbortController().signal,
    onChunk: vi.fn(),
    ...overrides,
});

const renderTransport = (baileyUrl = BAILEY_URL) =>
    renderHook(() => useBaileyChatTransport(), { wrapper: makeWrapper(baileyUrl) });

const headerOf = (init: RequestInit, name: string): string | undefined =>
    Object.entries(init.headers as Record<string, string>).find(([key]) => key.toLowerCase() === name)?.[1];

describe('useBaileyChatTransport', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        fetchMock.mockReset();
        mockGetAuthInfo.mockReset();
        mockLogout.mockReset();
        mockRemoveAuthData.mockReset();
        setUserDetailsSpy.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('is referentially stable across re-renders when baileyUrl is unchanged', () => {
        const { result, rerender } = renderTransport();
        const first = result.current;

        rerender();

        expect(result.current).toBe(first);
    });

    it('creates a new transport when baileyUrl changes', () => {
        let baileyUrl = BAILEY_URL;
        const { result, rerender } = renderHook(() => useBaileyChatTransport(), {
            wrapper: ({ children }: PropsWithChildren) => makeWrapper(baileyUrl)({ children }),
        });
        const first = result.current;

        baileyUrl = 'https://other-bailey.example.com';
        rerender();

        expect(result.current).not.toBe(first);
    });

    it('getHeaders reads the current token on every call', async () => {
        fetchMock.mockImplementation(async () => okResponse([]));
        localStorage.setItem('jwt', 'token-one');
        const { result } = renderTransport();

        await result.current.streamChat(streamParams());
        localStorage.setItem('jwt', 'token-two');
        await result.current.streamChat(streamParams());

        expect(headerOf(fetchMock.mock.calls[0][1], 'authorization')).toBe('Bearer token-one');
        expect(headerOf(fetchMock.mock.calls[1][1], 'authorization')).toBe('Bearer token-two');
    });

    it('omits Authorization when no session token exists', async () => {
        fetchMock.mockImplementation(async () => okResponse([]));
        const { result } = renderTransport();

        await result.current.streamChat(streamParams());

        expect(headerOf(fetchMock.mock.calls[0][1], 'authorization')).toBeUndefined();
    });

    it.each([401, 403])(
        'does not log out or clear the session when Bailey answers %i',
        async (status) => {
            localStorage.setItem('jwt', 'session-token');
            localStorage.setItem('identityProvider', 'provider-a');
            mockGetAuthInfo.mockReturnValue({ tokenToSendToFhirServer: 'jwt' });
            fetchMock.mockResolvedValue(new Response('token issuer not trusted', { status }));
            const replaceSpy = vi.fn();
            vi.stubGlobal('location', { ...window.location, replace: replaceSpy });
            const { result } = renderTransport();

            const outcome = await result.current.streamChat(streamParams());

            expect(outcome.status).toBe(status);
            expect(setUserDetailsSpy).not.toHaveBeenCalled();
            expect(mockLogout).not.toHaveBeenCalled();
            expect(mockRemoveAuthData).not.toHaveBeenCalled();
            expect(replaceSpy).not.toHaveBeenCalled();
            expect(localStorage.getItem('jwt')).toBe('session-token');
            expect(localStorage.getItem('identityProvider')).toBe('provider-a');
            vi.unstubAllGlobals();
        }
    );

    it('surfaces the response body and the status of a non-2xx answer', async () => {
        fetchMock.mockResolvedValue(new Response('{"detail":"unknown model id"}', { status: 422 }));
        const { result } = renderTransport();

        const outcome = await result.current.streamChat(streamParams());

        expect(outcome).toMatchObject({ status: 422, text: '{"detail":"unknown model id"}' });
    });

    it('reports x-request-id through onRequestId, and not when the header is absent', async () => {
        fetchMock.mockResolvedValueOnce(okResponse([], { 'X-Request-Id': 'bailey-req-42' }));
        fetchMock.mockResolvedValueOnce(okResponse([]));
        const { result } = renderTransport();
        const onRequestId = vi.fn();

        await result.current.streamChat(streamParams({ onRequestId }));
        expect(onRequestId).toHaveBeenCalledWith('bailey-req-42');

        onRequestId.mockClear();
        await result.current.streamChat(streamParams({ onRequestId }));
        expect(onRequestId).not.toHaveBeenCalled();
    });

    it('rethrows AbortError when the signal aborts', async () => {
        const controller = new AbortController();
        fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
            controller.abort();
            if (init.signal?.aborted) {
                throw new DOMException('aborted', 'AbortError');
            }
            return okResponse([]);
        });
        const { result } = renderTransport();

        await expect(result.current.streamChat(streamParams({ signal: controller.signal }))).rejects.toMatchObject({
            name: 'AbortError',
        });
    });

    it('sends the chat request to /bailey/v1/responses on the Bailey origin only', async () => {
        fetchMock.mockImplementation(async () => okResponse([]));
        const { result } = renderTransport(`${BAILEY_URL}/`);
        const params = streamParams();

        await result.current.streamChat(params);

        const [url, init] = fetchMock.mock.calls[0];
        expect(new URL(url).origin).toBe(new URL(BAILEY_URL).origin);
        expect(new URL(url).pathname).toBe('/bailey/v1/responses');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({
            model: params.model,
            instructions: params.instructions,
            input: params.input,
            stream: true,
            tools: params.tools,
        });
    });

    it('sends one Content-Type, the bearer token and an SSE Accept header', async () => {
        localStorage.setItem('jwt', 'session-token');
        fetchMock.mockImplementation(async () => okResponse([]));
        const { result } = renderTransport();

        await result.current.streamChat(streamParams());

        const init = fetchMock.mock.calls[0][1];
        const names = Object.keys(init.headers).map((name) => name.toLowerCase());
        expect(names.filter((name) => name === 'content-type')).toHaveLength(1);
        expect(names.filter((name) => name === 'accept')).toHaveLength(1);
        expect(headerOf(init, 'content-type')).toBe('application/json');
        // The library client sends text/event-stream only; the previous host transport also
        // listed application/json.
        expect(headerOf(init, 'accept')).toBe('text/event-stream');
        expect(headerOf(init, 'authorization')).toBe('Bearer session-token');
        expect(headerOf(init, 'origin-service')).toBe('fhir-ui');
    });

    it('streams decoded text to onChunk, one call per network chunk', async () => {
        fetchMock.mockResolvedValue(okResponse([encoder.encode('data: {"a":1}\n'), encoder.encode('data: [DONE]\n')]));
        const { result } = renderTransport();
        const onChunk = vi.fn();

        await result.current.streamChat(streamParams({ onChunk }));

        expect(onChunk.mock.calls.map(([text]) => text)).toEqual(['data: {"a":1}\n', 'data: [DONE]\n']);
    });

    it('reassembles a multi-byte character split across chunks', async () => {
        const euro = encoder.encode('€');
        fetchMock.mockResolvedValue(
            okResponse([
                new Uint8Array([...encoder.encode('price '), euro[0], euro[1]]),
                new Uint8Array([euro[2], ...encoder.encode('9')]),
            ])
        );
        const { result } = renderTransport();
        const onChunk = vi.fn();

        await result.current.streamChat(streamParams({ onChunk }));

        expect(onChunk.mock.calls.map(([text]) => text).join('')).toBe('price €9');
    });

    it('returns an interrupted-stream error and keeps already delivered text when the stream drops', async () => {
        let sent = false;
        const body = new ReadableStream<Uint8Array>({
            pull(controller) {
                if (!sent) {
                    sent = true;
                    controller.enqueue(encoder.encode('partial'));
                    return;
                }
                controller.error(new TypeError('network error'));
            },
        });
        fetchMock.mockResolvedValue(new Response(body, { status: 200 }));
        const { result } = renderTransport();
        const onChunk = vi.fn();

        const outcome = await result.current.streamChat(streamParams({ onChunk }));

        expect(onChunk).toHaveBeenCalledWith('partial');
        expect(outcome.status).toBe(200);
        expect(outcome.errorMessage).toBeTruthy();
    });

    it('returns errorMessage and no status when fetch itself fails', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
        const { result } = renderTransport();
        const onChunk = vi.fn();

        const outcome = await result.current.streamChat(streamParams({ onChunk }));

        expect(outcome.status).toBeUndefined();
        expect(outcome.errorMessage).toBeTruthy();
        expect(onChunk).not.toHaveBeenCalled();
    });
});

describe('useBaileyChat with the library client (container options)', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        fetchMock.mockReset();
        setUserDetailsSpy.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    const renderChat = () =>
        renderHook(
            () => {
                const transport = useBaileyChatTransport();
                return useBaileyChat({
                    transport,
                    model: 'gpt-5',
                    instructions: 'be helpful',
                    storage: null,
                    sendFullTranscript: true,
                });
            },
            { wrapper: makeWrapper(BAILEY_URL) }
        );

    const sendAndSettle = async (chat: ReturnType<typeof renderChat>, text: string) => {
        act(() => chat.result.current.send(text));
        await waitFor(() => expect(chat.result.current.status).toBe('idle'));
    };

    it('does not persist the conversation id', async () => {
        fetchMock.mockImplementation(async () =>
            okResponse([sseDelta('answer')], { 'X-Conversation-Id': CONVERSATION_ID })
        );
        const chat = renderChat();

        await sendAndSettle(chat, 'first question');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(sessionStorage.length).toBe(0);
        const localEntries = Object.keys(localStorage).flatMap((key) => [key, localStorage.getItem(key) ?? '']);
        expect(localEntries.some((entry) => entry.includes('chat-0123abcd'))).toBe(false);
    });

    it('sends the full transcript each turn even after the server reports an id', async () => {
        fetchMock.mockImplementation(async () =>
            okResponse([sseDelta('answer')], { 'X-Conversation-Id': CONVERSATION_ID })
        );
        const chat = renderChat();

        await sendAndSettle(chat, 'first question');
        await sendAndSettle(chat, 'second question');

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(secondBody.input.map((message: { role: string; content: string }) => message.content)).toEqual([
            'first question',
            'answer',
            'second question',
        ]);
    });

    // KNOWN LIBRARY ISSUE (verified against baileyai-chat-ui PR #55 head 925de07): with
    // sendFullTranscript: true the hook still sends the held id as `x-chat-id`
    // (src/logic/useBaileyChat.ts, `...(heldId ? { conversationId: heldId } : {})`). The server
    // prepends stored history to `input` without deduplicating, so full transcript + id would
    // duplicate context once the backend reports an id. The plan expects no id header here
    // (ASSUMED item h). `it.fails` flips to a real failure when the library is fixed; then drop it.
    it.fails('does not send x-chat-id while sendFullTranscript is true', async () => {
        fetchMock.mockImplementation(async () =>
            okResponse([sseDelta('answer')], { 'X-Conversation-Id': CONVERSATION_ID })
        );
        const chat = renderChat();

        await sendAndSettle(chat, 'first question');
        await sendAndSettle(chat, 'second question');

        fetchMock.mock.calls.forEach(([, init]) => expect(headerOf(init, 'x-chat-id')).toBeUndefined());
    });

    it('only talks to the Bailey origin', async () => {
        fetchMock.mockImplementation(async () => okResponse([sseDelta('answer')]));
        const chat = renderChat();

        await sendAndSettle(chat, 'first question');

        fetchMock.mock.calls.forEach(([url]) => expect(new URL(url).origin).toBe(new URL(BAILEY_URL).origin));
    });
});
