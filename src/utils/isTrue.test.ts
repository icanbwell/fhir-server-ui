import { describe, expect, it } from 'vitest';
import { isTrue } from './isTrue';

describe('isTrue', () => {
    it.each(['true', 'True', 'TRUE', '1'])('returns true for %s', (value) => {
        expect(isTrue(value)).toBe(true);
    });

    it.each(['false', 'False', '0', '', 'yes', 'anything else'])('returns false for %s', (value) => {
        expect(isTrue(value)).toBe(false);
    });
});
