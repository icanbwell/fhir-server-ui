import { useMemo, useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { BaileyLastRequest, BaileyStreamStats, BaileyTraceEvent } from '../types/baileyChat';
import { formatTraceGap, hasTraceFailure, toTraceRows, toTraceSegments, traceSummaryLine, TraceRow } from '../utils/baileyTrace';
import { copyToClipboard } from '../utils/clipboard';

interface BaileyTracePanelProps {
    events: BaileyTraceEvent[];
    lastRequest: BaileyLastRequest | null;
    onClear: () => void;
}

// Ported from baileyai-skills-service's frontend/src/components/chat/ChatTracePanel.tsx and
// ChatTrace.tsx (the other real consumer of this same endpoint): tool calls, progress updates,
// and stream errors are collected into one "Show details" panel — collapsed by default — rather
// than rendered inline in the transcript, so a non-developer chat user isn't shown raw tool
// names/args/JSON on every turn.

function CopyButton({ text }: { text: string }) {
    return (
        <Button size="small" onClick={() => copyToClipboard(text)} sx={{ textTransform: 'none', minWidth: 0, p: 0 }}>
            Copy
        </Button>
    );
}

function rowColor(row: TraceRow): 'default' | 'error' | 'info' | 'success' | 'secondary' {
    if (row.failed || row.kind === 'error') {
        return 'error';
    }
    switch (row.kind) {
        case 'tool_start':
            return 'info';
        case 'tool_end':
            return 'success';
        case 'progress':
            return 'secondary';
        default:
            return 'default';
    }
}

function DetailDisclosure({ label, content, copyable }: { label: string; content: string; copyable?: boolean }) {
    return (
        <Box component="details" sx={{ mt: 0.5 }}>
            <Box component="summary" sx={{ cursor: 'pointer', fontSize: '0.7rem', color: 'text.secondary' }}>
                {label}
            </Box>
            {copyable && (
                <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 0.5 }}>
                    <CopyButton text={content} />
                </Stack>
            )}
            <Box
                component="pre"
                sx={{
                    mt: 0.5,
                    p: 0.75,
                    maxHeight: 200,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontSize: '0.7rem',
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1,
                }}
            >
                {content}
            </Box>
        </Box>
    );
}

function TraceRowView({ row }: { row: TraceRow }) {
    return (
        <Box
            sx={{
                px: 1,
                py: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
            }}
        >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography component="span" sx={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'text.secondary' }}>
                    {row.time}
                </Typography>
                <Typography
                    component="span"
                    title="Time since the previous event"
                    sx={{ fontFamily: 'inherit', fontSize: 'inherit', color: 'text.disabled' }}
                >
                    {formatTraceGap(row.gapMs)}
                </Typography>
                <Chip size="small" color={rowColor(row)} label={row.label} sx={{ fontFamily: 'inherit' }} />
                <Typography component="span" sx={{ fontFamily: 'inherit', fontSize: 'inherit', wordBreak: 'break-all' }}>
                    {row.summary}
                </Typography>
            </Stack>
            {row.argsDetail && <DetailDisclosure label="args" content={row.argsDetail} />}
            {row.outputDetail && <DetailDisclosure label="output" content={row.outputDetail} />}
            {row.rawDetail && <DetailDisclosure label="raw" content={row.rawDetail} />}
        </Box>
    );
}

function formatStreamStats(stats: BaileyStreamStats, sentAt: number): string {
    if (stats.chunkCount === 0) {
        return 'Streamed: no chunks received';
    }
    if (stats.chunkCount === 1 || stats.firstChunkAt === null) {
        return 'Streamed: 1 chunk (not incremental)';
    }
    const ttfbMs = stats.firstChunkAt - sentAt;
    const spanMs = (stats.lastChunkAt ?? stats.firstChunkAt) - stats.firstChunkAt;
    return `Streamed: ${stats.chunkCount} chunks · first chunk after ${ttfbMs}ms · spread over ${(spanMs / 1000).toFixed(1)}s`;
}

