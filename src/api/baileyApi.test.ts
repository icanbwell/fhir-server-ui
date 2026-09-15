import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/auth.utils', () => ({ logout: vi.fn(), removeAuthData: vi.fn() }));

import { logout } from '../utils/auth.utils';
import BaileyApi from './baileyApi';

const mockLogout = vi.mocked(logout);
const encoder = new TextEncoder();

const streamOf = (...parts: Uint8Array[]) =>
    new ReadableStream<Uint8Array>({
        start(controller) {
            parts.forEach((part) => controller.enqueue(part));
            controller.close();
        },
    });

const streamResponse = (
    body: ReadableStream<Uint8Array> | null,
    init?: { status?: number; headers?: Record<string, string>; text?: string }
) =>
    ({
        status: init?.status ?? 200,
        headers: new Headers(init?.headers ?? {}),
        body,
        text: async () => init?.text ?? '',
    }) as unknown as Response;

const textResponse = (body: string, init?: { status?: number; headers?: Record<string, string> }) =>
    streamResponse(streamOf(encoder.encode(body)), { ...init, text: body });

const fetchMock = vi.fn();

const makeApi = (setUserDetails?: any) =>
    new BaileyApi({ fhirUrl: 'https://bailey.example.com', setUserDetails });

const baseParams = () => ({
    model: 'claude-sonnet-4',
    instructions: 'You are a FHIR assistant.',
    input: [{ role: 'user', content: 'hello' }] as any,
    tools: [{ type: 'mcp', server_label: 'fhir' }] as any,
    onChunk: vi.fn(),
});

