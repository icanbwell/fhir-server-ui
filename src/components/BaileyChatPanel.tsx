import { FormEvent, ReactNode, memo, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Link, Paper, TextField, Tooltip, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useBaileyChat from '../hooks/useBaileyChat';
import BaileyTracePanel from './BaileyTracePanel';
import BaileyTable from './BaileyTable';
import BaileyChart from './BaileyChart';
import { traceEventHint } from '../utils/baileyTrace';
import { extractTableData, shouldUseGrid, type HastNode } from '../utils/baileyTable';
import { parseBaileyChartSpec } from '../utils/baileyChart';
import { copyToClipboard } from '../utils/clipboard';
import { isSafeMarkdownUrl } from '../utils/safeMarkdownUrl';
import { useTheme } from '../context/ThemeContext';
import './BaileyMarkdown.css';
import './MarkdownTable.css';

// How long the icon flips to a checkmark after a successful copy, mirroring the
// affordance in Claude Desktop's own response-footer copy button.
const COPY_CONFIRMATION_MS = 1500;

function CopyMarkdownButton({ markdown }: { markdown: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await copyToClipboard(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), COPY_CONFIRMATION_MS);
    };

    return (
        <Tooltip title={copied ? 'Copied!' : 'Copy as markdown'}>
            <IconButton size="small" onClick={handleCopy} aria-label="copy response as markdown" sx={{ color: 'text.secondary' }}>
                {copied ? <CheckIcon fontSize="inherit" /> : <ContentCopyIcon fontSize="inherit" />}
            </IconButton>
        </Tooltip>
    );
}

// Matches the target="_blank" rel="noopener noreferrer" convention used for every other outbound
// link in this app (ResourceCard, IPSViewer, AttachmentPreview, etc.) — without this override,
// remark-gfm's autolink-literal extension turns bare URLs in assistant text into <a> tags that
// navigate the SPA away in-place instead of opening in a new tab.
const markdownComponents = {
    a: ({ href, children }: { href?: string; children?: ReactNode }) =>
        !href || !isSafeMarkdownUrl(href) ? (
            <>{children}</>
        ) : (
            <Link href={href} target="_blank" rel="noopener noreferrer">
                {children}
            </Link>
        ),
    // Upgrades markdown tables past BAILEY_TABLE_GRID_ROW_THRESHOLD rows to a sortable/
    // filterable ag-grid widget; smaller tables keep the plain GFM rendering from #257.
    table: ({ node, children }: { node?: HastNode; children?: ReactNode }) => {
        const data = node && extractTableData(node);
        if (data && shouldUseGrid(data.rows)) {
            return <BaileyTable headers={data.headers} rows={data.rows} />;
        }
        return <table>{children}</table>;
    },
    // Routes ```chartjs code blocks to BaileyChart once a valid spec has streamed in; anything
    // else (a different language, or a chartjs block that's still mid-stream / malformed) falls
    // through to the default <pre> rendering unchanged.
    pre: ({ children }: { children?: ReactNode }) => {
        const codeElement = Array.isArray(children) ? children[0] : children;
        const codeProps = (codeElement as { props?: { className?: string; children?: ReactNode } } | undefined)
            ?.props;
        if (codeProps?.className === 'language-chartjs') {
            const raw = Array.isArray(codeProps.children) ? codeProps.children.join('') : String(codeProps.children ?? '');
            const spec = parseBaileyChartSpec(raw);
            if (spec) {
                return <BaileyChart spec={spec} />;
            }
        }
        return <pre>{children}</pre>;
    },
};

// Hoisted alongside markdownComponents for the same reason: a stable reference so react-markdown
// isn't handed a fresh array every render.
const remarkPlugins = [remarkGfm];

// A finished message's content never changes again, but BaileyChatPanel re-renders on every
// streamed token of *other* messages (new `messages` array reference each chunk) and on every
// keystroke in the input field. Without memoizing per-message, every earlier message's markdown
// tree — including markdownComponents.table's extractTableData call and .pre's JSON.parse +
// parseBaileyChartSpec call — re-runs on each of those renders even though nothing about that
// message changed. React.memo skips this component (and therefore those parse calls) entirely
// once `content`/`darkMode` are unchanged, which also keeps BaileyChart's `spec` prop reference
// stable so its own internal useMemo actually hits.
const MessageMarkdown = memo(function MessageMarkdown({ content, darkMode }: { content: string; darkMode: boolean }) {
    return (
        <div className={`bailey-markdown-content markdown-table-content${darkMode ? ' dark-mode' : ''}`}>
            <Markdown remarkPlugins={remarkPlugins} components={markdownComponents}>
                {content}
            </Markdown>
        </div>
    );
});

const BaileyChatPanel = () => {
    const { messages, traceEvents, lastRequest, status, error, send, stop, retryLast, clearTrace } = useBaileyChat();
    const { isDarkMode } = useTheme();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // Mirrors baileyai-skills-service's ChatTranscript: while streaming, show what Bailey is
    // doing (e.g. "Calling get_patient...") instead of a bare ellipsis. traceEvents isn't reset
    // per turn (same as the reference implementation), so this can briefly reflect the previous
    // turn's last event until the current turn produces its own.
    const streamingHint = useMemo(
        () => (status === 'streaming' && traceEvents.length > 0 ? traceEventHint(traceEvents[traceEvents.length - 1]) : undefined),
        [status, traceEvents]
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!input.trim() || status === 'streaming') {
            return;
        }
        send(input);
        setInput('');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '78vh' }}>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1 }}>
                {messages.map((message, index) => {
                    const isLastAssistant = message.role === 'assistant' && index === messages.length - 1;
                    const isAwaitingFirstToken = status === 'streaming' && isLastAssistant && message.content === '';
                    const assistantBody = isAwaitingFirstToken ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            {streamingHint ?? 'Thinking…'}
                        </Typography>
                    ) : (
                        <>
                            <MessageMarkdown content={message.content} darkMode={isDarkMode} />
                            {message.streaming && streamingHint && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
                                >
                                    {streamingHint}
                                </Typography>
                            )}
                            {!message.streaming && (
                                <Box sx={{ mt: 0.5 }}>
                                    <CopyMarkdownButton markdown={message.content} />
                                </Box>
                            )}
                        </>
                    );

                    return (
                        <Box
                            key={message.id}
                            sx={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}
                        >
                            {message.role === 'user' ? (
                                <Paper
                                    sx={{
                                        p: 1.5,
                                        maxWidth: '75%',
                                        borderRadius: 3,
                                        bgcolor: 'action.selected',
                                        color: 'text.primary',
                                    }}
                                >
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
                                </Paper>
                            ) : (
                                <Box sx={{ width: '100%', px: 0.5 }}>{assistantBody}</Box>
                            )}
                        </Box>
                    );
                })}
                <div ref={bottomRef} />
            </Box>

            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={retryLast}>
                            Retry
                        </Button>
                    }
                    sx={{ mb: 1 }}
                >
                    {error}
                </Alert>
            )}

            <BaileyTracePanel events={traceEvents} lastRequest={lastRequest} onClear={clearTrace} />

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask Bailey about FHIR data on this server…"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={status === 'streaming'}
                />
                {status === 'streaming' ? (
                    <>
                        <CircularProgress size={20} />
                        <IconButton color="error" onClick={stop} aria-label="stop">
                            <StopIcon />
                        </IconButton>
                    </>
                ) : (
                    <IconButton color="primary" type="submit" aria-label="send" disabled={!input.trim()}>
                        <SendIcon />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
};

export default BaileyChatPanel;