function RequestDetails({ request }: { request: BaileyLastRequest }) {
    const payloadJson = useMemo(
        () =>
            JSON.stringify(
                {
                    model: request.model,
                    instructions: request.systemPrompt,
                    input: request.messages,
                    stream: request.stream,
                    tools: request.tools,
                },
                null,
                2
            ),
        [request]
    );

    return (
        <Box sx={{ mb: 0.5, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Last request — {request.model} · {new Date(request.sentAt).toLocaleTimeString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {formatStreamStats(request.streamStats, request.sentAt)}
            </Typography>

            <DetailDisclosure label={`System prompt (${request.systemPrompt.length.toLocaleString()} chars)`} content={request.systemPrompt} copyable />
            <DetailDisclosure label={`Messages (${request.messages.length})`} content={JSON.stringify(request.messages, null, 2)} copyable />
            {request.response && (
                <DetailDisclosure
                    label={`Response (${request.response.content.length.toLocaleString()} chars)`}
                    content={request.response.content}
                    copyable
                />
            )}
            <DetailDisclosure label="Full payload (JSON)" content={payloadJson} copyable />
        </Box>
    );
}

const BaileyTracePanel = ({ events, lastRequest, onClear }: BaileyTracePanelProps) => {
    const [show, setShow] = useState(false);
    // Surfaced on the collapsed toggle so the user knows there's something worth opening the
    // panel for, without having to open it first to find out.
    const hasFailure = useMemo(() => hasTraceFailure(events), [events]);
    const rows = useMemo(() => toTraceRows(events), [events]);
    const segments = useMemo(() => toTraceSegments(rows), [rows]);
    const summaryLine = useMemo(() => traceSummaryLine(events), [events]);
    const traceJson = useMemo(() => JSON.stringify(events, null, 2), [events]);

    if (events.length === 0 && !lastRequest) {
        return null;
    }

    return (
        <Box sx={{ mb: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button
                    size="small"
                    color={hasFailure ? 'error' : 'inherit'}
                    onClick={() => setShow((prev) => !prev)}
                    sx={{ textTransform: 'none' }}
                >
                    {hasFailure && !show ? '⚠ ' : ''}
                    {show ? 'Hide details' : 'Show details'} ({events.length})
                </Button>
                {summaryLine && (
                    <Typography variant="caption" color={hasFailure ? 'error' : 'text.secondary'}>
                        {summaryLine}
                    </Typography>
                )}
            </Stack>
            {show && (
                <Box sx={{ mt: 0.5, maxHeight: 320, overflowY: 'auto' }}>
                    <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                        {events.length > 0 && (
                            <Button size="small" onClick={() => copyToClipboard(traceJson)} sx={{ textTransform: 'none' }}>
                                Copy trace as JSON
                            </Button>
                        )}
                        <Button size="small" onClick={onClear} sx={{ textTransform: 'none' }}>
                            Clear
                        </Button>
                    </Stack>

                    {lastRequest && <RequestDetails request={lastRequest} />}

                    <Stack spacing={0.5}>
                        {segments.map((segment, idx) => {
                            if (segment.type === 'single') {
                                return <TraceRowView key={segment.row.key} row={segment.row} />;
                            }
                            const callCount = segment.rows.filter((r) => r.isToolStart).length;
                            if (callCount <= 1) {
                                return (
                                    <Stack key={`group-${idx}`} spacing={0.5}>
                                        {segment.rows.map((row) => (
                                            <TraceRowView key={row.key} row={row} />
                                        ))}
                                    </Stack>
                                );
                            }
                            const failCount = segment.rows.filter((r) => r.failed).length;
                            return (
                                <Box
                                    key={`group-${idx}`}
                                    component="details"
                                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1, py: 0.5 }}
                                >
                                    <Box component="summary" sx={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        <strong>{segment.toolName}</strong> × {callCount}
                                        {failCount > 0 && (
                                            <Typography component="span" color="error" sx={{ ml: 1, fontSize: 'inherit' }}>
                                                {failCount} failed
                                            </Typography>
                                        )}
                                    </Box>
                                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                        {segment.rows.map((row) => (
                                            <TraceRowView key={row.key} row={row} />
                                        ))}
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default BaileyTracePanel;
