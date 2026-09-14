import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAuthInfo } = vi.hoisted(() => ({ mockGetAuthInfo: vi.fn() }));

vi.mock('../utils/auth.utils', () => ({ logout: vi.fn(), removeAuthData: vi.fn() }));
vi.mock('../utils/authUrlProvider', () => ({
    default: vi.fn().mockImplementation(function AuthUrlProviderMock() {
        return { getAuthInfo: mockGetAuthInfo };
    }),
}));

import { logout } from '../utils/auth.utils';
import BaseApi from './baseApi';

const mockLogout = vi.mocked(logout);

const FHIR_URL = 'https://fhir.example.com';
const APP_ORIGIN = window.location.origin;

const encode = (s: string) => new TextEncoder().encode(s);

/** A real ReadableStream so the production reader loop actually runs. */
const streamOf = (...parts: Uint8Array[]): ReadableStream<Uint8Array> =>
    new ReadableStream<Uint8Array>({
        start(controller) {
            parts.forEach((part) => controller.enqueue(part));
            controller.close();
        },
    });

/**
 * A stream that delivers `parts` and then drops mid-body. Uses `pull` rather than enqueueing
 * everything in `start`: `controller.error()` discards any still-queued chunks, so a synchronous
 * enqueue-then-error would never deliver the partial body the production code is supposed to keep.
 */
const failingStreamAfter = (...parts: Uint8Array[]): ReadableStream<Uint8Array> => {
    const pending = [...parts];
    return new ReadableStream<Uint8Array>({
        pull(controller) {
            const next = pending.shift();
            if (next) {
                controller.enqueue(next);
            } else {
                controller.error(new Error('socket hang up'));
            }
        },
    });
};

/** Same delivery discipline, but the drop is an abort rather than a network failure. */
const abortingStreamAfter = (...parts: Uint8Array[]): ReadableStream<Uint8Array> => {
    const pending = [...parts];
    return new ReadableStream<Uint8Array>({
        pull(controller) {
            const next = pending.shift();
            if (next) {
                controller.enqueue(next);
            } else {
                controller.error(abortError());
            }
        },
    });
};

const makeResponse = ({
    status = 200,
    headers = {},
    body,
}: {
    status?: number;
    headers?: Record<string, string>;
    body?: ReadableStream<Uint8Array> | null;
} = {}): Response =>
    ({
        status,
        headers: new Headers(headers),
        body: body === undefined ? streamOf(encode('{}')) : body,
        text: async () => '',
    }) as unknown as Response;

const abortError = () => Object.assign(new Error('aborted'), { name: 'AbortError' });

const newApi = (overrides: Partial<{
    fhirUrl: string | undefined;
    setUserDetails: any;
    onRequest: any;
}> = {}) =>
    new BaseApi({
        fhirUrl: FHIR_URL,
        setUserDetails: undefined,
        ...overrides,
    });

