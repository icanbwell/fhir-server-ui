import { describe, expect, it } from 'vitest';
import {
    ACCEPTED_UPLOAD_ACCEPT_ATTR,
    MAX_UPLOAD_SIZE_BYTES,
    buildEncounterReference,
    buildSubjectReference,
    extractMergeFailureMessage,
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

    it('rejects prototype-pollution attack attempts (e.g., "resume.constructor")', () => {
        const result = validateUploadFile({ name: 'resume.constructor', size: 1024 });
        expect('error' in result).toBe(true);
        expect(result).toHaveProperty('error');
    });

    it('rejects prototype-pollution attack attempts (e.g., "photo.toString")', () => {
        const result = validateUploadFile({ name: 'photo.toString', size: 1024 });
        expect('error' in result).toBe(true);
        expect(result).toHaveProperty('error');
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

describe('buildEncounterReference', () => {
    it('builds an Encounter reference from an id', () => {
        expect(buildEncounterReference('enc-1')).toBe('Encounter/enc-1');
    });
});

// $merge answers 2xx even when it rejected the resource, so this function is the only thing
// standing between a silently-dropped upload and an error the user sees. Each branch is covered
// separately, and every branch that reports a failure is asserted to return a NON-empty string:
// returning undefined for a real failure is the silent-success bug this function exists to stop.
describe('extractMergeFailureMessage', () => {
    it('returns undefined for a non-object input (null, undefined, string, number)', () => {
        expect(extractMergeFailureMessage(null)).toBeUndefined();
        expect(extractMergeFailureMessage(undefined)).toBeUndefined();
        expect(extractMergeFailureMessage('boom')).toBeUndefined();
        expect(extractMergeFailureMessage(0)).toBeUndefined();
    });

    it('reports the whole body when the server answered with an OperationOutcome', () => {
        const json = {
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', diagnostics: 'access denied' }],
        };

        expect(extractMergeFailureMessage(json)).toBe(JSON.stringify(json));
    });

    it('reports the whole body when issue is an array, whatever the resourceType says', () => {
        // The array-issue shape is checked independently of resourceType, so a Binary/
        // DocumentReference body carrying an issue array is still reported.
        const json = { resourceType: 'Binary', issue: [{ diagnostics: 'invalid base64' }] };

        expect(extractMergeFailureMessage(json)).toBe(JSON.stringify(json));
    });

    it('prefers operationOutcome.issue[0].diagnostics on a created:false/updated:false entry', () => {
        const json = {
            resourceType: 'DocumentReference',
            created: false,
            updated: false,
            issue: { diagnostics: 'the single-object issue' },
            operationOutcome: {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', diagnostics: 'owner tag missing' }],
            },
        };

        expect(extractMergeFailureMessage(json)).toBe('owner tag missing');
    });

    it('falls back to the single-object issue when there is no operationOutcome', () => {
        const json = {
            resourceType: 'DocumentReference',
            created: false,
            updated: false,
            issue: { severity: 'error', diagnostics: 'resource is invalid' },
        };

        expect(extractMergeFailureMessage(json)).toBe('resource is invalid');
    });

    it('falls back to issue.details.text when the issue carries no diagnostics', () => {
        const json = {
            resourceType: 'DocumentReference',
            created: false,
            updated: false,
            issue: { severity: 'error', details: { text: 'no access to this patient' } },
        };

        expect(extractMergeFailureMessage(json)).toBe('no access to this patient');
    });

    it('falls back to the serialized body when a rejected entry explains nothing', () => {
        // Worst case: $merge said it neither created nor updated and gave no reason. Returning
        // undefined here would render the failed upload as a success.
        const json = { resourceType: 'DocumentReference', created: false, updated: false };

        expect(extractMergeFailureMessage(json)).toBe(JSON.stringify(json));
    });

    it('returns undefined for a successful merge result, so no error is raised', () => {
        expect(
            extractMergeFailureMessage({ resourceType: 'DocumentReference', created: true, updated: false })
        ).toBeUndefined();
        expect(
            extractMergeFailureMessage({ resourceType: 'DocumentReference', created: false, updated: true })
        ).toBeUndefined();
        expect(extractMergeFailureMessage({ id: 'doc-1' })).toBeUndefined();
    });
});
