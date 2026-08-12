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
