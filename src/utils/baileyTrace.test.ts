import { describe, expect, it } from 'vitest';
import { BaileyTraceEvent } from '../types/baileyChat';
import { formatTraceGap, toTraceRows, traceSummaryLine } from './baileyTrace';

describe('formatTraceGap', () => {
    it.each([
        [0, '+0ms'],
        [-50, '+0ms'],
        [42, '+42ms'],
        [999, '+999ms'],
        [1000, '+1.0s'],
        [1500, '+1.5s'],
        [59999, '+60.0s'],
        [60000, '+1m00s'],
        [125000, '+2m05s'],
    ])('formats %ims as %s', (ms, expected) => {
        expect(formatTraceGap(ms)).toBe(expected);
    });
});

describe('traceSummaryLine', () => {
    it('returns an empty string when there is nothing to summarize', () => {
        expect(traceSummaryLine([])).toBe('');
    });

    it('counts tool calls and failures', () => {
        const events: BaileyTraceEvent[] = [
            { kind: 'tool_start', name: 'search_observations', at: 1, turnSentAt: 0 },
            { kind: 'tool_end', name: 'search_observations', at: 2, turnSentAt: 0, isError: false },
            { kind: 'tool_start', name: 'get_patient', at: 3, turnSentAt: 0 },
            { kind: 'tool_end', name: 'get_patient', at: 4, turnSentAt: 0, isError: true },
        ];
        expect(traceSummaryLine(events)).toBe('2 tool calls, 1 failed');
    });

    it('counts stream errors alongside tool calls', () => {
        const events: BaileyTraceEvent[] = [
            { kind: 'tool_end', name: 'search_observations', at: 1, turnSentAt: 0, isError: false },
            { kind: 'error', message: 'boom', at: 2, turnSentAt: 0 },
        ];
        expect(traceSummaryLine(events)).toBe('1 tool call · 1 stream error');
    });
});

describe('toTraceRows', () => {
    it('computes gapMs relative to the previous event, and to turnSentAt for the first row', () => {
        const events: BaileyTraceEvent[] = [
            { kind: 'tool_start', name: 'search_observations', at: 1200, turnSentAt: 1000 },
            { kind: 'tool_end', name: 'search_observations', at: 1500, turnSentAt: 1000, isError: false },
        ];
        const rows = toTraceRows(events);
        expect(rows[0]?.gapMs).toBe(200);
        expect(rows[1]?.gapMs).toBe(300);
    });

    it('defaults the first row gap to 0 when turnSentAt equals the event time', () => {
        const events: BaileyTraceEvent[] = [
            { kind: 'tool_start', name: 'search_observations', at: 1200, turnSentAt: 1200 },
        ];
        expect(toTraceRows(events)[0]?.gapMs).toBe(0);
    });

    it("uses the first row's own turnSentAt even after a later turn's events accumulate onto the array", () => {
        // Regression test: traceEvents accumulates across turns (only cleared via user-triggered
        // Clear), so row 0 must stay pinned to the turn that actually produced it, not whichever
        // turn most recently started. Turn 2 starting at 5000ms must not affect turn 1's row 0.
        const events: BaileyTraceEvent[] = [
            { kind: 'tool_start', name: 'search_observations', at: 1450, turnSentAt: 1000 },
            { kind: 'tool_start', name: 'get_patient', at: 5200, turnSentAt: 5000 },
        ];
        const rows = toTraceRows(events);
        expect(rows[0]?.gapMs).toBe(450);
        expect(rows[1]?.gapMs).toBe(3750);
    });
});
