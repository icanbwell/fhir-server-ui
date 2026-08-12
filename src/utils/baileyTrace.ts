import { BaileyTraceEvent } from '../types/baileyChat';
import { resolveToolCall } from './baileyToolCalls';

// Ported from baileyai-skills-service's frontend/src/components/chat/ChatTrace.tsx and
// traceFormat.ts (the other real consumer of this same endpoint) so the details panel here
// summarizes tool calls, progress, and errors the same way.

export const TRACE_KIND_LABEL: Record<BaileyTraceEvent['kind'], string> = {
    tool_start: 'Tool start',
    tool_end: 'Tool end',
    progress: 'Progress',
    error: 'Error',
    raw: 'Raw event',
};

export function traceEventToolName(event: BaileyTraceEvent): string | null {
    if (event.kind !== 'tool_start' && event.kind !== 'tool_end') {
        return null;
    }
    return resolveToolCall(event.name, event.args).name;
}

export function traceEventSummary(event: BaileyTraceEvent): string {
    switch (event.kind) {
        case 'tool_start': {
            const resolved = resolveToolCall(event.name, event.args);
            return resolved.viaCallTool ? `${resolved.name} (via call_tool)` : resolved.name;
        }
        case 'tool_end': {
            const resolved = resolveToolCall(event.name, event.args);
            const name = resolved.viaCallTool ? `${resolved.name} (via call_tool)` : resolved.name;
            const duration = event.runtimeSeconds !== undefined ? ` — ${event.runtimeSeconds.toFixed(2)}s` : '';
            return `${name}${duration}${event.isError ? ' — failed' : ''}`;
        }
        case 'progress':
            return event.message ? `${event.status} — ${event.message}` : event.status;
        case 'error':
            return event.message;
        case 'raw':
            return `Unrecognized event: ${event.eventType}`;
    }
}

export function traceEventArgsDetail(event: BaileyTraceEvent): string | null {
    if (event.kind === 'tool_start' || event.kind === 'tool_end') {
        const resolved = resolveToolCall(event.name, event.args);
        return resolved.args ? JSON.stringify(resolved.args, null, 2) : (event.args ?? null);
    }
    return null;
}

export function traceEventOutputDetail(event: BaileyTraceEvent): string | null {
    return event.kind === 'tool_end' ? (event.output ?? null) : null;
}

export function traceEventRawDetail(event: BaileyTraceEvent): string | null {
    return event.kind === 'raw' ? event.raw : null;
}

export function traceEventHint(event: BaileyTraceEvent): string {
    switch (event.kind) {
        case 'tool_start':
            return `Calling ${resolveToolCall(event.name, event.args).name}...`;
        case 'tool_end': {
            const name = resolveToolCall(event.name, event.args).name;
            return event.isError ? `${name} failed` : `${name} returned`;
        }
        case 'progress':
            return event.message ?? event.status;
        case 'error':
            return `Error: ${event.message}`;
        case 'raw':
            return `Unrecognized event: ${event.eventType}`;
    }
}

export interface TraceRow {
    key: string;
    kind: BaileyTraceEvent['kind'];
    toolName: string | null;
    isToolStart: boolean;
    failed: boolean;
    label: string;
    summary: string;
    argsDetail: string | null;
    outputDetail: string | null;
    rawDetail: string | null;
}

export function toTraceRows(events: BaileyTraceEvent[]): TraceRow[] {
    return events.map((event, idx) => ({
        key: `${event.at}-${idx}`,
        kind: event.kind,
        toolName: traceEventToolName(event),
        isToolStart: event.kind === 'tool_start',
        failed: event.kind === 'tool_end' && event.isError === true,
        label:
            event.kind === 'tool_end' && event.isError === true ? 'Tool failed' : TRACE_KIND_LABEL[event.kind],
        summary: traceEventSummary(event),
        argsDetail: traceEventArgsDetail(event),
        outputDetail: traceEventOutputDetail(event),
        rawDetail: traceEventRawDetail(event),
    }));
}

export type TraceSegment = { type: 'group'; toolName: string; rows: TraceRow[] } | { type: 'single'; row: TraceRow };

// Consecutive calls to the same tool collapse into one entry so they're scannable instead of a
// wall of near-identical rows; a single call is left exactly as-is.
export function toTraceSegments(rows: TraceRow[]): TraceSegment[] {
    const result: TraceSegment[] = [];
    for (const row of rows) {
        const last = result[result.length - 1];
        if (row.toolName && last?.type === 'group' && last.toolName === row.toolName) {
            last.rows.push(row);
            continue;
        }
        result.push(row.toolName ? { type: 'group', toolName: row.toolName, rows: [row] } : { type: 'single', row });
    }
    return result;
}

export function hasTraceFailure(events: BaileyTraceEvent[]): boolean {
    return events.some((e) => (e.kind === 'tool_end' && e.isError) || e.kind === 'error');
}
