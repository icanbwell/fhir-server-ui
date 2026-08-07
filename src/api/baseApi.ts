import React from 'react';
import { getLocalData } from '../utils/localData.utils';
import { TUserDetails } from '../types/baseTypes';
import AuthUrlProvider from '../utils/authUrlProvider';
import { logout } from '../utils/auth.utils';
import { HttpMethod, TRequestInfo } from '../context/LastRequestContext';

interface GetDataParams {
    urlString: string;
    params?: any;
}

interface RequestParams {
    urlString: string;
    params?: any;
    method: HttpMethod;
    data?: any;
}

export interface StreamRequestParams {
    method: HttpMethod;
    urlString: string;
    params?: Record<string, string>;
    data?: any;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    responseMode?: 'text' | 'binary';
    onHeaders?: (status: number, headers: Record<string, string>) => void;
    onChunk?: (chunk: Uint8Array) => void;
    onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void;
}

export interface StreamRequestResult {
    status: number | undefined;
    headers: Record<string, string>;
    chunks: Uint8Array[];
    text: string;
    incomplete: boolean;
    errorMessage?: string;
}

class BaseApi {
    private readonly fhirUrl: string | undefined;
    private readonly setUserDetails:
        | React.Dispatch<React.SetStateAction<TUserDetails | null>>
        | undefined;
    protected readonly onRequest?: (info: TRequestInfo) => void;

    constructor({
        fhirUrl,
        setUserDetails,
        onRequest,
    }: {
        fhirUrl: string | undefined;
        setUserDetails: React.Dispatch<React.SetStateAction<TUserDetails | null>> | undefined;
        onRequest?: (info: TRequestInfo) => void;
    }) {
        this.fhirUrl = fhirUrl;
        this.setUserDetails = setUserDetails;
        this.onRequest = onRequest;
    }

    protected getBaseUrl(): string {
        return this.fhirUrl || '';
    }

    protected buildHeaders(extra?: Record<string, string>): Record<string, string> {
        let tokenToSendToFhirServer = 'jwt';
        const identityProvider = getLocalData('identityProvider');
        if (identityProvider) {
            const authInfo = new AuthUrlProvider().getAuthInfo(identityProvider);
            tokenToSendToFhirServer = authInfo.tokenToSendToFhirServer || tokenToSendToFhirServer;
        }
        const token = getLocalData(tokenToSendToFhirServer);

        // HTTP header names are case-insensitive, but a plain object treats `Content-Type` and
        // `content-type` as two distinct keys — and fetch()'s Headers constructor then
        // comma-joins their values instead of letting the caller cleanly override the default.
        // Keying by the lower-cased name (while remembering the original spelling) guarantees
        // only one entry per header survives, with the last one set winning, matching HTTP
        // header semantics.
        const merged = new Map<string, { name: string; value: string }>();
        const setHeader = (name: string, value: string) => {
            merged.set(name.toLowerCase(), { name, value });
        };

        setHeader('Accept', 'application/json');
        setHeader('Cache-Control', 'no-cache');
        setHeader('Pragma', 'no-cache');
        setHeader('Expires', '0');
        setHeader('Origin-Service', 'fhir-ui');

        Object.entries(extra || {}).forEach(([name, value]) => {
            // `Authorization` is owned exclusively by the session token (below) and can never be
            // overridden or blanked by a caller-supplied header. Enforced here rather than at the
            // call site so every caller of buildHeaders/sendRequest gets the guarantee, whether
            // or not a session token exists.
            if (name.toLowerCase() === 'authorization') {
                return;
            }
            setHeader(name, value);
        });

        if (typeof token === 'string') {
            setHeader('Authorization', `Bearer ${token}`);
        }

        return Object.fromEntries(
            Array.from(merged.values(), ({ name, value }) => [name, value] as [string, string])
        );
    }

    protected async handleUnauthorized(status: number | undefined): Promise<void> {
        if (status === 401 && this.setUserDetails) {
            await logout(this.setUserDetails);
        }
    }

    async getVersion(): Promise<string> {
        return (await this.getData({ urlString: '/version' })).json?.version;
    }

