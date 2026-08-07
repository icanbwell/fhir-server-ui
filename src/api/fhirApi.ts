import { getStartAndEndDate } from '../utils/auditEventDateFilter';
import BaseApi from './baseApi';
import { HttpMethod } from '../context/LastRequestContext';
import { sendStreamingRequest, StreamingFetchResult } from '../utils/streamingFetch';

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
        method: HttpMethod;
        urlPath: string;
        data?: object;
        headers?: Record<string, string>;
        onChunk?: (text: string) => void;
        onHeaders?: (status: number, headers: Record<string, string>) => void;
        signal?: AbortSignal;
    }): Promise<StreamingFetchResult> {
        let path = urlPath;
        if (path.startsWith(window.location.origin)) {
            path = path.slice(window.location.origin.length);
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

        this.onRequest?.({ method, url: url.pathname + url.search });

        const requestHeaders = this.buildHeaders({
            'Content-Type': 'application/fhir+json',
            ...headers,
        });

        const result = await sendStreamingRequest({
            url: url.toString(),
            method,
            data,
            headers: requestHeaders,
            signal,
            onChunk,
            onHeaders,
        });

        // Moved from "before reading the body" to "after the full result is known" — this
        // check only depends on the response status, not the body, so the timing change is
        // not observable by a user; it just lets the fetch/stream mechanics live in one
        // shared, auth-agnostic place (see streamingFetch.ts).
        await this.handleUnauthorized(result.status);

        return result;
    }
}

export default FhirApi;