let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    mockGetAuthInfo.mockReturnValue({
        clientId: 'client',
        tokenForUserDetails: 'jwt',
        tokenToSendToFhirServer: 'jwt',
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const fetchedUrl = () => new URL(mockFetch.mock.calls[0][0] as string);
const fetchedInit = () => mockFetch.mock.calls[0][1] as RequestInit;
const fetchedHeaders = () => fetchedInit().headers as Record<string, string>;

describe('BaseApi URL resolution', () => {
    it('resolves a path-absolute urlString against the configured FHIR base without losing the base path', async () => {
        mockFetch.mockResolvedValue(makeResponse());
        const api = newApi({ fhirUrl: 'https://fhir.example.com/api/v1.0' });

        await api.getData({ urlString: '/4_0_0/Patient' });

        expect(fetchedUrl().toString()).toBe('https://fhir.example.com/api/v1.0/4_0_0/Patient');
    });

    it('appends to a base that already ends in a slash without doubling it', async () => {
        mockFetch.mockResolvedValue(makeResponse());
        const api = newApi({ fhirUrl: 'https://fhir.example.com/api/v1.0/' });

        await api.getData({ urlString: '4_0_0/Person' });

        expect(fetchedUrl().toString()).toBe('https://fhir.example.com/api/v1.0/4_0_0/Person');
    });

    it("strips this app's own origin from the urlString and re-resolves against the FHIR server", async () => {
        mockFetch.mockResolvedValue(makeResponse());
        const api = newApi();

        await api.getData({ urlString: `${APP_ORIGIN}/4_0_0/Patient?_count=5` });

        const url = fetchedUrl();
        expect(url.origin).toBe(FHIR_URL);
        expect(url.pathname).toBe('/4_0_0/Patient');
        expect(url.searchParams.get('_count')).toBe('5');
    });

    it('applies params onto the resolved URL, replacing an existing value of the same name', async () => {
        mockFetch.mockResolvedValue(makeResponse());
        const api = newApi();

        await api.getData({
            urlString: '/4_0_0/Patient?_count=1',
            params: { _count: '25', _format: 'json' },
        });

        const url = fetchedUrl();
        expect(url.searchParams.getAll('_count')).toEqual(['25']);
        expect(url.searchParams.get('_format')).toBe('json');
    });

    it('reports the request as method + path only, never the absolute URL (INV-1)', async () => {
        mockFetch.mockResolvedValue(makeResponse());
        const onRequest = vi.fn();
        const api = newApi({ onRequest });

        await api.request({ urlString: '/4_0_0/Patient', params: { _count: '3' }, method: 'POST' });

        expect(onRequest).toHaveBeenCalledWith({ method: 'POST', url: '/4_0_0/Patient?_count=3' });
    });
});

describe('BaseApi token confinement (INV-1)', () => {
    it('refuses an absolute foreign-origin path without ever calling fetch', async () => {
        localStorage.setItem('jwt', 'session-token');
        const api = newApi();

        const result = await api.streamRequest({
            method: 'GET',
            urlString: 'https://evil.example.com/steal',
        });

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.status).toBeUndefined();
        expect(JSON.parse(result.text).error).toBe(
            'Request path must stay on the configured FHIR server'
        );
    });

    it('refuses an origin that merely looks like a subdomain-suffix of the FHIR server', async () => {
        localStorage.setItem('jwt', 'session-token');
        const api = newApi();

        const result = await api.streamRequest({
            method: 'GET',
            urlString: 'https://fhir.example.com.evil.example.net/4_0_0/Patient',
        });

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.incomplete).toBe(false);
        expect(result.chunks).toEqual([]);
    });

    it('confines a scheme-relative //host path to the FHIR origin instead of following it', async () => {
        mockFetch.mockResolvedValue(makeResponse());
        const api = newApi();

        await api.streamRequest({ method: 'GET', urlString: '//evil.example.com/steal' });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(fetchedUrl().origin).toBe(FHIR_URL);
    });

    it('confines a baseUrlOverride request to the override origin and refuses an escape from it', async () => {
        const api = newApi();

        const result = await api.streamRequest({
            method: 'GET',
            urlString: 'https://fhir.example.com/4_0_0/Binary/1',
            baseUrlOverride: APP_ORIGIN,
        });

        expect(mockFetch).not.toHaveBeenCalled();
        expect(JSON.parse(result.text).error).toBe(
            'Request path must stay on the configured FHIR server'
        );
    });

    it('sends a baseUrlOverride request to the override origin, not the configured FHIR server', async () => {
        mockFetch.mockResolvedValue(makeResponse());
        const api = newApi();

        await api.streamRequest({
            method: 'GET',
            urlString: '/4_0_0/Binary/abc',
            baseUrlOverride: APP_ORIGIN,
        });

        expect(fetchedUrl().origin).toBe(APP_ORIGIN);
        expect(fetchedUrl().pathname).toBe('/4_0_0/Binary/abc');
    });
});

