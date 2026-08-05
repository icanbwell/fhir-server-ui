import { getStartAndEndDate } from '../utils/auditEventDateFilter';
import BaseApi from './baseApi';

interface GetResourceParams {
    id: string;
    resourceType: string;
}

interface GetBundleAsyncParams {
    resourceType: string;
    id?: string;
    queryString?: string;
    queryParameters?: string[];
    operation?: string;
}

interface GetUrlParams {
    resourceType: string;
    id?: string;
    queryString?: string;
    queryParameters?: string[];
    operation?: string;
}

interface PostResourceParams {
    resourceType: string;
    id: string;
    resource: object;
    smartMerge?: boolean;
}

class FhirApi extends BaseApi {
    async getResource({ id, resourceType }: GetResourceParams) {
        const urlString = `/4_0_0/${resourceType}/${id}/`;
        return await this.getData({urlString});
    }

    async getBundleAsync({
        resourceType,
        id,
        queryString,
        queryParameters,
        operation,
    }: GetBundleAsyncParams): Promise<{ status: number; json: any }> {
        const url = this.getUrl({
            resourceType,
            id,
            queryString,
            queryParameters,
            operation,
        });
        return await this.getData({urlString: url.toString()});
    }

    addMissingRequiredParams({
        queryParams,
        id,
        resourceType,
        operation
    }: { queryParams: URLSearchParams; id?: string, resourceType: string, operation?: string | undefined }) {
        if ((!id || id === '_history' || operation === '_history') && !queryParams.has('_count')) {
            queryParams.append('_count', '10');
        }
        if (!queryParams.has('_metaUuid') && queryParams.get('_format') !== 'json') {
            queryParams.append('_metaUuid', '1');
        }
        if (resourceType === 'AuditEvent' && !queryParams.has('date')) {
            const { startDate, endDate } = getStartAndEndDate();
            // Append 'date' query parameters for AuditEvent
            queryParams.append('date', `ge${startDate.toISOString().split('T')[0]}`);
            queryParams.append('date', `le${endDate.toISOString().split('T')[0]}`);
        }
        return queryParams;
    }

    getUrl({
        resourceType,
        id,
        queryString,
        queryParameters,
        operation,
    }: GetUrlParams): URL {
        let urlString = `/4_0_0/${resourceType}`;
        if (id) {
            urlString += `/${id}`;
        }
        if (operation) {
            urlString += `/${operation}`;
        }

        function stripFirstCharIfQuestionMark(str: string) {
            if (str.charAt(0) === '?') {
                return str.slice(1);
            }
            return str;
        }

        if (queryString) {
            urlString += `?${stripFirstCharIfQuestionMark(queryString)}`;
        }
        const url = new URL(urlString, window.location.origin);
        if (queryParameters && queryParameters.length > 0) {
            queryParameters.forEach((queryParameter) => {
                const firstEquals = queryParameter.indexOf('=');
                const name = queryParameter.substring(0, firstEquals);
                const value = queryParameter.substring(firstEquals + 1);
                url.searchParams.append(name, value);
            });
        }
        this.addMissingRequiredParams({ queryParams: url.searchParams, id, resourceType, operation });
        return url;
    }

    async mergeResource({ resourceType, id, resource, smartMerge = true }: PostResourceParams) {
        const urlString = `/4_0_0/${resourceType}/${id}/$merge?smartMerge=${smartMerge}`;
        return await this.request({ urlString, method: 'POST', data: resource });
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
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        urlPath: string;
        data?: object;
        headers?: Record<string, string>;
        onChunk?: (text: string) => void;
        onHeaders?: (status: number, headers: Record<string, string>) => void;
        signal?: AbortSignal;
    }): Promise<{ status: number | undefined; json: any; headers: Record<string, string>; rawText: string }> {
        let path = urlPath;
        if (path.includes(window.location.origin)) {
            path = path.replace(window.location.origin, '');
        }
        const url = new URL(path, this.getBaseUrl());

        // The session's bearer token must never leave the configured FHIR server. A
        // scheme-relative path (e.g. "//evil.com/collect") resolves to a different origin via
        // new URL(), so compare the resolved origin against the base URL's origin and refuse
        // before any fetch happens. This is the single chokepoint every URL mode goes through
        // (guided builder and free-form path alike), so the invariant can't be re-broken in the UI.
        if (url.origin !== new URL(this.getBaseUrl()).origin) {
            return {
                status: undefined,
                json: { error: 'Request path must stay on the configured FHIR server' },
                headers: {},
                rawText: '',
            };
        }

        const requestHeaders = this.buildHeaders({
            'Content-Type': 'application/fhir+json',
            ...headers,
        });

        let response: Response;
        try {
            response = await fetch(url.toString(), {
                method,
                headers: requestHeaders,
                body: data !== undefined ? JSON.stringify(data) : undefined,
                signal,
            });
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                throw err;
            }
            return { status: undefined, json: { error: err.message || 'Request failed' }, headers: {}, rawText: '' };
        }

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        // Surface status/headers to the caller as soon as fetch() resolves — i.e. before the
        // body streaming loop below starts — so the UI can populate them without waiting for
        // the whole body to arrive.
        onHeaders?.(response.status, responseHeaders);

        await this.handleUnauthorized(response.status);

        let rawText = '';
        if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            while (!done) {
                const result = await reader.read();
                done = result.done;
                if (result.value) {
                    const chunkText = decoder.decode(result.value, { stream: true });
                    rawText += chunkText;
                    onChunk?.(chunkText);
                }
            }
        } else {
            rawText = await response.text();
            onChunk?.(rawText);
        }

        let json: any;
        try {
            json = rawText ? JSON.parse(rawText) : undefined;
        } catch {
            json = undefined;
        }

        return { status: response.status, json, headers: responseHeaders, rawText };
    }
}

export default FhirApi;
