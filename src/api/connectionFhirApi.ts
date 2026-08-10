import { sendStreamingRequest, StreamingFetchResult } from '../utils/streamingFetch';
import { HttpMethod } from '../context/LastRequestContext';

interface ConnectionFhirApiParams {
    baseUrl: string;
    token: string;
    customHeaders?: Record<string, string>;
}

// Deliberately independent of BaseApi: BaseApi's axios interceptor always attaches the
// local session's own bearer token, which is exactly wrong here — every request this
// class sends must carry the connection's own token instead, never the session's. It
// also never calls handleUnauthorized: a 401 from a connection's FHIR server means that
// connection's token is stale, not that the user's b.well session is invalid, and must
// not log the user out of this app.
class ConnectionFhirApi {
    private readonly baseUrl: string;
    private readonly token: string;
    private readonly customHeaders: Record<string, string>;

    constructor({ baseUrl, token, customHeaders }: ConnectionFhirApiParams) {
        this.baseUrl = baseUrl;
        this.token = token;
        this.customHeaders = customHeaders || {};
    }

    async sendRequest({
        method,
        urlPath,
        data,
        headers,
        onChunk,
        onHeaders,
        signal,
    }: {
        method: HttpMethod;
        urlPath: string;
        data?: object;
        headers?: Record<string, string>;
        onChunk?: (text: string) => void;
        onHeaders?: (status: number, headers: Record<string, string>) => void;
        signal?: AbortSignal;
    }): Promise<StreamingFetchResult> {
        let url: URL;
        try {
            // `new URL(path, base)` treats a leading-slash `path` as path-absolute, replacing the
            // entire path component of `base` instead of appending to it — so a base URL with its
            // own path segment (the norm for real third-party FHIR servers, e.g. `/fhir/r4`) would
            // otherwise silently lose that prefix. Normalizing both sides to the relative-append
            // form keeps the base URL's path intact.
            const normalizedBase = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
            const normalizedPath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
            url = new URL(normalizedPath, normalizedBase);
        } catch {
            return { status: undefined, json: { error: 'Invalid request path' }, headers: {}, rawText: '' };
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return {
                status: undefined,
                json: { error: 'Only http(s) requests are supported' },
                headers: {},
                rawText: '',
            };
        }
        // Guards against a user-typed absolute URL or scheme-relative path (e.g. "//evil.com/x")
        // resolving off this connection's own FHIR server via `new URL(urlPath, this.baseUrl)`
        // above — which would otherwise send this connection's real OAuth token to an arbitrary
        // host. Safe to construct `new URL(this.baseUrl)` here: it already succeeded as a base
        // for the URL constructed above, so it can't throw.
        if (url.origin !== new URL(this.baseUrl).origin) {
            return {
                status: undefined,
                json: { error: "Request must stay on this connection's FHIR server" },
                headers: {},
                rawText: '',
            };
        }

        // Same case-insensitive-merge approach as BaseApi.buildHeaders: keyed by lower-cased
        // name so "Content-Type" and "content-type" can't both survive into the Headers the
        // browser sends, with the original casing preserved (some source systems' custom
        // headers may be case-sensitive in practice even though HTTP header names formally
        // aren't). Precedence, lowest to highest: defaults, this connection's mandated
        // headers, the caller's own headers (Authorization excluded), then Authorization —
        // which always resolves to the connection's token and can never be overridden.
        const merged = new Map<string, { name: string; value: string }>();
        const setHeader = (name: string, value: string) => {
            merged.set(name.toLowerCase(), { name, value });
        };
        setHeader('Content-Type', 'application/fhir+json');
        setHeader('Accept', 'application/fhir+json');
        Object.entries(this.customHeaders).forEach(([name, value]) => setHeader(name, value));
        Object.entries(headers || {}).forEach(([name, value]) => {
            if (name.toLowerCase() !== 'authorization') {
                setHeader(name, value);
            }
        });
        setHeader('Authorization', `Bearer ${this.token}`);

        const requestHeaders = Object.fromEntries(
            Array.from(merged.values(), ({ name, value }) => [name, value] as [string, string])
        );

        const result = await sendStreamingRequest({
            url: url.toString(),
            method,
            data,
            headers: requestHeaders,
            signal,
            onChunk,
            onHeaders,
        });

        if (result.status === undefined) {
            return {
                ...result,
                json: {
                    error: `${result.json?.error || 'Request failed'} — this may be a CORS restriction from the source FHIR server.`,
                },
            };
        }

        return result;
    }
}

export default ConnectionFhirApi;
