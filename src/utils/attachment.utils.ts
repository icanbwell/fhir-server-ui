import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';

export interface ResolvedAttachmentContent {
    blob: Blob;
    contentType: string;
}

export type ResolveAttachmentResult =
    | { kind: 'resolved'; content: ResolvedAttachmentContent }
    | { kind: 'external'; externalUrl: string }
    // 'malformed': data/url was present but couldn't be decoded (e.g. invalid base64, or a
    // Binary response with no usable content) — distinct from 'missing' so the UI can tell a
    // corrupted attachment apart from one that genuinely has nothing to show. `detail` carries
    // the underlying failure (an error message, or a description of the unexpected shape) for
    // display to technical users rather than being logged and discarded. `rawContent`, when
    // available, is the actual text we failed to decode (the raw attachment.data string, or the
    // raw Binary response body) so it can be inspected directly instead of just described.
    | { kind: 'unavailable'; reason: 'malformed'; detail: string; rawContent?: string }
    | { kind: 'unavailable'; reason: 'missing' };

function errorDetail(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

// Matches a `Binary/{id}` path segment anywhere in a URL (bare reference, root-relative
// path, or absolute URL), not just an exact `Binary/123` prefix.
const BINARY_REFERENCE_PATTERN = /Binary\/([^/?]+)(?:\?|$)/;

function decodeBase64ToBlob(base64Data: string, contentType: string): Blob {
    const bytes = Uint8Array.from(atob(String(base64Data).replace(/\s/g, '')), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: contentType });
}

function isFhirJsonContentType(contentType: string | undefined): boolean {
    const ct = String(contentType || '').toLowerCase();
    return ct.includes('json');
}

// Requests the FHIR JSON Binary wrapper — both `_format=json` and an explicit
// `Accept: application/fhir+json` header, since a proxy in this path may honor either one
// (and without both, a same-origin SPA's history-fallback routing could otherwise hand back
// its own index.html instead of a 404) — resolved against this page's own origin rather than
// the configured FHIR server. A cross-origin fetch to the FHIR server needs
// that server to answer the browser's CORS preflight with the UI's origin allow-listed, which
// isn't guaranteed — whereas many deployments front the FHIR server with a same-origin reverse
// proxy for exactly this path, keeping the fetch same-origin and sidestepping CORS entirely.
// Throws (rather than returning an 'unavailable' result) on any deviation from that shape, so
// the caller falls back to the direct fetch instead of mistaking an environment with no such
// proxy (e.g. local dev, where this would 404 or hit the SPA's own index.html) for a genuinely
// corrupted attachment.
async function fetchBinaryViaSameOriginProxy(
    baseApi: BaseApi,
    binaryUrl: string,
    binaryId: string,
    contentType: string
): Promise<ResolvedAttachmentContent> {
    const response = await baseApi.downloadFile(binaryUrl, {
        baseUrlOverride: window.location.origin,
        params: { _format: 'json' },
        headers: { Accept: 'application/fhir+json' },
    });
    const actualContentType = response.headers['content-type'];
    if (!isFhirJsonContentType(actualContentType)) {
        throw new Error(`Same-origin proxy returned content-type "${actualContentType}" instead of a FHIR JSON Binary wrapper`);
    }
    const json = JSON.parse(await response.data.text());
    if (json?.resourceType !== 'Binary' || typeof json?.data !== 'string') {
        throw new Error(`Same-origin proxy response for Binary/${binaryId} was not a usable FHIR Binary wrapper`);
    }
    return { blob: decodeBase64ToBlob(json.data, contentType), contentType };
}

// Extracts a `Binary/{id}` reference from an attachment URL, honoring the same-origin
// guarantee that `streamRequest` already enforces on the actual fetch: an absolute URL is
// only treated as a same-server Binary reference when its origin matches the app's
// configured FHIR server origin. When `fhirBaseUrl` isn't provided, only a bare
// `Binary/{id}` reference (no scheme) is recognized, matching the historical behavior.
function extractBinaryId(url: string, fhirBaseUrl?: string): string | undefined {
    const isAbsolute = /^https?:\/\//i.test(url);
    if (isAbsolute) {
        if (!fhirBaseUrl) {
            return undefined;
        }
        try {
            if (new URL(url).origin !== new URL(fhirBaseUrl).origin) {
                return undefined;
            }
        } catch {
            return undefined;
        }
    }
    const binaryMatch = url.match(BINARY_REFERENCE_PATTERN);
    return binaryMatch ? binaryMatch[1] : undefined;
}