describe('BaileyApi.streamChat', () => {
    beforeEach(() => {
        localStorage.clear();
        mockLogout.mockReset();
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('POSTs the chat request to /bailey/v1/responses on the configured Bailey origin', async () => {
        fetchMock.mockResolvedValue(textResponse('data: done'));

        const params = baseParams();
        const result = await makeApi().streamChat(params);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://bailey.example.com/bailey/v1/responses');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({
            model: 'claude-sonnet-4',
            instructions: 'You are a FHIR assistant.',
            input: [{ role: 'user', content: 'hello' }],
            stream: true,
            tools: [{ type: 'mcp', server_label: 'fhir' }],
        });
        expect(result.status).toBe(200);
        expect(result.text).toBe('data: done');
    });

    it('overrides BaseApi FHIR defaults with JSON + SSE content negotiation headers', async () => {
        fetchMock.mockResolvedValue(textResponse(''));

        await makeApi().streamChat(baseParams());

        const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['Accept']).toBe('application/json, text/event-stream');
        // Only one entry survives per header name — no comma-joined duplicate of the
        // 'application/fhir+json' default BaseApi sets.
        const names = Object.keys(headers).map((name) => name.toLowerCase());
        expect(names.filter((name) => name === 'content-type')).toHaveLength(1);
        expect(names.filter((name) => name === 'accept')).toHaveLength(1);
    });

    it('attaches the session bearer token from local storage', async () => {
        localStorage.setItem('jwt', 'session-token-abc');
        fetchMock.mockResolvedValue(textResponse(''));

        await makeApi().streamChat(baseParams());

        const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
        expect(headers['Authorization']).toBe('Bearer session-token-abc');
        expect(headers['Origin-Service']).toBe('fhir-ui');
    });

    it('streams decoded text to onChunk, one call per chunk', async () => {
        fetchMock.mockResolvedValue(
            streamResponse(
                streamOf(encoder.encode('data: {"a":1}\n'), encoder.encode('data: [DONE]\n'))
            )
        );

        const chunks: string[] = [];
        const result = await makeApi().streamChat({ ...baseParams(), onChunk: (t) => chunks.push(t) });

        expect(chunks).toEqual(['data: {"a":1}\n', 'data: [DONE]\n']);
        expect(result.text).toBe('data: {"a":1}\ndata: [DONE]\n');
    });

    it('invariant 11: reassembles a multi-byte character split across a chunk boundary', async () => {
        // '€' is E2 82 AC in UTF-8 — the first two bytes land in chunk one, the third in chunk two.
        const euro = encoder.encode('€');
        fetchMock.mockResolvedValue(
            streamResponse(
                streamOf(
                    new Uint8Array([...encoder.encode('price '), euro[0], euro[1]]),
                    new Uint8Array([euro[2], ...encoder.encode('9')])
                )
            )
        );

        const chunks: string[] = [];
        const result = await makeApi().streamChat({ ...baseParams(), onChunk: (t) => chunks.push(t) });

        expect(chunks.join('')).toBe('price €9');
        expect(result.text).toBe('price €9');
    });

    it('flushes the decoder when the stream ends mid-character instead of dropping the bytes', async () => {
        const euro = encoder.encode('€');
        fetchMock.mockResolvedValue(
            streamResponse(
                streamOf(encoder.encode('ok'), new Uint8Array([euro[0], euro[1]]))
            )
        );

        const chunks: string[] = [];
        await makeApi().streamChat({ ...baseParams(), onChunk: (t) => chunks.push(t) });

        // Chunk 2 buffers the dangling partial sequence (''), and the final argument-less
        // decode() flushes it as U+FFFD rather than silently discarding it.
        expect(chunks).toEqual(['ok', '', '�']);
    });

    it('reports the x-request-id response header through onRequestId', async () => {
        fetchMock.mockResolvedValue(
            textResponse('data: done', { headers: { 'X-Request-Id': 'bailey-req-42' } })
        );

        const onRequestId = vi.fn();
        await makeApi().streamChat({ ...baseParams(), onRequestId });

        expect(onRequestId).toHaveBeenCalledTimes(1);
        expect(onRequestId).toHaveBeenCalledWith('bailey-req-42');
    });

    it('does not call onRequestId when the response carries no x-request-id header', async () => {
        fetchMock.mockResolvedValue(textResponse('data: done', { headers: { 'x-other': 'v' } }));

        const onRequestId = vi.fn();
        const result = await makeApi().streamChat({ ...baseParams(), onRequestId });

        expect(onRequestId).not.toHaveBeenCalled();
        expect(result.status).toBe(200);
    });

    it('invariant 6: a 401 from Bailey does not log the fhir-server-ui session out', async () => {
        fetchMock.mockResolvedValue(
            textResponse('{"error":"token issuer not in AUTH_PROVIDERS"}', { status: 401 })
        );

        const setUserDetails = vi.fn();
        const result = await makeApi(setUserDetails).streamChat(baseParams());

        expect(mockLogout).not.toHaveBeenCalled();
        expect(setUserDetails).not.toHaveBeenCalled();
        expect(result.status).toBe(401);
        expect(result.text).toBe('{"error":"token issuer not in AUTH_PROVIDERS"}');
    });

    it('returns both the status and the explanatory body on a non-2xx response', async () => {
        fetchMock.mockResolvedValue(
            textResponse('{"detail":"unknown model id"}', { status: 422 })
        );

        const result = await makeApi().streamChat(baseParams());

        expect(result.status).toBe(422);
        expect(result.text).toBe('{"detail":"unknown model id"}');
        expect(result.errorMessage).toBeUndefined();
    });

    it('populates errorMessage with no status when the fetch itself fails', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

        const onChunk = vi.fn();
        const result = await makeApi().streamChat({ ...baseParams(), onChunk });

        expect(result.status).toBeUndefined();
        expect(result.errorMessage).toBe('Failed to fetch');
        expect(result.text).toBe('');
        expect(onChunk).not.toHaveBeenCalled();
    });

    it('invariant 14: forwards the abort signal and rethrows an AbortError', async () => {
        const controller = new AbortController();
        fetchMock.mockRejectedValue(new DOMException('The user aborted a request.', 'AbortError'));

        await expect(
            makeApi().streamChat({ ...baseParams(), signal: controller.signal })
        ).rejects.toMatchObject({ name: 'AbortError' });
        expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    });
});
