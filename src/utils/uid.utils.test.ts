import { describe, expect, it } from 'vitest';
import { generateUuidV5, isUuid } from './uid.utils';

describe('generateUuidV5', () => {
    it('is deterministic for the same input', () => {
        expect(generateUuidV5('Patient/123')).toBe(generateUuidV5('Patient/123'));
    });

    it('produces different ids for different input', () => {
        expect(generateUuidV5('Patient/123')).not.toBe(generateUuidV5('Patient/456'));
    });

    it('produces a well-formed v5 UUID', () => {
        expect(generateUuidV5('Patient/123')).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        );
    });
});

describe('isUuid', () => {
    it('returns true for a canonical UUID', () => {
        expect(isUuid('6ba7b812-9dad-11d1-80b4-00c04fd430c8')).toBeTruthy();
    });

    it('returns true for a bare UUID pattern embedded in a longer string', () => {
        expect(isUuid('urn:uuid:6ba7b812-9dad-11d1-80b4-00c04fd430c8')).toBeTruthy();
    });

    it('returns false for a non-UUID string', () => {
        expect(isUuid('not-a-uuid')).toBeFalsy();
    });

    it('returns falsy for an empty string', () => {
        expect(isUuid('')).toBeFalsy();
    });
});
