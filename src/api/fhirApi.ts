import { getStartAndEndDate } from '../utils/auditEventDateFilter';
import BaseApi from './baseApi';
import { HttpMethod } from '../context/LastRequestContext';

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

interface GetResourceCountParams {
    resourceType: string;
    queryParameters?: string[];
    limit: number;
    signal?: AbortSignal;
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

    async getBundleAsync(
        {
            resourceType,
            id,
            queryString,
            queryParameters,
            operation,
        }: GetBundleAsyncParams,
        options?: {
            onChunk?: (chunk: Uint8Array) => void;
            onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void;
        }
    ): Promise<{ status: number | undefined; json: any; incomplete: boolean }> {
        const url = this.getUrl({
            resourceType,
            id,
            queryString,
            queryParameters,
            operation,
        });
        return await this.getData({urlString: url.toString()}, options);
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

    // Deliberately avoids `_total=accurate` — the FHIR server's own docs warn it's "an
    // expensive operation when the count of records that match your query is high."
    // Instead this asks for at most `limit + 1` id-only entries: a plain paginated search
    // is cheap regardless of how large the true total is, and `limit + 1` entries coming
    // back is enough to know "more than `limit`" without ever computing the exact total.
    async getResourceCount({ resourceType, queryParameters, limit, signal }: GetResourceCountParams): Promise<{ count: number; atLimit: boolean } | null> {
        const url = this.getUrl({ resourceType, queryParameters });
        url.searchParams.set('_elements', 'id');
        url.searchParams.set('_count', String(limit + 1));
        // An exact `id=<value>` lookup (ReferenceLink's existence check) already narrows to
        // at most one resource — addMissingRequiredParams' AuditEvent rolling-7-day date
        // window (meant for list/search defaults) would AND onto it and hide an AuditEvent
        // older than 7 days behind a false "not found". ReverseReferenceLink's list-count
        // queries never carry an `id=` param, so they keep the injected window — it has to
        // match their click-through list's own date-bounded results.
        if (queryParameters?.some((param) => param.startsWith('id='))) {
            url.searchParams.delete('date');
        }
        const { status, json } = await this.getData({ urlString: url.toString(), signal });
        if (!status || status < 200 || status >= 300) {
            return null;
        }
        const entryCount = Array.isArray(json?.entry) ? json.entry.length : 0;
        return entryCount > limit ? { count: limit, atLimit: true } : { count: entryCount, atLimit: false };
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
    }): Promise<{
        status: number | undefined;
        json: any;
        headers: Record<string, string>;
        rawText: string;
        incomplete?: boolean;
    }> {
        // APIConsolePage's onChunk expects decoded text, but streamRequest hands back raw
        // Uint8Array chunks (so binary downloads elsewhere aren't forced through a decoder). Keep
        // one TextDecoder alive across the whole request — decoding each chunk independently would
        // corrupt any multi-byte UTF-8 character split across a chunk boundary.
        const decoder = new TextDecoder();
        const result = await this.streamRequest({
            method,
            urlString: urlPath,
            data,
            headers,
            signal,
            onHeaders,
            onChunk: onChunk ? (chunk) => onChunk(decoder.decode(chunk, { stream: true })) : undefined,
        });

        let json: any;
        try {
            // On a total fetch-level failure (network error, CORS block, DNS failure — not an
            // abort), streamRequest() returns an empty `text` but sets `errorMessage`. Surface
            // that as `{ error: ... }` so the API Console shows the real failure reason instead
            // of a blank response, matching this method's pre-refactor behavior.
            json = result.text
                ? JSON.parse(result.text)
                : result.errorMessage
                    ? { error: result.errorMessage }
                    : undefined;
        } catch {
            json = undefined;
        }

        return {
            status: result.status,
            json,
            headers: result.headers,
            rawText: result.text,
            incomplete: result.incomplete,
        };
    }
}

export default FhirApi;
