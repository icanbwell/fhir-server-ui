import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../utils/auth.utils', () => ({ logout: vi.fn(), removeAuthData: vi.fn() }));

import { logout } from '../utils/auth.utils';
import FhirApi from './fhirApi';

const mockLogout = vi.mocked(logout);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const FHIR_URL = 'https://fhir.example.com';

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
 * read, so erroring never discards an un-read part.
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

const bundleOf = (entryCount: number) =>
    JSON.stringify({
        resourceType: 'Bundle',
        entry: Array.from({ length: entryCount }, (_unused, index) => ({
            resource: { resourceType: 'Patient', id: `p${index}` },
        })),
    });

const fetchMock = vi.fn();

const makeApi = (overrides?: { setUserDetails?: any; onRequest?: any }) =>
    new FhirApi({
        fhirUrl: FHIR_URL,
        setUserDetails: overrides?.setUserDetails,
        onRequest: overrides?.onRequest,
    });

/** The absolute URL the stubbed fetch was called with, parsed. */
const fetchedUrl = () => new URL(fetchMock.mock.calls[0][0] as string);

describe('FhirApi', () => {
    beforeEach(() => {
        localStorage.clear();
        mockLogout.mockReset();
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getUrl', () => {
        it('builds the R4 search path for a resource type and injects the list defaults', () => {
            const url = makeApi().getUrl({ resourceType: 'Patient' });

            expect(url.origin).toBe(window.location.origin);
            expect(url.pathname).toBe('/4_0_0/Patient');
            expect(url.searchParams.get('_count')).toBe('10');
            expect(url.searchParams.get('_metaUuid')).toBe('1');
        });

        it('appends the id, then the operation after the id', () => {
            const url = makeApi().getUrl({
                resourceType: 'Patient',
                id: 'patient-1',
                operation: '$everything',
            });

            expect(url.pathname).toBe('/4_0_0/Patient/patient-1/$everything');
            // A single-resource read is not a list, so no default page size is injected.
            expect(url.searchParams.has('_count')).toBe(false);
            expect(url.searchParams.get('_metaUuid')).toBe('1');
        });

        it('accepts a queryString with or without a leading question mark', () => {
            const api = makeApi();

            const withMark = api.getUrl({
                resourceType: 'Patient',
                queryString: '?name=smith&gender=female',
            });
            const withoutMark = api.getUrl({
                resourceType: 'Patient',
                queryString: 'name=smith&gender=female',
            });

            expect(withMark.pathname).toBe('/4_0_0/Patient');
            expect(withMark.searchParams.get('name')).toBe('smith');
            expect(withMark.searchParams.get('gender')).toBe('female');
            expect(withoutMark.pathname).toBe('/4_0_0/Patient');
            expect(withoutMark.search).toBe(withMark.search);
        });

        it('invariant 7: splits each queryParameter on the FIRST "=" so values containing "=" survive', () => {
            const url = makeApi().getUrl({
                resourceType: 'Patient',
                queryParameters: [
                    '_source=https://ex.com/a?b=c',
                    '_security=https://ex.org/codes|dGVzdA==',
                ],
            });

            expect(url.searchParams.get('_source')).toBe('https://ex.com/a?b=c');
            expect(url.searchParams.get('_security')).toBe('https://ex.org/codes|dGVzdA==');
        });

        it('invariant 7: appends repeated query parameter names instead of replacing them', () => {
            const url = makeApi().getUrl({
                resourceType: 'Condition',
                queryParameters: ['code=http://loinc.org|1234-5', 'code=http://loinc.org|6789-0'],
            });

            expect(url.searchParams.getAll('code')).toEqual([
                'http://loinc.org|1234-5',
                'http://loinc.org|6789-0',
            ]);
        });
    });

    describe('addMissingRequiredParams', () => {
        it('injects _count=10 for a search with no id', () => {
            const params = makeApi().addMissingRequiredParams({
                queryParams: new URLSearchParams('name=smith'),
                resourceType: 'Patient',
            });

            expect(params.get('_count')).toBe('10');
            expect(params.get('name')).toBe('smith');
        });

        it('does not inject _count when an id pins the request to one resource', () => {
            const params = makeApi().addMissingRequiredParams({
                queryParams: new URLSearchParams(),
                id: 'patient-1',
                resourceType: 'Patient',
            });

            expect(params.has('_count')).toBe(false);
            expect(params.get('_metaUuid')).toBe('1');
        });

        it('injects _count for a _history listing (as id or as operation)', () => {
            const api = makeApi();

            const asId = api.addMissingRequiredParams({
                queryParams: new URLSearchParams(),
                id: '_history',
                resourceType: 'Patient',
            });
            const asOperation = api.addMissingRequiredParams({
                queryParams: new URLSearchParams(),
                id: 'patient-1',
                resourceType: 'Patient',
                operation: '_history',
            });

            expect(asId.get('_count')).toBe('10');
            expect(asOperation.get('_count')).toBe('10');
        });

        it('never overrides a caller-supplied _count', () => {
            const params = makeApi().addMissingRequiredParams({
                queryParams: new URLSearchParams('_count=250'),
                resourceType: 'Patient',
            });

            expect(params.getAll('_count')).toEqual(['250']);
        });

        it('injects _metaUuid=1 unless the caller asked for _format=json', () => {
            const api = makeApi();

            const defaultFormat = api.addMissingRequiredParams({
                queryParams: new URLSearchParams(),
                resourceType: 'Patient',
            });
            const jsonFormat = api.addMissingRequiredParams({
                queryParams: new URLSearchParams('_format=json'),
                resourceType: 'Patient',
            });
            const preExisting = api.addMissingRequiredParams({
                queryParams: new URLSearchParams('_metaUuid=0'),
                resourceType: 'Patient',
            });

            expect(defaultFormat.get('_metaUuid')).toBe('1');
            expect(jsonFormat.has('_metaUuid')).toBe(false);
            expect(preExisting.getAll('_metaUuid')).toEqual(['0']);
        });

        it('invariant 8: bounds an AuditEvent query with two inclusive date bounds 7 days apart', () => {
            vi.useFakeTimers({ toFake: ['Date'] });
            vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

            const params = makeApi().addMissingRequiredParams({
                queryParams: new URLSearchParams(),
                resourceType: 'AuditEvent',
            });

            expect(params.getAll('date')).toEqual(['ge2026-06-08', 'le2026-06-15']);
            const [start, end] = params.getAll('date').map((value) => new Date(value.slice(2)));
            expect((end.getTime() - start.getTime()) / 86400000).toBe(7);
        });

        it('invariant 8: leaves a caller-supplied AuditEvent date untouched', () => {
            vi.useFakeTimers({ toFake: ['Date'] });
            vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));

            const params = makeApi().addMissingRequiredParams({
                queryParams: new URLSearchParams('date=gt2019-01-01'),
                resourceType: 'AuditEvent',
            });

            expect(params.getAll('date')).toEqual(['gt2019-01-01']);
        });

        it('does not add a date window to non-AuditEvent resource types', () => {
            const params = makeApi().addMissingRequiredParams({
                queryParams: new URLSearchParams(),
                resourceType: 'Patient',
            });

            expect(params.has('date')).toBe(false);
        });
    });

    describe('getResourceCount', () => {
        it('invariant 10: asks for id-only elements and limit+1 rows rather than _total=accurate', async () => {
            fetchMock.mockResolvedValue(textResponse(bundleOf(0)));

            await makeApi().getResourceCount({
                resourceType: 'Patient',
                queryParameters: ['name=smith'],
                limit: 10,
            });

            const url = fetchedUrl();
            expect(url.origin).toBe(FHIR_URL);
            expect(url.pathname).toBe('/4_0_0/Patient');
            expect(url.searchParams.get('_elements')).toBe('id');
            // set(), not append() — the injected default _count=10 is replaced, not duplicated.
            expect(url.searchParams.getAll('_count')).toEqual(['11']);
            expect(url.searchParams.has('_total')).toBe(false);
            expect(url.searchParams.get('name')).toBe('smith');
        });

        it('returns the exact entry count when the server returns fewer rows than the limit', async () => {
            fetchMock.mockResolvedValue(textResponse(bundleOf(3)));

            const result = await makeApi().getResourceCount({ resourceType: 'Patient', limit: 10 });

            expect(result).toEqual({ count: 3, atLimit: false });
        });

        it('invariant 10: clamps to the limit and sets atLimit when limit+1 rows come back', async () => {
            fetchMock.mockResolvedValue(textResponse(bundleOf(11)));

            const result = await makeApi().getResourceCount({ resourceType: 'Patient', limit: 10 });

            expect(result).toEqual({ count: 10, atLimit: true });
        });

        it('reports exactly the limit without atLimit when the server returns precisely the limit', async () => {
            fetchMock.mockResolvedValue(textResponse(bundleOf(10)));

            const result = await makeApi().getResourceCount({ resourceType: 'Patient', limit: 10 });

            expect(result).toEqual({ count: 10, atLimit: false });
        });

        it('treats a bundle with no entry array as zero', async () => {
            fetchMock.mockResolvedValue(
                textResponse(JSON.stringify({ resourceType: 'Bundle', total: 0 }))
            );

            const result = await makeApi().getResourceCount({ resourceType: 'Patient', limit: 10 });

            expect(result).toEqual({ count: 0, atLimit: false });
        });

        it('returns null (not zero) on a non-2xx response so a failure is never shown as a count', async () => {
            fetchMock.mockResolvedValue(
                textResponse('{"resourceType":"OperationOutcome"}', { status: 500 })
            );

            const result = await makeApi().getResourceCount({ resourceType: 'Patient', limit: 10 });

            expect(result).toBeNull();
        });

        it('invariant 9: drops the injected AuditEvent date window for an exact id= lookup', async () => {
            vi.useFakeTimers({ toFake: ['Date'] });
            vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
            fetchMock.mockResolvedValue(textResponse(bundleOf(1)));

            const result = await makeApi().getResourceCount({
                resourceType: 'AuditEvent',
                queryParameters: ['id=audit-from-2019'],
                limit: 1,
            });

            const url = fetchedUrl();
            expect(url.searchParams.getAll('date')).toEqual([]);
            expect(url.searchParams.get('id')).toBe('audit-from-2019');
            expect(url.searchParams.get('_count')).toBe('2');
            expect(result).toEqual({ count: 1, atLimit: false });
        });

        it('invariant 9: keeps the AuditEvent date window for a list count with no id= parameter', async () => {
            vi.useFakeTimers({ toFake: ['Date'] });
            vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
            fetchMock.mockResolvedValue(textResponse(bundleOf(2)));

            await makeApi().getResourceCount({
                resourceType: 'AuditEvent',
                queryParameters: ['agent-patient=Patient/p1'],
                limit: 10,
            });

            const url = fetchedUrl();
            expect(url.searchParams.getAll('date')).toEqual(['ge2026-06-08', 'le2026-06-15']);
            expect(url.searchParams.get('agent-patient')).toBe('Patient/p1');
        });

        it('forwards the abort signal to fetch', async () => {
            fetchMock.mockResolvedValue(textResponse(bundleOf(1)));
            const controller = new AbortController();

            await makeApi().getResourceCount({
                resourceType: 'Patient',
                limit: 5,
                signal: controller.signal,
            });

            expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
        });
    });

    describe('getBundleAsync', () => {
        it('requests the built URL and forwards raw chunks and byte progress to the caller', async () => {
            const body = '{"resourceType":"Bundle","entry":[{"resource":{"id":"p1"}}]}';
            fetchMock.mockResolvedValue(
                textResponse(body, { headers: { 'content-length': String(body.length) } })
            );

            const chunks: Uint8Array[] = [];
            const progress: Array<[number, number | undefined]> = [];
            const result = await makeApi().getBundleAsync(
                { resourceType: 'Patient', id: 'p1', operation: '$everything' },
                {
                    onChunk: (chunk) => chunks.push(chunk),
                    onProgress: (received, total) => progress.push([received, total]),
                }
            );

            const url = fetchedUrl();
            expect(url.pathname).toBe('/4_0_0/Patient/p1/$everything');
            expect(url.origin).toBe(FHIR_URL);
            expect(result.status).toBe(200);
            expect(result.incomplete).toBe(false);
            expect(result.json).toEqual({
                resourceType: 'Bundle',
                entry: [{ resource: { id: 'p1' } }],
            });
            expect(chunks).toHaveLength(1);
            expect(decoder.decode(chunks[0])).toBe(body);
            expect(progress).toEqual([[body.length, body.length]]);
        });

        it('invariant 13: reports an unknown total when the response is content-encoded', async () => {
            const body = '{"resourceType":"Bundle"}';
            fetchMock.mockResolvedValue(
                textResponse(body, {
                    headers: { 'content-length': '12', 'content-encoding': 'gzip' },
                })
            );

            const progress: Array<[number, number | undefined]> = [];
            await makeApi().getBundleAsync(
                { resourceType: 'Patient' },
                { onProgress: (received, total) => progress.push([received, total]) }
            );

            // Content-Length is the compressed size; reader.read() yields decompressed bytes, so
            // the total must be reported as unknown rather than a number the progress races past.
            expect(progress).toEqual([[body.length, undefined]]);
        });
    });

    describe('getResource', () => {
        it('reads a single resource by id from the configured FHIR server', async () => {
            fetchMock.mockResolvedValue(
                textResponse('{"resourceType":"Patient","id":"123","gender":"female"}')
            );

            const result = await makeApi().getResource({ resourceType: 'Patient', id: '123' });

            expect(fetchMock.mock.calls[0][0]).toBe(`${FHIR_URL}/4_0_0/Patient/123/`);
            expect(fetchMock.mock.calls[0][1].method).toBe('GET');
            expect(result.status).toBe(200);
            expect(result.json).toEqual({ resourceType: 'Patient', id: '123', gender: 'female' });
        });
    });

    describe('mergeResource', () => {
        it('POSTs the resource to $merge with smartMerge=true by default', async () => {
            fetchMock.mockResolvedValue(textResponse('[{"updated":true,"id":"123"}]'));
            const resource = { resourceType: 'Patient', id: '123', gender: 'male' };

            const result = await makeApi().mergeResource({
                resourceType: 'Patient',
                id: '123',
                resource,
            });

            const [url, init] = fetchMock.mock.calls[0];
            expect(url).toBe(`${FHIR_URL}/4_0_0/Patient/123/$merge?smartMerge=true`);
            expect(init.method).toBe('POST');
            expect(JSON.parse(init.body)).toEqual(resource);
            expect(result.json).toEqual([{ updated: true, id: '123' }]);
        });

        it('passes smartMerge=false through when the caller opts out', async () => {
            fetchMock.mockResolvedValue(textResponse('[]'));

            await makeApi().mergeResource({
                resourceType: 'Observation',
                id: 'obs-1',
                resource: { resourceType: 'Observation', id: 'obs-1' },
                smartMerge: false,
            });

            expect(fetchMock.mock.calls[0][0]).toBe(
                `${FHIR_URL}/4_0_0/Observation/obs-1/$merge?smartMerge=false`
            );
        });
    });

    describe('sendRequest', () => {
        it('invariant 11: reassembles a multi-byte character split across a chunk boundary', async () => {
            // '€' is E2 82 AC in UTF-8 — decoding each chunk with its own decoder would corrupt it.
            const euro = encoder.encode('€');
            fetchMock.mockResolvedValue(
                streamResponse(
                    streamOf(
                        new Uint8Array([...encoder.encode('{"cost":"'), euro[0], euro[1]]),
                        new Uint8Array([euro[2], ...encoder.encode('5"}')])
                    )
                )
            );

            const chunks: string[] = [];
            const result = await makeApi().sendRequest({
                method: 'GET',
                urlPath: '/4_0_0/Patient',
                onChunk: (text) => chunks.push(text),
            });

            expect(chunks.join('')).toBe('{"cost":"€5"}');
            expect(result.rawText).toBe('{"cost":"€5"}');
            expect(result.json).toEqual({ cost: '€5' });
        });

        it('invariant 1: refuses a cross-origin urlPath before any fetch happens', async () => {
            const onRequest = vi.fn();

            const result = await makeApi({ onRequest }).sendRequest({
                method: 'GET',
                urlPath: 'https://evil.example.com/steal-the-token',
            });

            expect(fetchMock).not.toHaveBeenCalled();
            expect(onRequest).not.toHaveBeenCalled();
            expect(result.json).toEqual({
                error: 'Request path must stay on the configured FHIR server',
            });
            expect(result.status).toBeUndefined();
        });

        it('invariant 1: neutralises a scheme-relative path into a path on the configured server', async () => {
            fetchMock.mockResolvedValue(textResponse('{}'));

            await makeApi().sendRequest({ method: 'GET', urlPath: '//evil.example.com/x' });

            expect(fetchMock.mock.calls[0][0]).toBe(`${FHIR_URL}/evil.example.com/x`);
        });

        it('invariant 2: the session token owns Authorization and caller headers merge case-insensitively', async () => {
            localStorage.setItem('jwt', 'real-session-token');
            fetchMock.mockResolvedValue(textResponse('{}'));

            await makeApi().sendRequest({
                method: 'POST',
                urlPath: '/4_0_0/Patient',
                data: { resourceType: 'Patient' },
                headers: {
                    authorization: 'Bearer attacker-supplied',
                    'content-type': 'application/json',
                },
            });

            const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
            const names = Object.keys(headers).map((name) => name.toLowerCase());
            expect(headers['Authorization']).toBe('Bearer real-session-token');
            expect(names.filter((name) => name === 'authorization')).toHaveLength(1);
            // The caller's Content-Type override wins over BaseApi's application/fhir+json
            // default, but only one content-type entry survives the merge.
            expect(headers['content-type']).toBe('application/json');
            expect(names.filter((name) => name === 'content-type')).toHaveLength(1);
        });

        it('surfaces the status and response headers via onHeaders before the body completes', async () => {
            const order: string[] = [];
            fetchMock.mockResolvedValue(
                textResponse('{"resourceType":"OperationOutcome"}', {
                    status: 403,
                    headers: { 'X-Request-Id': 'req-7', 'Content-Type': 'application/fhir+json' },
                })
            );

            const seen: { status?: number; headers?: Record<string, string> } = {};
            const result = await makeApi().sendRequest({
                method: 'GET',
                urlPath: '/4_0_0/Patient',
                onHeaders: (status, headers) => {
                    order.push('headers');
                    seen.status = status;
                    seen.headers = headers;
                },
                onChunk: () => order.push('chunk'),
            });

            expect(order).toEqual(['headers', 'chunk']);
            expect(seen.status).toBe(403);
            expect(seen.headers?.['x-request-id']).toBe('req-7');
            expect(result.headers['content-type']).toBe('application/fhir+json');
            expect(result.status).toBe(403);
        });

        it('reports a network failure as {error} json rather than a blank response', async () => {
            fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

            const result = await makeApi().sendRequest({ method: 'GET', urlPath: '/4_0_0/Patient' });

            expect(result.status).toBeUndefined();
            expect(result.json).toEqual({ error: 'Failed to fetch' });
            expect(result.rawText).toBe('');
            expect(result.incomplete).toBe(true);
        });

        it('invariant 14: rethrows an AbortError instead of reporting it as a failed response', async () => {
            fetchMock.mockRejectedValue(new DOMException('The user aborted a request.', 'AbortError'));

            await expect(
                makeApi().sendRequest({ method: 'GET', urlPath: '/4_0_0/Patient' })
            ).rejects.toMatchObject({ name: 'AbortError' });
        });

        it('invariant 12: a mid-stream drop returns the partial body plus incomplete=true', async () => {
            fetchMock.mockResolvedValue(
                streamResponse(
                    droppingStreamOf(
                        new Error('connection reset by peer'),
                        encoder.encode('{"resourceType":"Bundle","entry":[')
                    ),
                    { status: 200, headers: { 'content-type': 'application/fhir+json' } }
                )
            );

            const result = await makeApi().sendRequest({ method: 'GET', urlPath: '/4_0_0/Patient' });

            expect(result.incomplete).toBe(true);
            expect(result.status).toBe(200);
            expect(result.rawText).toBe('{"resourceType":"Bundle","entry":[');
            // Truncated JSON must not be passed off as a parsed result.
            expect(result.json).toBeUndefined();
        });

        it('invariant 5: a 401 from the configured FHIR server logs the session out', async () => {
            fetchMock.mockResolvedValue(
                textResponse('{"resourceType":"OperationOutcome"}', { status: 401 })
            );
            const setUserDetails = vi.fn();

            const result = await makeApi({ setUserDetails }).sendRequest({
                method: 'GET',
                urlPath: '/4_0_0/Patient',
            });

            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockLogout).toHaveBeenCalledWith(setUserDetails);
            expect(result.status).toBe(401);
        });

        it('invariant 5: a 403 is a permissions answer, not a logout', async () => {
            fetchMock.mockResolvedValue(
                textResponse('{"resourceType":"OperationOutcome"}', { status: 403 })
            );
            const setUserDetails = vi.fn();

            const result = await makeApi({ setUserDetails }).sendRequest({
                method: 'GET',
                urlPath: '/4_0_0/Patient',
            });

            expect(mockLogout).not.toHaveBeenCalled();
            expect(result.status).toBe(403);
        });

        it('records the request path and method for the last-request indicator', async () => {
            fetchMock.mockResolvedValue(textResponse('{}'));
            const onRequest = vi.fn();

            await makeApi({ onRequest }).sendRequest({
                method: 'PUT',
                urlPath: '/4_0_0/Patient?_count=5',
                data: { resourceType: 'Patient' },
            });

            expect(onRequest).toHaveBeenCalledTimes(1);
            expect(onRequest).toHaveBeenCalledWith({
                method: 'PUT',
                url: '/4_0_0/Patient?_count=5',
            });
        });

        it('strips this app own origin from a urlPath so it still resolves to the FHIR server', async () => {
            fetchMock.mockResolvedValue(textResponse('{"id":"p1"}'));

            const result = await makeApi().sendRequest({
                method: 'GET',
                urlPath: `${window.location.origin}/4_0_0/Patient/p1`,
            });

            expect(fetchMock.mock.calls[0][0]).toBe(`${FHIR_URL}/4_0_0/Patient/p1`);
            expect(result.json).toEqual({ id: 'p1' });
        });

        it('BUG-007: delivers the whole body through onChunk, flushing the decoder at the end', async () => {
            // fhirApi.ts:184-195 wraps onChunk in its own TextDecoder used with
            // `{ stream: true }` and never makes the final argument-less decode() call that
            // BaseApi.streamRequest (baseApi.ts:249) and BaileyApi.streamChat
            // (baileyApi.ts:60-63) both make. When a body ends mid-multi-byte-character — a
            // truncated or dropped response, which this stack explicitly supports via
            // `incomplete: true` — the trailing buffered bytes are silently dropped from the
            // streamed text while `rawText` still reports them. The API Console then displays
            // a body that disagrees with the response it received.
            const truncated = encoder.encode('ok€').slice(0, 3); // 'ok' + first byte of '€'
            fetchMock.mockResolvedValue(streamResponse(streamOf(truncated)));
            const received: string[] = [];

            const result = await makeApi().sendRequest({
                method: 'GET',
                urlPath: '/4_0_0/Patient',
                onChunk: (text: string) => received.push(text),
            });

            expect(result.rawText).toBe('ok�');
            expect(received.join('')).toBe(result.rawText);
        });
    });
});
