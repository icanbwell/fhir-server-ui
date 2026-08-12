import BaseApi from './baseApi';
import { HttpMethod } from '../context/LastRequestContext';
import { BaileyChatInputMessage, BaileyMcpToolConfig } from '../types/baileyChat';

export interface StreamChatParams {
    model: string;
    instructions: string;
    input: BaileyChatInputMessage[];
    tools: BaileyMcpToolConfig[];
    signal?: AbortSignal;
    onChunk: (text: string) => void;
}

// Bailey validates the caller's bearer token against its own AUTH_PROVIDERS, which may not
// trust the same issuer fhir-server-ui's token came from — a config mismatch between two
// different services, not evidence this app's own session is invalid. Overriding
// handleUnauthorized to a no-op keeps a 401 from Bailey from logging the user out of
// fhir-server-ui, for the same reason ConnectionFhirApi avoids BaseApi's interceptor.
class BaileyApi extends BaseApi {
    protected async handleUnauthorized(_status: number | undefined): Promise<void> {
        // Intentionally does nothing — see class comment above.
    }

    // `text` and `errorMessage` are returned alongside `status` because a non-2xx body is the
    // only place Bailey explains itself (invalid model id, rejected tool config, a disabled
    // feature flag), and `errorMessage` carries the fetch-level failure reason (CORS block, DNS,
    // connection refused) when no response arrived at all. Dropping them would leave the user
    // with nothing but a bare status code.
    async streamChat({
        model,
        instructions,
        input,
        tools,
        signal,
        onChunk,
    }: StreamChatParams): Promise<{ status: number | undefined; text: string; errorMessage?: string }> {
        const decoder = new TextDecoder();
        const { status, text, errorMessage } = await this.streamRequest({
            method: 'POST' as HttpMethod,
            urlString: '/bailey/v1/responses',
            data: { model, instructions, input, stream: true, tools },
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json, text/event-stream',
            },
            signal,
            onChunk: (chunk) => onChunk(decoder.decode(chunk, { stream: true })),
        });
        // Flush any dangling partial multi-byte UTF-8 sequence left buffered by the last
        // `{ stream: true }` call — without this, a stream that ends mid-character (an abrupt
        // cutoff) silently drops those trailing bytes. Mirrors baseApi.ts's own flush.
        const flushed = decoder.decode();
        if (flushed) {
            onChunk(flushed);
        }
        return { status, text, errorMessage };
    }
}

export default BaileyApi;
