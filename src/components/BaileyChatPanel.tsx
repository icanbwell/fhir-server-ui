import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Link, Paper, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useBaileyChat from '../hooks/useBaileyChat';
import BaileyTracePanel from './BaileyTracePanel';
import BaileyChart from './BaileyChart';
import { traceEventHint } from '../utils/baileyTrace';
import { parseBaileyChartSpec } from '../utils/baileyChart';
import { useTheme } from '../context/ThemeContext';
import './BaileyMarkdown.css';
import './MarkdownTable.css';

// Matches the target="_blank" rel="noopener noreferrer" convention used for every other outbound
// link in this app (ResourceCard, IPSViewer, AttachmentPreview, etc.) — without this override,
// remark-gfm's autolink-literal extension turns bare URLs in assistant text into <a> tags that
// navigate the SPA away in-place instead of opening in a new tab.
const markdownComponents = {
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
        <Link href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </Link>
    ),
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
            <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                {messages.map((message, index) => {
                    const isLastAssistant = message.role === 'assistant' && index === messages.length - 1;
                    const isAwaitingFirstToken = status === 'streaming' && isLastAssistant && message.content === '';
                    return (
                        <Box
                            key={message.id}
                            sx={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}
                        >
                            <Paper
                                sx={{
                                    p: 1.5,
                                    maxWidth: '75%',
                                    bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                                    color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                                }}
                            >
                                {message.role === 'assistant' ? (
                                    isAwaitingFirstToken ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            {streamingHint ?? 'Thinking…'}
                                        </Typography>
                                    ) : (
                                        <>
                                            <div
                                                className={`bailey-markdown-content markdown-table-content${isDarkMode ? ' dark-mode' : ''}`}
                                            >
                                                <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                    {message.content}
                                                </Markdown>
                                            </div>
                                            {message.streaming && streamingHint && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
                                                >
                                                    {streamingHint}
                                                </Typography>
                                            )}
                                        </>
                                    )
                                ) : (
                                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
                                )}
                            </Paper>
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