describe('BaseApi.buildHeaders (INV-2)', () => {
    it('attaches the session token as a Bearer header', async () => {
        localStorage.setItem('jwt', 'session-token');
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().getData({ urlString: '/version' });

        expect(fetchedHeaders()['Authorization']).toBe('Bearer session-token');
    });

    it('omits Authorization entirely when no token is stored', async () => {
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().getData({ urlString: '/version' });

        const headers = fetchedHeaders();
        expect(Object.keys(headers).some((k) => k.toLowerCase() === 'authorization')).toBe(false);
    });

    it('ignores a caller-supplied Authorization header so the session token cannot be overridden', async () => {
        localStorage.setItem('jwt', 'session-token');
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().streamRequest({
            method: 'GET',
            urlString: '/4_0_0/Patient',
            headers: { Authorization: 'Bearer attacker-token' },
        });

        const headers = fetchedHeaders();
        const authEntries = Object.entries(headers).filter(
            ([k]) => k.toLowerCase() === 'authorization'
        );
        expect(authEntries).toEqual([['Authorization', 'Bearer session-token']]);
    });

    it('ignores a lower-cased authorization header too, and does not blank the token', async () => {
        localStorage.setItem('jwt', 'session-token');
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().streamRequest({
            method: 'GET',
            urlString: '/4_0_0/Patient',
            headers: { authorization: '' },
        });

        const headers = fetchedHeaders();
        const authEntries = Object.entries(headers).filter(
            ([k]) => k.toLowerCase() === 'authorization'
        );
        expect(authEntries).toEqual([['Authorization', 'Bearer session-token']]);
    });

    it('merges caller headers case-insensitively so only one Accept survives', async () => {
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().streamRequest({
            method: 'GET',
            urlString: '/4_0_0/Binary/1',
            headers: { accept: 'application/fhir+json' },
        });

        const headers = fetchedHeaders();
        const acceptEntries = Object.entries(headers).filter(([k]) => k.toLowerCase() === 'accept');
        expect(acceptEntries).toEqual([['accept', 'application/fhir+json']]);
    });

    it('sends the no-cache set and the Origin-Service marker on every request', async () => {
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().getData({ urlString: '/version' });

        expect(fetchedHeaders()).toMatchObject({
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
            'Origin-Service': 'fhir-ui',
            'Content-Type': 'application/fhir+json',
        });
    });

    it("reads the token from the key named by the provider's tokenToSendToFhirServer", async () => {
        localStorage.setItem('identityProvider', 'okta');
        localStorage.setItem('jwt', 'access-token-value');
        localStorage.setItem('id_token', 'id-token-value');
        mockGetAuthInfo.mockReturnValue({
            clientId: 'client',
            tokenForUserDetails: 'jwt',
            tokenToSendToFhirServer: 'id_token',
        });
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().getData({ urlString: '/version' });

        expect(mockGetAuthInfo).toHaveBeenCalledWith('okta');
        expect(fetchedHeaders()['Authorization']).toBe('Bearer id-token-value');
    });

    it('falls back to the jwt key when the provider does not name a token key', async () => {
        localStorage.setItem('identityProvider', 'okta');
        localStorage.setItem('jwt', 'access-token-value');
        localStorage.setItem('id_token', 'id-token-value');
        mockGetAuthInfo.mockReturnValue({
            clientId: 'client',
            tokenForUserDetails: 'jwt',
            tokenToSendToFhirServer: undefined,
        });
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().getData({ urlString: '/version' });

        expect(fetchedHeaders()['Authorization']).toBe('Bearer access-token-value');
    });

    it('propagates a provider-config failure out of header construction (characterization)', async () => {
        // Pins current behavior: a stale `identityProvider` whose env vars are gone makes every
        // request throw from buildHeaders rather than degrading to the 'jwt' default. See
        // .qa/domain-invariants.md "Suspicious Patterns" #6 — whether this should fail loudly or
        // fall back is a product decision, so it is pinned rather than asserted as correct.
        localStorage.setItem('identityProvider', 'retired-provider');
        mockGetAuthInfo.mockImplementation(() => {
            throw new Error('REACT_APP_AUTH_RETIRED-PROVIDER_CUSTOM_USERNAME is not defined');
        });

        await expect(newApi().getData({ urlString: '/version' })).rejects.toThrow(
            'REACT_APP_AUTH_RETIRED-PROVIDER_CUSTOM_USERNAME is not defined'
        );
        expect(mockFetch).not.toHaveBeenCalled();
    });
});

describe('BaseApi unauthorized handling (INV-5, INV-6)', () => {
    it('logs the user out on 401', async () => {
        const setUserDetails = vi.fn();
        mockFetch.mockResolvedValue(makeResponse({ status: 401 }));

        await newApi({ setUserDetails }).getData({ urlString: '/4_0_0/Patient' });

        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockLogout).toHaveBeenCalledWith(setUserDetails);
    });

    it('does NOT log the user out on 403 and still returns the response body', async () => {
        const setUserDetails = vi.fn();
        mockFetch.mockResolvedValue(
            makeResponse({
                status: 403,
                body: streamOf(encode('{"resourceType":"OperationOutcome","id":"forbidden"}')),
            })
        );

        const result = await newApi({ setUserDetails }).getData({ urlString: '/4_0_0/Patient' });

        expect(mockLogout).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(result.json.id).toBe('forbidden');
    });

    it('does NOT log the user out when a 401 comes from a baseUrlOverride origin', async () => {
        const setUserDetails = vi.fn();
        mockFetch.mockResolvedValue(makeResponse({ status: 401 }));

        await newApi({ setUserDetails }).streamRequest({
            method: 'GET',
            urlString: '/4_0_0/Binary/1',
            baseUrlOverride: APP_ORIGIN,
        });

        expect(mockLogout).not.toHaveBeenCalled();
    });

    it('does not attempt a logout when no setUserDetails was supplied', async () => {
        mockFetch.mockResolvedValue(makeResponse({ status: 401 }));

        const result = await newApi().getData({ urlString: '/4_0_0/Patient' });

        expect(mockLogout).not.toHaveBeenCalled();
        expect(result.status).toBe(401);
    });
});

