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
            { kind: 'tool_start', name: 'search_observations', at: 1 },
            { kind: 'tool_end', name: 'search_observations', at: 2, isError: false },
            { kind: 'tool_start', name: 'get_patient', at: 3 },
            { kind: 'tool_end', name: 'get_patient', at: 4, isError: true },
        ];
        expect(traceSummaryLine(events)).toBe('2 tool calls, 1 failed');
    });

    it('counts stream errors alongside tool calls', () => {
        const events: BaileyTraceEvent[] = [
            { kind: 'tool_end', name: 'search_observations', at: 1, isError: false },
            { kind: 'error', message: 'boom', at: 2 },
        ];
        expect(traceSummaryLine(events)).toBe('1 tool call · 1 stream error');
    });
});

describe('toTraceRows', () => {
    it('computes gapMs relative to the previous event, and to sentAt for the first row', () => {
        const events: BaileyTraceEvent[] = [
            { kind: 'tool_start', name: 'search_observations', at: 1200 },
            { kind: 'tool_end', name: 'search_observations', at: 1500, isError: false },
        ];
        const rows = toTraceRows(events, 1000);
        expect(rows[0]?.gapMs).toBe(200);
        expect(rows[1]?.gapMs).toBe(300);
    });

    it('defaults the first row gap to 0 when no sentAt baseline is given', () => {
        const events: BaileyTraceEvent[] = [{ kind: 'tool_start', name: 'search_observations', at: 1200 }];
        expect(toTraceRows(events)[0]?.gapMs).toBe(0);
    });
});
