import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendStreamingRequest } from './streamingFetch';

const encoder = new TextEncoder();

/** A stream that hands back every part and then closes cleanly. */
const streamOf = (...parts: Uint8Array[]) =>
    new ReadableStream<Uint8Array>({
        start(controller) {
            parts.forEach((part) => controller.enqueue(part));
            controller.close();
        },
    });

/**
 * A stream that hands back every part and then errors, simulating a connection dropped
 * mid-body. `highWaterMark: 0` keeps parts out of the internal queue until they are actually
 * read, so the error never clears an un-read part.
 */
const droppingStreamOf = (error: unknown, ...parts: Uint8Array[]) => {
    const pending = [...parts];
    return new ReadableStream<Uint8Array>(
        {
            pull(controller) {
                const next = pending.shift();
                if (next) {
                    controller.enqueue(next);
                    return;
                }
                controller.error(error);
            },
        },
        { highWaterMark: 0 }
    );
};

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

describe('sendStreamingRequest', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('parses a JSON body and reports status, lower-cased headers and rawText', async () => {
        fetchMock.mockResolvedValue(
            textResponse('{"resourceType":"Patient","id":"p1"}', {
                status: 201,
                headers: { 'Content-Type': 'application/fhir+json', 'X-Request-Id': 'req-9' },
            })
        );

        const result = await sendStreamingRequest({
            url: 'https://fhir.example.com/4_0_0/Patient',
            method: 'GET',
            headers: {},
        });

        expect(result.status).toBe(201);
        expect(result.json).toEqual({ resourceType: 'Patient', id: 'p1' });
        expect(result.rawText).toBe('{"resourceType":"Patient","id":"p1"}');
        expect(result.headers['content-type']).toBe('application/fhir+json');
        expect(result.headers['x-request-id']).toBe('req-9');
        expect(result.incomplete).toBeUndefined();
    });

    it('fires onHeaders with the status and headers before any body chunk is delivered', async () => {
        const order: string[] = [];
        fetchMock.mockResolvedValue(
            textResponse('{"ok":true}', { status: 202, headers: { 'X-Trace': 'abc' } })
        );

        const seen: { status?: number; headers?: Record<string, string> } = {};
        await sendStreamingRequest({
            url: 'https://fhir.example.com/x',
            method: 'GET',
            headers: {},
            onHeaders: (status, headers) => {
                order.push('headers');
                seen.status = status;
                seen.headers = headers;
            },
            onChunk: () => order.push('chunk'),
        });

        expect(order).toEqual(['headers', 'chunk']);
        expect(seen.status).toBe(202);
        expect(seen.headers).toEqual({ 'x-trace': 'abc' });
    });

    it('fires onChunk once per chunk with the decoded text of that chunk', async () => {
        fetchMock.mockResolvedValue(
            streamResponse(streamOf(encoder.encode('{"a":'), encoder.encode('1}')))
        );

        const chunks: string[] = [];
        const result = await sendStreamingRequest({
            url: 'https://fhir.example.com/x',
            method: 'GET',
            headers: {},
            onChunk: (text) => chunks.push(text),
        });

        expect(chunks).toEqual(['{"a":', '1}']);
        expect(result.rawText).toBe('{"a":1}');
        expect(result.json).toEqual({ a: 1 });
    });

    it('invariant 11: reassembles a multi-byte character split across a chunk boundary (one decoder)', async () => {
        // '€' is E2 82 AC in UTF-8 — split so two of its three bytes arrive in the first chunk.
        const euro = encoder.encode('€');
        expect(Array.from(euro)).toEqual([0xe2, 0x82, 0xac]);
        fetchMock.mockResolvedValue(
            streamResponse(
                streamOf(
                    new Uint8Array([...encoder.encode('"cost:'), euro[0], euro[1]]),
                    new Uint8Array([euro[2], ...encoder.encode('5"')])
                )
            )
        );

        const chunks: string[] = [];
        const result = await sendStreamingRequest({
            url: 'https://fhir.example.com/x',
            method: 'GET',
            headers: {},
            onChunk: (text) => chunks.push(text),
        });

        expect(chunks.join('')).toBe('"cost:€5"');
        expect(result.rawText).toBe('"cost:€5"');
        expect(result.json).toBe('cost:€5');
    });

    it('never throws on an unparseable body: json is undefined but rawText survives intact', async () => {
        fetchMock.mockResolvedValue(
            textResponse('<html><body>502 Bad Gateway</body></html>', {
                status: 502,
                headers: { 'content-type': 'text/html' },
            })
        );

        const result = await sendStreamingRequest({
            url: 'https://fhir.example.com/x',
            method: 'GET',
            headers: {},
        });

        expect(result.json).toBeUndefined();
        expect(result.rawText).toBe('<html><body>502 Bad Gateway</body></html>');
        expect(result.status).toBe(502);
    });

    it('invariant 14: a mid-stream drop resolves with partial data, the real status and incomplete=true', async () => {
        const euro = encoder.encode('€');
        fetchMock.mockResolvedValue(
            streamResponse(
                droppingStreamOf(
                    new Error('connection reset by peer'),
                    encoder.encode('{"partial":'),
                    // Drops after only two of the three bytes of '€' arrived.
                    new Uint8Array([euro[0], euro[1]])
                ),
                { status: 200, headers: { 'content-type': 'application/fhir+json' } }
            )
        );

        const chunks: string[] = [];
        const result = await sendStreamingRequest({
            url: 'https://fhir.example.com/x',
            method: 'GET',
            headers: {},
            onChunk: (text) => chunks.push(text),
        });

        expect(result.incomplete).toBe(true);
        expect(result.status).toBe(200);
        expect(result.json).toBeUndefined();
        // The final flushing decode() emits the dangling partial sequence as U+FFFD rather
        // than silently dropping the bytes that did arrive.
        expect(result.rawText).toBe('{"partial":�');
        expect(chunks).toEqual(['{"partial":', '']);
        expect(result.headers['content-type']).toBe('application/fhir+json');
    });

    it('invariant 14: rethrows an AbortError raised by fetch itself', async () => {
        fetchMock.mockRejectedValue(new DOMException('The user aborted a request.', 'AbortError'));

        await expect(
            sendStreamingRequest({ url: 'https://fhir.example.com/x', method: 'GET', headers: {} })
        ).rejects.toThrow('The user aborted a request.');
    });

    it('invariant 14: rethrows an AbortError raised mid-stream instead of degrading to partial data', async () => {
        fetchMock.mockResolvedValue(
            streamResponse(
                droppingStreamOf(
                    new DOMException('The user aborted a request.', 'AbortError'),
                    encoder.encode('{"partial":')
                )
            )
        );

        await expect(
            sendStreamingRequest({ url: 'https://fhir.example.com/x', method: 'GET', headers: {} })
        ).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('reports a fetch-level network failure as {error} with no status and an empty rawText', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

        const result = await sendStreamingRequest({
            url: 'https://fhir.example.com/x',
            method: 'GET',
            headers: {},
        });

        expect(result.status).toBeUndefined();
        expect(result.json).toEqual({ error: 'Failed to fetch' });
        expect(result.rawText).toBe('');
        expect(result.headers).toEqual({});
    });

    it('falls back to response.text() for a body-less response and still fires onChunk', async () => {
        fetchMock.mockResolvedValue(
            streamResponse(null, { status: 200, text: '{"fallback":true}' })
        );

        const chunks: string[] = [];
        const result = await sendStreamingRequest({
            url: 'https://fhir.example.com/x',
            method: 'GET',
            headers: {},
            onChunk: (text) => chunks.push(text),
        });

        expect(chunks).toEqual(['{"fallback":true}']);
        expect(result.rawText).toBe('{"fallback":true}');
        expect(result.json).toEqual({ fallback: true });
    });

    it('JSON-stringifies data into the request body and passes the url, method and signal through', async () => {
        fetchMock.mockResolvedValue(textResponse('{}'));
        const controller = new AbortController();

        await sendStreamingRequest({
            url: 'https://fhir.example.com/4_0_0/Patient/p1/$merge',
            method: 'POST',
            data: { resourceType: 'Patient', id: 'p1' },
            headers: {},
            signal: controller.signal,
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://fhir.example.com/4_0_0/Patient/p1/$merge');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({ resourceType: 'Patient', id: 'p1' });
        expect(init.signal).toBe(controller.signal);
    });

    it('sends no request body when data is omitted', async () => {
        fetchMock.mockResolvedValue(textResponse('{}'));

        await sendStreamingRequest({ url: 'https://fhir.example.com/x', method: 'DELETE', headers: {} });

        expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
        expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    });

    it('passes caller-built headers (including Authorization) to fetch verbatim', async () => {
        fetchMock.mockResolvedValue(textResponse('{}'));
        const headers = {
            Authorization: 'Bearer caller-owned-token',
            'Content-Type': 'application/fhir+json',
            'Origin-Service': 'fhir-ui',
        };

        await sendStreamingRequest({ url: 'https://other.example.com/x', method: 'GET', headers });

        // This module is deliberately auth-agnostic: it neither adds, strips nor rewrites headers.
        expect(fetchMock.mock.calls[0][1].headers).toEqual(headers);
    });
});