    async streamRequest({
        method,
        urlString,
        params,
        data,
        headers,
        signal,
        responseMode = 'text',
        onHeaders,
        onChunk,
        onProgress,
    }: StreamRequestParams): Promise<StreamRequestResult> {
        let path = urlString;
        if (path.startsWith(window.location.origin)) {
            path = path.slice(window.location.origin.length);
        }
        const url = new URL(path, this.getBaseUrl());
        if (params) {
            Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        }

        // The session's bearer token must never leave the configured base URL. A scheme-relative
        // or absolute path can resolve to a different origin via `new URL()`, so refuse before any
        // fetch happens rather than trusting every caller to have validated its own input. This
        // check used to live only in FhirApi.sendRequest (the one caller that took a free-form path
        // from user input); moving it here means every BaseApi-derived call gets the guarantee.
        if (url.origin !== new URL(this.getBaseUrl()).origin) {
            return {
                status: undefined,
                headers: {},
                chunks: [],
                text: JSON.stringify({ error: 'Request path must stay on the configured FHIR server' }),
                incomplete: false,
            };
        }

        this.onRequest?.({ method, url: url.pathname + url.search });

        const requestHeaders = this.buildHeaders({
            'Content-Type': 'application/fhir+json',
            ...headers,
        });

        let response: Response;
        try {
            response = await fetch(url.toString(), {
                method,
                headers: requestHeaders,
                body: data !== undefined && data !== null ? JSON.stringify(data) : undefined,
                signal,
            });
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                throw err;
            }
            // Surface the underlying error message (network failure, CORS block, DNS failure,
            // etc.) via a dedicated field rather than folding it into `text` — callers like
            // getData()/request()/downloadFile() parse `text` as the response body and must keep
            // seeing an empty body on total network failure (matching the old axios-based
            // behavior). Only FhirApi.sendRequest() reads `errorMessage` today, to restore its
            // pre-refactor diagnostic behavior for the API Console.
            return {
                status: undefined,
                headers: {},
                chunks: [],
                text: '',
                incomplete: true,
                errorMessage: err?.message || 'Request failed',
            };
        }

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        // Surface status/headers as soon as fetch() resolves — before the body streaming loop
        // below starts — so callers can populate UI without waiting for the whole body.
        onHeaders?.(response.status, responseHeaders);
        await this.handleUnauthorized(response.status);

        // Content-Length reflects the compressed size when the server sends a Content-Encoding
        // (gzip/br/deflate), but reader.read() yields decompressed bytes — comparing the two would
        // make the progress percentage race past 100%. Treat the total as unknown whenever the
        // response is encoded; the indicator falls back to an indeterminate progress bar.
        const totalBytes = !responseHeaders['content-encoding'] && responseHeaders['content-length']
            ? parseInt(responseHeaders['content-length'], 10)
            : undefined;

        const receivedChunks: Uint8Array[] = [];
        let receivedBytes = 0;
        const decoder = new TextDecoder();
        let text = '';

        const finalize = (incomplete: boolean): StreamRequestResult => {
            // Flush any dangling partial multi-byte UTF-8 sequence buffered internally by the
            // decoder from the last `{ stream: true }` call — without this, a chunk boundary that
            // splits a multi-byte character at the very end of the body silently drops it from
            // `text`. Calling decode() with no arguments (equivalent to `{ stream: false }`) is
            // safe to call even when nothing is buffered (returns '').
            if (responseMode === 'text') {
                text += decoder.decode();
            }
            return { status: response.status, headers: responseHeaders, chunks: receivedChunks, text, incomplete };
        };

        try {
            if (response.body) {
                const reader = response.body.getReader();
                let done = false;
                while (!done) {
                    const result = await reader.read();
                    done = result.done;
                    if (result.value) {
                        receivedChunks.push(result.value);
                        receivedBytes += result.value.length;
                        if (responseMode === 'text') {
                            text += decoder.decode(result.value, { stream: true });
                        }
                        onChunk?.(result.value);
                        onProgress?.(receivedBytes, totalBytes);
                    }
                }
            } else if (responseMode === 'text') {
                text = await response.text();
                onChunk?.(new TextEncoder().encode(text));
                onProgress?.(text.length, totalBytes);
            }
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                throw err;
            }
            // A mid-stream drop rejects here. Headers were already surfaced via onHeaders and
            // whatever bytes arrived via onChunk, so resolve with the partial data instead of
            // throwing — callers decide how to degrade rather than losing everything.
            return finalize(true);
        }

        return finalize(false);
    }

    async getData(
        { urlString, params }: GetDataParams,
        options?: {
            onChunk?: (chunk: Uint8Array) => void;
            onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void;
        }
    ): Promise<{ status: number | undefined; json: any; incomplete: boolean }> {
        const { status, text, incomplete } = await this.streamRequest({
            method: 'GET',
            urlString,
            params,
            onChunk: options?.onChunk,
            onProgress: options?.onProgress,
        });
        let json: any;
        try {
            json = text ? JSON.parse(text) : undefined;
        } catch {
            json = undefined;
        }
        return { status, json, incomplete };
    }

    async request(
        { urlString, params, method, data }: RequestParams,
        options?: {
            onChunk?: (chunk: Uint8Array) => void;
            onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void;
        }
    ): Promise<{ status: number | undefined; json: any; incomplete: boolean }> {
        const { status, text, incomplete } = await this.streamRequest({
            method,
            urlString,
            params,
            data,
            onChunk: options?.onChunk,
            onProgress: options?.onProgress,
        });
        let json: any;
        try {
            json = text ? JSON.parse(text) : undefined;
        } catch {
            json = undefined;
        }
        return { status, json, incomplete };
    }

    async downloadFile(
        url: string,
        options?: { onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void }
    ): Promise<{ status: number; data: Blob; headers: Record<string, string> }> {
        const { status, chunks, headers, errorMessage } = await this.streamRequest({
            method: 'GET',
            urlString: url,
            responseMode: 'binary',
            onProgress: options?.onProgress,
        });
        if (!status || status < 200 || status >= 300) {
            throw Object.assign(new Error(errorMessage || `Request failed with status ${status}`), { status });
        }
        const contentType = headers['content-type'] || 'application/octet-stream';
        return {
            status,
            data: new Blob(chunks as Uint8Array<ArrayBuffer>[], { type: contentType }),
            headers,
        };
    }

}

export default BaseApi;
