import { useMemo, useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import { BaileyTraceEvent } from '../types/baileyChat';
import { hasTraceFailure, toTraceRows, toTraceSegments, TraceRow } from '../utils/baileyTrace';

interface BaileyTracePanelProps {
    events: BaileyTraceEvent[];
    onClear: () => void;
}

// Ported from baileyai-skills-service's frontend/src/components/chat/ChatTracePanel.tsx and
// ChatTrace.tsx (the other real consumer of this same endpoint): tool calls, progress updates,
// and stream errors are collected into one "Show details" panel — collapsed by default — rather
// than rendered inline in the transcript, so a non-developer chat user isn't shown raw tool
// names/args/JSON on every turn.

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

function DetailDisclosure({ label, content }: { label: string; content: string }) {
    return (
        <Box component="details" sx={{ mt: 0.5 }}>
            <Box component="summary" sx={{ cursor: 'pointer', fontSize: '0.7rem', color: 'text.secondary' }}>
                {label}
            </Box>
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

const BaileyTracePanel = ({ events, onClear }: BaileyTracePanelProps) => {
    const [show, setShow] = useState(false);
    // Surfaced on the collapsed toggle so the user knows there's something worth opening the
    // panel for, without having to open it first to find out.
    const hasFailure = useMemo(() => hasTraceFailure(events), [events]);
    const rows = useMemo(() => toTraceRows(events), [events]);
    const segments = useMemo(() => toTraceSegments(rows), [rows]);

    if (events.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mb: 1 }}>
            <Button
                size="small"
                color={hasFailure ? 'error' : 'inherit'}
                onClick={() => setShow((prev) => !prev)}
                sx={{ textTransform: 'none' }}
            >
                {hasFailure && !show ? '⚠ ' : ''}
                {show ? 'Hide details' : 'Show details'} ({events.length})
            </Button>
            {show && (
                <Box sx={{ mt: 0.5, maxHeight: 320, overflowY: 'auto' }}>
                    <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                        <Button size="small" onClick={onClear} sx={{ textTransform: 'none' }}>
                            Clear
                        </Button>
                    </Stack>
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
