import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';

export interface ResolvedAttachmentContent {
    blob: Blob;
    contentType: string;
}

export type ResolveAttachmentResult =
    | { kind: 'resolved'; content: ResolvedAttachmentContent }
    | { kind: 'external'; externalUrl: string }
    | { kind: 'unavailable' };

const BINARY_REFERENCE_PATTERN = /^Binary\/([^/?]+)/;

// FHIR content negotiation: requesting the attachment's own contentType (rather than
// application/fhir+json) makes the server return raw bytes directly, so a Binary's
// content can flow through the same Blob pipeline as inline base64 data below, with no
// intermediate base64 decode step.
export async function resolveAttachmentContent(
    attachment: TAttachment,
    baseApi: BaseApi
): Promise<ResolveAttachmentResult> {
    const contentType = String(attachment.contentType || 'application/octet-stream');

    if (attachment.data) {
        try {
            const bytes = Uint8Array.from(
                atob(String(attachment.data).replace(/\s/g, '')),
                (c) => c.charCodeAt(0)
            );
            return { kind: 'resolved', content: { blob: new Blob([bytes], { type: contentType }), contentType } };
        } catch {
            return { kind: 'unavailable' };
        }
    }

    const url = attachment.url ? String(attachment.url) : undefined;
    const binaryMatch = url?.match(BINARY_REFERENCE_PATTERN);
    if (binaryMatch) {
        const binaryId = binaryMatch[1];
        const response = await baseApi.downloadFile(`/4_0_0/Binary/${binaryId}`, {
            headers: { Accept: contentType },
        });
        return { kind: 'resolved', content: { blob: response.data, contentType } };
    }

    if (url) {
        return { kind: 'external', externalUrl: url };
    }

    return { kind: 'unavailable' };
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
