import { describe, expect, it } from 'vitest';
import { formatHumanName } from './humanName';

describe('formatHumanName', () => {
    it('prefers name.text when present', () => {
        expect(formatHumanName([{ text: 'Kevin LeStarge', given: ['K'], family: 'X' }])).toBe(
            'Kevin LeStarge'
        );
    });

    it('falls back to given + family when there is no text', () => {
        expect(formatHumanName([{ given: ['Kevin'], family: 'LeStarge' }])).toBe('Kevin LeStarge');
    });

    it('joins multiple given names', () => {
        expect(formatHumanName([{ given: ['Kevin', 'B'], family: 'LeStarge' }])).toBe(
            'Kevin B LeStarge'
        );
    });

    it('handles a family name with no given name', () => {
        expect(formatHumanName([{ family: 'LeStarge' }])).toBe('LeStarge');
    });

    it('handles a given name with no family name', () => {
        expect(formatHumanName([{ given: ['Kevin'] }])).toBe('Kevin');
    });

    it('uses the first entry when there are several', () => {
        expect(
            formatHumanName([
                { text: 'Kevin LeStarge' },
                { text: 'Some Other Alias' },
            ])
        ).toBe('Kevin LeStarge');
    });

    it('accepts a single HumanName object instead of an array', () => {
        expect(formatHumanName({ text: 'Kevin LeStarge' })).toBe('Kevin LeStarge');
    });

    it('returns undefined when there is no name at all', () => {
        expect(formatHumanName(undefined)).toBeUndefined();
    });

    it('returns undefined for an empty name array', () => {
        expect(formatHumanName([])).toBeUndefined();
    });

    it('returns undefined when the only entry has neither text, given, nor family', () => {
        expect(formatHumanName([{ use: 'old' }])).toBeUndefined();
    });
});
