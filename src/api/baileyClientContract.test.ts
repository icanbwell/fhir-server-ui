import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBaileyClient } from '@icanbwell/baileyai-chat-ui';

// Pins the parts of the library client this host depends on, so a library release that drifts
// from them fails here rather than in production. Needs a library release that exports
// createBaileyClient (see the PR description: the dependency bump is not part of this commit).

const BASE_URL = 'https://bailey.example.com/bailey/v1';
const fetchMock = vi.fn();

const streamParams = () => ({
    model: 'gpt-5',
    instructions: '',
    input: [{ role: 'user' as const, content: 'hi' }],
    tools: [],
    signal: new AbortController().signal,
    onChunk: vi.fn(),
});

describe('createBaileyClient contract', () => {
    afterEach(() => {
        fetchMock.mockReset();
    });

    it('exports createBaileyClient', () => {
        expect(typeof createBaileyClient).toBe('function');
    });

    it('builds a client that exposes streamChat', () => {
        const client = createBaileyClient({ baseUrl: BASE_URL, getHeaders: async () => ({}) });

        expect(typeof client.streamChat).toBe('function');
    });

    it.each([401, 403])('calls onAuthError with the status on a %i', async (status) => {
        fetchMock.mockResolvedValue(new Response('denied', { status }));
        const onAuthError = vi.fn();
        const client = createBaileyClient({
            baseUrl: BASE_URL,
            getHeaders: async () => ({}),
            onAuthError,
            fetch: fetchMock,
        });

        await client.streamChat(streamParams());

        expect(onAuthError).toHaveBeenCalledTimes(1);
        expect(onAuthError).toHaveBeenCalledWith(expect.objectContaining({ status }));
    });

    it("sends getHeaders output to baseUrl's origin", async () => {
        fetchMock.mockResolvedValue(new Response('', { status: 200 }));
        const client = createBaileyClient({
            baseUrl: BASE_URL,
            getHeaders: async () => ({ Authorization: 'Bearer abc' }),
            fetch: fetchMock,
        });

        await client.streamChat(streamParams());

        const [url, init] = fetchMock.mock.calls[0];
        expect(new URL(url).origin).toBe(new URL(BASE_URL).origin);
        expect(new URL(url).pathname).toBe('/bailey/v1/responses');
        expect(init.headers.Authorization).toBe('Bearer abc');
    });
});
