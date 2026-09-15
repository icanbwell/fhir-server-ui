import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import { getStartAndEndDate } from './auditEventDateFilter';

const NOW = '2026-03-15T12:34:56Z';

describe('getStartAndEndDate', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(NOW));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('ends at "now" and starts exactly 7 days earlier (invariant 8: bounded window)', () => {
        const { startDate, endDate } = getStartAndEndDate();

        expect(endDate.diff(startDate, 'day')).toBe(7);
        expect(endDate.toISOString()).toBe('2026-03-15T12:34:56.000Z');
        expect(startDate.toISOString()).toBe('2026-03-08T12:34:56.000Z');
    });

    it('returns dayjs instances that satisfy fhirApi.addMissingRequiredParams\' contract', () => {
        const { startDate, endDate } = getStartAndEndDate();

        // fhirApi calls .toISOString().split('T')[0] on both bounds - swapping these for a
        // plain Date or a string would break that call site.
        expect(startDate.toISOString().split('T')[0]).toBe('2026-03-08');
        expect(endDate.toISOString().split('T')[0]).toBe('2026-03-15');
        expect(dayjs.isDayjs(startDate)).toBe(true);
        expect(dayjs.isDayjs(endDate)).toBe(true);
    });

    it('produces the exact date query parameters fhirApi appends for AuditEvent', () => {
        const { startDate, endDate } = getStartAndEndDate();

        expect(`ge${startDate.toISOString().split('T')[0]}`).toBe('ge2026-03-08');
        expect(`le${endDate.toISOString().split('T')[0]}`).toBe('le2026-03-15');
    });

    it('preserves the time-of-day on both bounds instead of zeroing it', () => {
        const { startDate, endDate } = getStartAndEndDate();

        expect(startDate.format('HH:mm:ss')).toBe(endDate.format('HH:mm:ss'));
        expect(startDate.format('HH:mm:ss')).not.toBe('00:00:00');
        expect(startDate.hour()).toBe(endDate.hour());
        expect(startDate.minute()).toBe(endDate.minute());
        expect(startDate.second()).toBe(endDate.second());
        expect(endDate.millisecond()).toBe(0);
    });

    it('rolls back across a month boundary', () => {
        vi.setSystemTime(new Date('2026-03-05T08:00:00Z'));

        const { startDate, endDate } = getStartAndEndDate();

        expect(startDate.toISOString().split('T')[0]).toBe('2026-02-26');
        expect(endDate.toISOString().split('T')[0]).toBe('2026-03-05');
        expect(endDate.diff(startDate, 'day')).toBe(7);
    });

    it('rolls back across a year boundary', () => {
        vi.setSystemTime(new Date('2026-01-03T08:00:00Z'));

        const { startDate, endDate } = getStartAndEndDate();

        expect(startDate.toISOString().split('T')[0]).toBe('2025-12-27');
        expect(endDate.toISOString().split('T')[0]).toBe('2026-01-03');
        expect(endDate.diff(startDate, 'day')).toBe(7);
    });

    it('re-reads the clock on every call rather than freezing a module-load value', () => {
        const first = getStartAndEndDate();

        vi.setSystemTime(new Date('2026-06-20T12:34:56Z'));
        const second = getStartAndEndDate();

        expect(first.endDate.toISOString().split('T')[0]).toBe('2026-03-15');
        expect(second.endDate.toISOString().split('T')[0]).toBe('2026-06-20');
        expect(second.startDate.toISOString().split('T')[0]).toBe('2026-06-13');
    });
});
