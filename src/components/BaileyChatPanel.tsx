import { FormEvent, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import Markdown from 'react-markdown';
import useBaileyChat from '../hooks/useBaileyChat';

const BaileyChatPanel = () => {
    const { messages, status, error, send, stop, retryLast } = useBaileyChat();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

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
                {messages.map((message) => (
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
                                <Markdown>{message.content || (message.streaming ? '…' : '')}</Markdown>
                            ) : (
                                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
                            )}
                            {message.toolCalls?.map((toolCall, index) => (
                                <Chip
                                    key={`${message.id}-tool-${index}`}
                                    size="small"
                                    color={toolCall.isError ? 'error' : 'default'}
                                    label={`🔧 ${toolCall.name}${toolCall.arguments ? `(${toolCall.arguments})` : ''}`}
                                    sx={{ mt: 1, mr: 0.5 }}
                                />
                            ))}
                        </Paper>
                    </Box>
                ))}
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
