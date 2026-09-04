import { describe, expect, it } from 'vitest';
import {
    ACCEPTED_UPLOAD_ACCEPT_ATTR,
    MAX_UPLOAD_SIZE_BYTES,
    buildSubjectReference,
    fileToBase64,
    validateUploadFile,
} from './uploadDocument.utils';

describe('validateUploadFile', () => {
    it('accepts a supported extension and returns its content type', () => {
        expect(validateUploadFile({ name: 'scan.pdf', size: 1024 })).toEqual({ contentType: 'application/pdf' });
    });

    it('is case-insensitive on extension', () => {
        expect(validateUploadFile({ name: 'PHOTO.JPG', size: 1024 })).toEqual({ contentType: 'image/jpeg' });
    });

    it('rejects an unsupported extension', () => {
        const result = validateUploadFile({ name: 'archive.zip', size: 1024 });
        expect('error' in result).toBe(true);
    });

    it('rejects a file with no extension', () => {
        const result = validateUploadFile({ name: 'noext', size: 1024 });
        expect('error' in result).toBe(true);
    });

    it('rejects a file over the size cap', () => {
        const result = validateUploadFile({ name: 'big.pdf', size: MAX_UPLOAD_SIZE_BYTES + 1 });
        expect('error' in result).toBe(true);
    });

    it('accepts a file exactly at the size cap', () => {
        expect(validateUploadFile({ name: 'exact.pdf', size: MAX_UPLOAD_SIZE_BYTES })).toEqual({
            contentType: 'application/pdf',
        });
    });
});

describe('ACCEPTED_UPLOAD_ACCEPT_ATTR', () => {
    it('lists every accepted extension for the file input accept attribute', () => {
        expect(ACCEPTED_UPLOAD_ACCEPT_ATTR).toBe('.pdf,.jpg,.jpeg,.png,.heic,.txt,.json,.xml');
    });
});

describe('fileToBase64', () => {
    it('resolves to the base64 payload without the data-URL prefix', async () => {
        const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        await expect(fileToBase64(file)).resolves.toBe('aGVsbG8=');
    });
});

describe('buildSubjectReference', () => {
    it('builds a plain Patient reference for a Patient resourceType', () => {
        expect(buildSubjectReference({ resourceType: 'Patient', id: 'abc123' })).toBe('Patient/abc123');
    });

    it('builds a person-compartment Patient reference for a Person resourceType', () => {
        expect(buildSubjectReference({ resourceType: 'Person', id: 'abc123' })).toBe('Patient/person.abc123');
    });
});
