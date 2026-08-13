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
        if (isFhirJsonContentType(actualContentType) && !isFhirJsonContentType(contentType)) {
            // The server didn't honor content negotiation and returned the FHIR JSON wrapper
            // instead of raw bytes — decode the base64 `data` field out of it rather than
            // silently handing JSON to a renderer expecting the declared contentType.
            // Hoisted above the try so a mid-parse failure (JSON.parse, decodeBase64ToBlob) still
            // leaves the raw response body available to report below — only response.data.text()
            // itself failing leaves this undefined.
            let text: string | undefined;
            try {
                text = await response.data.text();
                const json = JSON.parse(text);
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
                console.warn('Failed to decode the FHIR JSON wrapper returned instead of raw Binary content', error);
                return {
                    kind: 'unavailable',
                    reason: 'malformed',
                    detail: `Failed to decode the FHIR JSON wrapper returned by Binary/${binaryId}: ${errorDetail(error)}`,
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