// FHIR content negotiation: requesting the attachment's own contentType (rather than
// application/fhir+json) makes the server return raw bytes directly, so a Binary's
// content can flow through the same Blob pipeline as inline base64 data below, with no
// intermediate base64 decode step.
export async function resolveAttachmentContent(
    attachment: TAttachment,
    baseApi: BaseApi,
    fhirBaseUrl?: string
): Promise<ResolveAttachmentResult> {
    const contentType = String(attachment.contentType || 'application/octet-stream');

    if (attachment.data) {
        try {
            return { kind: 'resolved', content: { blob: decodeBase64ToBlob(String(attachment.data), contentType), contentType } };
        } catch (error) {
            console.warn('Failed to decode inline attachment.data as base64', error);
            return {
                kind: 'unavailable',
                reason: 'malformed',
                detail: `Invalid base64 in attachment.data: ${errorDetail(error)}`,
                rawContent: String(attachment.data),
            };
        }
    }

    const url = attachment.url ? String(attachment.url) : undefined;
    const binaryId = url ? extractBinaryId(url, fhirBaseUrl) : undefined;
    if (binaryId) {
        const binaryUrl = `/4_0_0/Binary/${binaryId}`;

        try {
            return { kind: 'resolved', content: await fetchBinaryViaSameOriginProxy(baseApi, binaryUrl, binaryId, contentType) };
        } catch (sameOriginError) {
            console.warn(`Same-origin fetch of ${binaryUrl} unavailable, falling back to the configured FHIR server`, sameOriginError);
        }

        let response;
        try {
            // Always fetch via the relative path — never the absolute URL — so streamRequest's
            // existing same-origin guard keeps enforcing on the actual fetch, regardless of what
            // this resolution step decided above.
            response = await baseApi.downloadFile(binaryUrl, {
                headers: { Accept: contentType },
            });
        } catch (error) {
            console.warn(`Failed to fetch ${binaryUrl}`, error);
            const status = (error as { status?: number })?.status;
            return {
                kind: 'unavailable',
                reason: 'malformed',
                detail: `Request to ${binaryUrl} failed: ${errorDetail(error)}${status ? ` (HTTP ${status})` : ''}`,
                rawContent: (error as { body?: string })?.body,
            };
        }

        const actualContentType = response.headers['content-type'];
        if (isFhirJsonContentType(actualContentType)) {
            // The server may have ignored our Accept header and returned the FHIR JSON Binary
            // wrapper instead of raw bytes. Detect that by the parsed body's own shape
            // (resourceType === 'Binary' with a base64 `data` field) rather than by comparing
            // content-type strings for disjointness — a declared attachment.contentType can
            // itself legitimately be JSON-flavored (application/json, application/fhir+json),
            // in which case a content-type-only check could never tell a real JSON attachment
            // apart from the wrapper.
            // Hoisted above the try so a mid-parse failure (JSON.parse, decodeBase64ToBlob) still
            // leaves the raw response body available to report below — only response.data.text()
            // itself failing leaves this undefined.
            let text: string | undefined;
            try {
                text = await response.data.text();
                const json = JSON.parse(text);
                if (json?.resourceType !== 'Binary') {
                    // Not the wrapper — this JSON-flavored response is the attachment's actual
                    // content (e.g. a genuinely JSON attachment), so hand it back as-is.
                    return { kind: 'resolved', content: { blob: new Blob([text], { type: contentType }), contentType } };
                }
                if (typeof json?.data !== 'string') {
                    console.warn('Binary response was a FHIR JSON wrapper with no usable data field', json);
                    return {
                        kind: 'unavailable',
                        reason: 'malformed',
                        detail: `Binary/${binaryId} returned a FHIR JSON wrapper with no usable "data" field`,
                        rawContent: text,
                    };
                }
                return { kind: 'resolved', content: { blob: decodeBase64ToBlob(json.data, contentType), contentType } };
            } catch (error) {
                console.warn('Failed to decode the JSON response returned instead of raw Binary content', error);
                return {
                    kind: 'unavailable',
                    reason: 'malformed',
                    detail: `Failed to parse the JSON response returned by Binary/${binaryId}: ${errorDetail(error)}`,
                    rawContent: text,
                };
            }
        }

        return { kind: 'resolved', content: { blob: response.data, contentType } };
    }

    if (url) {
        return { kind: 'external', externalUrl: url };
    }

    return { kind: 'unavailable', reason: 'missing' };
}

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
    'text/html': 'html',
    'text/plain': 'txt',
    'text/xml': 'xml',
    'application/xml': 'xml',
    'application/pdf': 'pdf',
    'text/rtf': 'rtf',
    'application/rtf': 'rtf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'application/json': 'json',
};

export function extensionForContentType(contentType: string | undefined): string {
    const ct = String(contentType || '').toLowerCase().split(';')[0].trim();
    // eslint-disable-next-line security/detect-object-injection
    return CONTENT_TYPE_EXTENSIONS[ct] || 'bin';
}
