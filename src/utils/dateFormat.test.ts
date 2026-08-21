import { describe, expect, it } from 'vitest';
import { formatHumanDate, looksLikeIsoDate } from './dateFormat';

describe('looksLikeIsoDate', () => {
    it('matches a date-only value', () => {
        expect(looksLikeIsoDate('2026-08-13')).toBe(true);
    });

    it('matches a full date-time value with a timezone offset', () => {
        expect(looksLikeIsoDate('2026-08-13T15:58:28.013321+00:00')).toBe(true);
    });

    it('matches a full date-time value ending in Z', () => {
        expect(looksLikeIsoDate('2026-08-13T15:58:28.013Z')).toBe(true);
    });

    it('does not match plain narrative text', () => {
        expect(looksLikeIsoDate('Patient reports no known allergies')).toBe(false);
    });
});

describe('formatHumanDate', () => {
    it('formats a date-time value with time, month name, and a timezone abbreviation', () => {
        const result = formatHumanDate('2026-08-13T15:58:28.013321+00:00');
        expect(result).toMatch(/Aug 13, 2026/);
        expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('formats a date-only value without a time component', () => {
        // The exact day can shift by one depending on the runner's local timezone, since
        // date-only ISO strings parse as UTC midnight - assert the shape, not an exact day.
        expect(formatHumanDate('2026-08-13')).toMatch(/^[A-Za-z]{3} \d{1,2}, 2026$/);
    });

    it('returns null for an unparseable value', () => {
        expect(formatHumanDate('not-a-date')).toBeNull();
    });

    it('returns null for an undefined value', () => {
        expect(formatHumanDate(undefined)).toBeNull();
    });
});
