import BaseApi from './baseApi';
import { HttpMethod } from '../context/LastRequestContext';

// Mirrors FhirApi.sendRequest (src/api/fhirApi.ts) exactly — same generic
// BaseApi-derived client shape as FhirApi/TokenServiceApi, just pointed at
// scheduling-service's base URL instead. Uses BaseApi's default
// handleUnauthorized (log out on 401): scheduling-service is called with this
// app's own session bearer token, so a 401 from it means this app's own
// session is invalid, same as a 401 from the FHIR server.
class SchedulingApi extends BaseApi {
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

export default SchedulingApi;
