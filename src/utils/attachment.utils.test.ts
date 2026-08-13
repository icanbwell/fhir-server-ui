import { beforeEach, describe, expect, it, vi } from 'vitest';
import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';
import { extensionForContentType, resolveAttachmentContent } from './attachment.utils';

function makeBaseApi() {
    return new BaseApi({ fhirUrl: 'https://fhir.example.com', setUserDetails: undefined });
}

describe('resolveAttachmentContent', () => {
    let baseApi: BaseApi;

    beforeEach(() => {
        baseApi = makeBaseApi();
    });

    it('decodes inline base64 attachment.data into a Blob', async () => {
        const attachment: TAttachment = { data: 'aGVsbG8=' as any, contentType: 'text/plain' as any };

        const result = await resolveAttachmentContent(attachment, baseApi);

        expect(result.kind).toBe('resolved');
        if (result.kind !== 'resolved') {
            throw new Error('expected resolved');
        }
        expect(result.content.contentType).toBe('text/plain');
        expect(await result.content.blob.text()).toBe('hello');
    });

    it('reports malformed when attachment.data is not valid base64', async () => {
        const attachment: TAttachment = { data: '!!!not-base64!!!' as any };

        const result = await resolveAttachmentContent(attachment, baseApi);

        expect(result.kind).toBe('unavailable');
        if (result.kind !== 'unavailable') {
            throw new Error('expected unavailable');
        }
        expect(result.reason).toBe('malformed');
        if (result.reason !== 'malformed') {
            throw new Error('expected malformed');
        }
        expect(result.rawContent).toBe('!!!not-base64!!!');
    });

    it('fetches a bare Binary/{id} reference and returns raw bytes as-is', async () => {
        const attachment: TAttachment = { url: 'Binary/abc123' as any, contentType: 'image/png' as any };
        const blob = new Blob(['binary-bytes']);
        vi.spyOn(baseApi, 'downloadFile').mockResolvedValue({
            status: 200,
            data: blob,
            headers: { 'content-type': 'image/png' },
        });

        const result = await resolveAttachmentContent(attachment, baseApi);

        expect(baseApi.downloadFile).toHaveBeenNthCalledWith(1, '/4_0_0/Binary/abc123', {
            baseUrlOverride: window.location.origin,
            params: { _format: 'json' },
            headers: { Accept: 'application/fhir+json' },
        });
        expect(baseApi.downloadFile).toHaveBeenNthCalledWith(2, '/4_0_0/Binary/abc123', {
            headers: { Accept: 'application/fhir+json' },
        });
        expect(result.kind).toBe('resolved');
        if (result.kind !== 'resolved') {
            throw new Error('expected resolved');
        }
        expect(result.content.blob).toBe(blob);
        expect(result.content.contentType).toBe('image/png');
    });

    it('decodes a FHIR JSON Binary wrapper returned instead of raw bytes', async () => {
        const attachment: TAttachment = { url: 'Binary/abc123' as any, contentType: 'application/pdf' as any };
        const wrapper = JSON.stringify({ resourceType: 'Binary', data: 'aGVsbG8=' });
        vi.spyOn(baseApi, 'downloadFile').mockResolvedValue({
            status: 200,
            data: new Blob([wrapper], { type: 'application/fhir+json' }),
            headers: { 'content-type': 'application/fhir+json' },
        });

        const result = await resolveAttachmentContent(attachment, baseApi);

        expect(result.kind).toBe('resolved');
        if (result.kind !== 'resolved') {
            throw new Error('expected resolved');
        }
        expect(result.content.contentType).toBe('application/pdf');
        expect(await result.content.blob.text()).toBe('hello');
    });

    it('reports malformed when the Binary JSON wrapper has no usable data field', async () => {
        const attachment: TAttachment = { url: 'Binary/abc123' as any, contentType: 'application/pdf' as any };
        const wrapper = JSON.stringify({ resourceType: 'Binary' });
        vi.spyOn(baseApi, 'downloadFile').mockResolvedValue({
            status: 200,
            data: new Blob([wrapper], { type: 'application/fhir+json' }),
            headers: { 'content-type': 'application/fhir+json' },
        });

        const result = await resolveAttachmentContent(attachment, baseApi);

        expect(result.kind).toBe('unavailable');
        if (result.kind !== 'unavailable') {
            throw new Error('expected unavailable');
        }
        expect(result.reason).toBe('malformed');
        if (result.reason !== 'malformed') {
            throw new Error('expected malformed');
        }
        expect(result.detail).toContain('no usable "data" field');
    });

    it('treats a JSON-flavored response whose body is not the Binary wrapper as the real content', async () => {
        const attachment: TAttachment = { url: 'Binary/abc123' as any, contentType: 'application/json' as any };
        const payload = JSON.stringify({ resourceType: 'Observation', id: '1' });
        vi.spyOn(baseApi, 'downloadFile').mockResolvedValue({
            status: 200,
            data: new Blob([payload], { type: 'application/fhir+json' }),
            headers: { 'content-type': 'application/fhir+json' },
        });

        const result = await resolveAttachmentContent(attachment, baseApi);

        expect(result.kind).toBe('resolved');
        if (result.kind !== 'resolved') {
            throw new Error('expected resolved');
        }
        expect(await result.content.blob.text()).toBe(payload);
    });

    it('reports a network failure with the HTTP status when the Binary fetch fails', async () => {
        const attachment: TAttachment = { url: 'Binary/abc123' as any };
        vi.spyOn(baseApi, 'downloadFile').mockRejectedValue(
            Object.assign(new Error('Request failed with status 404'), { status: 404 })
        );

        const result = await resolveAttachmentContent(attachment, baseApi);

        expect(result.kind).toBe('unavailable');
        if (result.kind !== 'unavailable') {
            throw new Error('expected unavailable');
        }
        expect(result.reason).toBe('network');
        if (result.reason !== 'network') {
            throw new Error('expected network');
        }
        expect(result.detail).toContain('HTTP 404');
    });

    it('returns an external result for a non-Binary URL', async () => {
        const attachment: TAttachment = { url: 'https://example.com/report.pdf' as any };

        const result = await resolveAttachmentContent(attachment, baseApi);

        expect(result).toEqual({ kind: 'external', externalUrl: 'https://example.com/report.pdf' });
    });

    it('does not treat an absolute Binary URL from a different origin as same-server', async () => {
        const attachment: TAttachment = { url: 'https://other-server.example.com/Binary/abc123' as any };

        const result = await resolveAttachmentContent(attachment, baseApi, 'https://fhir.example.com');

        expect(result).toEqual({
            kind: 'external',
            externalUrl: 'https://other-server.example.com/Binary/abc123',
        });
    });

    it('returns missing when there is neither data nor url', async () => {
        const result = await resolveAttachmentContent({}, baseApi);

        expect(result).toEqual({ kind: 'unavailable', reason: 'missing' });
    });
});

describe('extensionForContentType', () => {
    it.each([
        ['text/html', 'html'],
        ['application/pdf', 'pdf'],
        ['image/png', 'png'],
        ['image/jpeg', 'jpg'],
    ])('maps %s to .%s', (contentType, expected) => {
        expect(extensionForContentType(contentType)).toBe(expected);
    });

    it('ignores charset/parameter suffixes and case', () => {
        expect(extensionForContentType('TEXT/HTML; charset=utf-8')).toBe('html');
    });

    it('falls back to bin for unknown or missing content types', () => {
        expect(extensionForContentType('application/x-made-up')).toBe('bin');
        expect(extensionForContentType(undefined)).toBe('bin');
    });
});