describe('BaseApi streaming (INV-11, INV-13, INV-14)', () => {
    it('reassembles a multi-byte UTF-8 character split across two chunks', async () => {
        // '€' is E2 82 AC — split after the first byte so a per-chunk decoder would corrupt it.
        const euro = encode('{"v":"€"}');
        const splitAt = euro.indexOf(0xe2) + 1;
        mockFetch.mockResolvedValue(
            makeResponse({ body: streamOf(euro.slice(0, splitAt), euro.slice(splitAt)) })
        );

        const result = await newApi().getData({ urlString: '/4_0_0/Patient' });

        expect(result.json.v).toBe('€');
    });

    it('flushes a dangling partial multi-byte sequence at the very end of the body', async () => {
        const truncated = encode('ok€').slice(0, 3); // 'ok' + first byte of '€'
        mockFetch.mockResolvedValue(makeResponse({ body: streamOf(truncated) }));

        const result = await newApi().streamRequest({ method: 'GET', urlString: '/x' });

        // The final argument-less decode() emits U+FFFD for the buffered partial sequence instead
        // of silently dropping it.
        expect(result.text).toBe('ok�');
    });

    it('reports totalBytes from content-length when the body is not encoded', async () => {
        const onProgress = vi.fn();
        mockFetch.mockResolvedValue(
            makeResponse({
                headers: { 'content-length': '7' },
                body: streamOf(encode('abc'), encode('defg')),
            })
        );

        await newApi().getData({ urlString: '/x' }, { onProgress });

        expect(onProgress.mock.calls).toEqual([
            [3, 7],
            [7, 7],
        ]);
    });

    it('reports totalBytes as undefined when the response is content-encoded', async () => {
        const onProgress = vi.fn();
        mockFetch.mockResolvedValue(
            makeResponse({
                headers: { 'content-length': '7', 'content-encoding': 'gzip' },
                body: streamOf(encode('abcdefg')),
            })
        );

        await newApi().getData({ urlString: '/x' }, { onProgress });

        expect(onProgress).toHaveBeenCalledWith(7, undefined);
    });

    it('hands raw chunks to onChunk in arrival order', async () => {
        const onChunk = vi.fn();
        mockFetch.mockResolvedValue(
            makeResponse({ body: streamOf(encode('one'), encode('two')) })
        );

        await newApi().getData({ urlString: '/x' }, { onChunk });

        const seen = onChunk.mock.calls.map(([c]) => new TextDecoder().decode(c));
        expect(seen).toEqual(['one', 'two']);
    });

    it('surfaces status and headers via onHeaders before the body is consumed', async () => {
        const order: string[] = [];
        mockFetch.mockResolvedValue(
            makeResponse({ status: 201, headers: { etag: 'W/"1"' }, body: streamOf(encode('{}')) })
        );

        await newApi().streamRequest({
            method: 'POST',
            urlString: '/4_0_0/Patient',
            onHeaders: (status, headers) => order.push(`headers:${status}:${headers.etag}`),
            onChunk: () => order.push('chunk'),
        });

        expect(order).toEqual(['headers:201:W/"1"', 'chunk']);
    });

    it('returns the partial body with incomplete=true when the stream drops mid-response', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({ status: 200, body: failingStreamAfter(encode('{"partial":tr')) })
        );

        const result = await newApi().streamRequest({ method: 'GET', urlString: '/x' });

        expect(result.status).toBe(200);
        expect(result.text).toBe('{"partial":tr');
        expect(result.incomplete).toBe(true);
    });

    it('returns errorMessage and no status when fetch fails outright', async () => {
        mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

        const result = await newApi().streamRequest({ method: 'GET', urlString: '/x' });

        expect(result.status).toBeUndefined();
        expect(result.text).toBe('');
        expect(result.incomplete).toBe(true);
        expect(result.errorMessage).toBe('Failed to fetch');
    });

    it('rethrows an AbortError raised by fetch instead of degrading', async () => {
        mockFetch.mockRejectedValue(abortError());

        await expect(
            newApi().streamRequest({ method: 'GET', urlString: '/x' })
        ).rejects.toThrow('aborted');
    });

    it('rethrows an AbortError raised mid-stream instead of returning partial data', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({ body: abortingStreamAfter(encode('partial')) })
        );

        await expect(
            newApi().streamRequest({ method: 'GET', urlString: '/x' })
        ).rejects.toThrow('aborted');
    });

    it('collects binary chunks and leaves text empty in binary mode', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({ body: streamOf(encode('AB'), encode('CD')) })
        );

        const result = await newApi().streamRequest({
            method: 'GET',
            urlString: '/4_0_0/Binary/1',
            responseMode: 'binary',
        });

        expect(result.chunks.map((c) => new TextDecoder().decode(c))).toEqual(['AB', 'CD']);
        expect(result.text).toBe('');
    });
});

