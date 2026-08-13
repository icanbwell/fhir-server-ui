import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import Markdown from 'react-markdown';
import useBaileyChat from '../hooks/useBaileyChat';
import BaileyTracePanel from './BaileyTracePanel';
import { traceEventHint } from '../utils/baileyTrace';

const BaileyChatPanel = () => {
    const { messages, traceEvents, lastRequest, status, error, send, stop, retryLast, clearTrace } = useBaileyChat();
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
                                            <Markdown>{message.content}</Markdown>
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
