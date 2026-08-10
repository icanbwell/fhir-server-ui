export interface StreamingFetchResult {
    status: number | undefined;
    json: any;
    headers: Record<string, string>;
    rawText: string;
    incomplete?: boolean;
}

export interface StreamingFetchParams {
    url: string;
    method: string;
    data?: object;
    headers: Record<string, string>;
    signal?: AbortSignal;
    onChunk?: (text: string) => void;
    onHeaders?: (status: number, headers: Record<string, string>) => void;
}

// Pure fetch/streaming/parsing mechanics, extracted from FhirApi.sendRequest so
// ConnectionFhirApi (a different trust boundary — a connection's own FHIR server, not
// this app's configured one) can reuse the same streaming/abort/partial-body handling
// without duplicating it. Deliberately has no knowledge of sessions, origins, or auth —
// callers build `headers` (including Authorization) and validate `url` themselves.
export async function sendStreamingRequest({
    url,
    method,
    data,
    headers,
    signal,
    onChunk,
    onHeaders,
}: StreamingFetchParams): Promise<StreamingFetchResult> {
    let response: Response;
    try {
        response = await fetch(url, {
            method,
            headers,
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

    let rawText = '';
    // Declared outside the try block so both the success path below and the mid-stream-drop
    // catch can flush it — a chunk boundary that splits a multi-byte UTF-8 character can land
    // right at the point the stream ends or drops, and only a final decode() (with no
    // arguments) flushes that trailing buffered partial sequence instead of silently dropping it.
    const decoder = new TextDecoder();
    try {
        if (response.body) {
            const reader = response.body.getReader();
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
    } catch (err: any) {
        if (err?.name === 'AbortError') {
            throw err;
        }
        // A mid-stream connection drop rejects here. The status/headers were already
        // surfaced via onHeaders and the partial body via onChunk, so resolve with what
        // arrived instead of throwing — the caller's catch-all would otherwise discard
        // both in favor of a generic error.
        rawText += decoder.decode();
        let partialJson: any;
        try {
            partialJson = rawText ? JSON.parse(rawText) : undefined;
        } catch {
            partialJson = undefined;
        }
        return {
            status: response.status,
            json: partialJson,
            headers: responseHeaders,
            rawText,
            incomplete: true,
        };
    }

    rawText += decoder.decode();

    let json: any;
    try {
        json = rawText ? JSON.parse(rawText) : undefined;
    } catch {
        json = undefined;
    }

    return { status: response.status, json, headers: responseHeaders, rawText };
}