describe('BaseApi.getData / request / getVersion', () => {
    it('parses a JSON body into json', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({ body: streamOf(encode('{"resourceType":"Patient","id":"p1"}')) })
        );

        const result = await newApi().getData({ urlString: '/4_0_0/Patient/p1' });

        expect(result.json.resourceType).toBe('Patient');
        expect(result.json.id).toBe('p1');
    });

    it('leaves json undefined for a non-JSON body rather than throwing', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({ status: 502, body: streamOf(encode('<html>bad gateway</html>')) })
        );

        const result = await newApi().getData({ urlString: '/4_0_0/Patient' });

        expect(result.status).toBe(502);
        expect(result.json).toBeUndefined();
    });

    it('serializes the request body only when data was supplied', async () => {
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().request({
            urlString: '/4_0_0/Patient/p1/$merge',
            method: 'POST',
            data: { resourceType: 'Patient', id: 'p1' },
        });

        expect(fetchedInit().method).toBe('POST');
        expect(JSON.parse(fetchedInit().body as string)).toEqual({
            resourceType: 'Patient',
            id: 'p1',
        });
    });

    it('sends no body for a DELETE with no data', async () => {
        mockFetch.mockResolvedValue(makeResponse());

        await newApi().request({ urlString: '/admin/deletePersonDataGraph', method: 'DELETE' });

        expect(fetchedInit().method).toBe('DELETE');
        expect(fetchedInit().body).toBeUndefined();
    });

    it('extracts the version string from the /version payload', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({ body: streamOf(encode('{"version":"3.2.34"}')) })
        );

        const version = await newApi().getVersion();

        expect(version).toBe('3.2.34');
        expect(fetchedUrl().pathname).toBe('/version');
    });
});

describe('BaseApi.downloadFile (INV-12)', () => {
    it('returns a Blob tagged with the response content-type', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({
                headers: { 'content-type': 'application/pdf' },
                body: streamOf(encode('%PDF-1.4')),
            })
        );

        const result = await newApi().downloadFile('/4_0_0/Binary/abc');

        expect(result.status).toBe(200);
        expect(result.data.type).toBe('application/pdf');
        expect(await result.data.text()).toBe('%PDF-1.4');
    });

    it('falls back to application/octet-stream when the server sends no content-type', async () => {
        mockFetch.mockResolvedValue(makeResponse({ body: streamOf(encode('bytes')) }));

        const result = await newApi().downloadFile('/4_0_0/Binary/abc');

        expect(result.data.type).toBe('application/octet-stream');
    });

    it('rejects on a non-2xx status and attaches the status, url and decoded server body', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({
                status: 404,
                body: streamOf(encode('{"resourceType":"OperationOutcome","id":"not-found"}')),
            })
        );

        await expect(newApi().downloadFile('/4_0_0/Binary/missing')).rejects.toMatchObject({
            message: 'Request failed with status 404',
            status: 404,
            url: '/4_0_0/Binary/missing',
            body: '{"resourceType":"OperationOutcome","id":"not-found"}',
        });
    });

    it('rejects a truncated download even though the status was 200', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({ status: 200, body: failingStreamAfter(encode('half-a-')) })
        );

        await expect(newApi().downloadFile('/4_0_0/Binary/abc')).rejects.toMatchObject({
            message: 'Connection interrupted before the download finished',
            status: 200,
            incomplete: true,
        });
    });

    it('forwards caller params and headers onto the download request', async () => {
        mockFetch.mockResolvedValue(
            makeResponse({
                headers: { 'content-type': 'application/fhir+json' },
                body: streamOf(encode('{}')),
            })
        );

        await newApi().downloadFile('/4_0_0/Binary/abc', {
            params: { _format: 'json' },
            headers: { Accept: 'application/fhir+json' },
        });

        expect(fetchedUrl().searchParams.get('_format')).toBe('json');
        expect(fetchedHeaders()['Accept']).toBe('application/fhir+json');
    });
});
