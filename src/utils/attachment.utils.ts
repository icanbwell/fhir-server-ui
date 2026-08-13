import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';

export interface ResolvedAttachmentContent {
    blob: Blob;
    contentType: string;
}

export type ResolveAttachmentResult =
    | { kind: 'resolved'; content: ResolvedAttachmentContent }
    | { kind: 'external'; externalUrl: string }
    // 'malformed': content was actually retrieved but couldn't be decoded (e.g. invalid
    // base64, or a Binary response with no usable data field) — a genuine "this attachment is
    // corrupted" case. `rawContent`, when available, is the actual text we failed to decode
    // (the raw attachment.data string, or the raw Binary response body) so it can be inspected
    // directly instead of just described.
    | { kind: 'unavailable'; reason: 'malformed'; detail: string; rawContent?: string }
    // 'network': the request itself never produced usable content — a network/CORS failure or
    // a non-2xx HTTP status. Distinct from 'malformed' because nothing was actually retrieved
    // to be corrupted; the UI should say the fetch failed, not imply the file is bad.
    | { kind: 'unavailable'; reason: 'network'; detail: string; rawContent?: string }
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

type BinaryWrapperParseResult =
    | { kind: 'usable'; content: ResolvedAttachmentContent }
    // The response was legitimate JSON, just not the Binary wrapper shape (e.g. a genuinely
    // JSON-typed attachment) — distinct from 'malformed' so callers can hand it back as real
    // content instead of reporting a decode failure.
    | { kind: 'not-a-wrapper'; text: string }
    | { kind: 'malformed'; detail: string; rawContent?: string };

// Shared shape-check-and-decode core for a FHIR Binary JSON wrapper
// (`{ resourceType: 'Binary', data: '<base64>' }`), used by both the same-origin proxy probe
// and the direct-fetch fallback below. The two call sites apply different policies on top of
// this result (throw-to-fall-back vs. a nuanced 'malformed' result with rawContent), which is
// why this returns a discriminated result rather than throwing itself.
function parseFhirBinaryWrapper(bodyText: string, decodeContentType: string, context: string): BinaryWrapperParseResult {
    let json: any;
    try {
        json = JSON.parse(bodyText);
    } catch (error) {
        return { kind: 'malformed', detail: `Failed to parse the JSON response returned by ${context}: ${errorDetail(error)}`, rawContent: bodyText };
    }
    if (json?.resourceType !== 'Binary') {
        return { kind: 'not-a-wrapper', text: bodyText };
    }
    if (typeof json?.data !== 'string') {
        return { kind: 'malformed', detail: `${context} returned a FHIR JSON wrapper with no usable "data" field`, rawContent: bodyText };
    }
    try {
        return { kind: 'usable', content: { blob: decodeBase64ToBlob(json.data, decodeContentType), contentType: decodeContentType } };
    } catch (error) {
        return { kind: 'malformed', detail: `Failed to decode base64 "data" field from ${context}: ${errorDetail(error)}`, rawContent: bodyText };
    }
}

// Requests the FHIR JSON Binary wrapper — both `_format=json` and an explicit
// `Accept: application/fhir+json` header, since a proxy in this path may honor either one
// (and without both, a same-origin SPA's history-fallback routing could otherwise hand back
// its own index.html instead of a 404) — resolved against this page's own origin rather than
// the configured FHIR server. A cross-origin fetch to the FHIR server needs
// that server to answer the browser's CORS preflight with the UI's origin allow-listed, which
// isn't guaranteed — whereas many deployments front the FHIR server with a same-origin reverse
// proxy for exactly this path, keeping the fetch same-origin and sidestepping CORS entirely.
// Throws (rather than returning an 'unavailable' result) on any deviation from that shape,
// including a well-formed but non-Binary JSON body, so the caller falls back to the direct
// fetch instead of mistaking an environment with no such proxy (e.g. local dev, where this
// would 404 or hit the SPA's own index.html) for a genuinely corrupted attachment.
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
    const parsed = parseFhirBinaryWrapper(await response.data.text(), contentType, `Binary/${binaryId}`);
    if (parsed.kind !== 'usable') {
        throw new Error(`Same-origin proxy response for Binary/${binaryId} was not a usable FHIR Binary wrapper`);
    }
    return parsed.content;
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
            // this resolution step decided above. Explicitly request the FHIR JSON Binary
            // wrapper rather than negotiating on the attachment's own contentType — some
            // servers/intermediaries don't honor an arbitrary Accept value for content
            // negotiation and could hand back something unexpected (e.g. an HTML error page)
            // instead of raw bytes, whereas `application/fhir+json` has one well-defined shape
            // that the wrapper-decode logic below already handles.
            response = await baseApi.downloadFile(binaryUrl, {
                headers: { Accept: 'application/fhir+json' },
            });
        } catch (error) {
            console.warn(`Failed to fetch ${binaryUrl}`, error);
            const status = (error as { status?: number })?.status;
            return {
                kind: 'unavailable',
                reason: 'network',
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
            let text: string;
            try {
                text = await response.data.text();
            } catch (error) {
                console.warn('Failed to read the Binary response body', error);
                return {
                    kind: 'unavailable',
                    reason: 'network',
                    detail: `Failed to read the response body returned by Binary/${binaryId}: ${errorDetail(error)}`,
                };
            }
            const parsed = parseFhirBinaryWrapper(text, contentType, `Binary/${binaryId}`);
            if (parsed.kind === 'usable') {
                return { kind: 'resolved', content: parsed.content };
            }
            if (parsed.kind === 'not-a-wrapper') {
                // Not the wrapper — this JSON-flavored response is the attachment's actual
                // content (e.g. a genuinely JSON attachment), so hand it back as-is.
                return { kind: 'resolved', content: { blob: new Blob([parsed.text], { type: contentType }), contentType } };
            }
            console.warn(parsed.detail);
            return { kind: 'unavailable', reason: 'malformed', detail: parsed.detail, rawContent: parsed.rawContent };
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
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'weba',
};

export function extensionForContentType(contentType: string | undefined): string {
    const ct = String(contentType || '').toLowerCase().split(';')[0].trim();
    // eslint-disable-next-line security/detect-object-injection
    return CONTENT_TYPE_EXTENSIONS[ct] || 'bin';
}
