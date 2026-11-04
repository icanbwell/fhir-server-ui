import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBaileyClient } from '@icanbwell/baileyai-chat-ui';

// Pins the parts of the @icanbwell/baileyai-chat-ui client API this app relies on, so a release
// that changes them fails here rather than in production.

const BASE_URL = 'https://bailey.example.com/bailey/v1';
const fetchMock = vi.fn();

const streamParams = () => ({
    model: 'm',
    instructions: 'i',
    input: [{ role: 'user' as const, content: 'hello' }],
    tools: [],
    signal: new AbortController().signal,
    onChunk: vi.fn(),
});

describe('@icanbwell/baileyai-chat-ui client contract', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('exports createBaileyClient', () => {
        expect(typeof createBaileyClient).toBe('function');
    });

    it('builds a client from {baseUrl, getHeaders} that exposes streamChat', () => {
        const client = createBaileyClient({ baseUrl: BASE_URL, getHeaders: async () => ({}) });

        expect(typeof client.streamChat).toBe('function');
    });

    it.each([401, 403])('calls onAuthError with the status on a %i', async (status) => {
        fetchMock.mockResolvedValue(new Response('denied', { status }));
        const onAuthError = vi.fn();
        const client = createBaileyClient({ baseUrl: BASE_URL, getHeaders: async () => ({}), onAuthError });

        const result = await client.streamChat(streamParams());

        expect(onAuthError).toHaveBeenCalledTimes(1);
        expect(onAuthError).toHaveBeenCalledWith(expect.objectContaining({ status }));
        expect(result.status).toBe(status);
    });

    it('POSTs to <baseUrl>/responses on the baseUrl origin with the getHeaders output', async () => {
        fetchMock.mockResolvedValue(new Response('', { status: 200 }));
        const client = createBaileyClient({
            baseUrl: BASE_URL,
            getHeaders: async () => ({ Authorization: 'Bearer t', 'Origin-Service': 'fhir-ui' }),
        });

        await client.streamChat(streamParams());

        const [url, init] = fetchMock.mock.calls[0];
        const requested = new URL(url);
        // Origin comparison, never a string prefix: https://bailey.example.com.evil.net starts
        // with https://bailey.example.com.
        expect(requested.origin).toBe(new URL(BASE_URL).origin);
        expect(requested.pathname).toBe('/bailey/v1/responses');
        expect(init.headers['Authorization']).toBe('Bearer t');
        expect(init.headers['Origin-Service']).toBe('fhir-ui');
    });

    it('tolerates a trailing slash on baseUrl', async () => {
        fetchMock.mockResolvedValue(new Response('', { status: 200 }));
        const client = createBaileyClient({ baseUrl: `${BASE_URL}/`, getHeaders: async () => ({}) });

        await client.streamChat(streamParams());

        expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/bailey/v1/responses');
    });

    // Not testable: the client has no option or documented behavior that refuses a request URL on a
    // different origin than baseUrl (plan item (f)); the origin is fixed by the host's baseUrl. The
    // origin assertions in this file and in useBaileyChatTransport.test.tsx are the evidence.
});
