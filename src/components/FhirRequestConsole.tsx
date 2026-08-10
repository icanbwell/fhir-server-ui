import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PreJson from './PreJson';
import KeyValueRows, { KeyValueRow } from './KeyValueRows';
import { HttpMethod } from '../context/LastRequestContext';
import { StreamingFetchResult } from '../utils/streamingFetch';

const MIN_PANEL_WIDTH = 200;

export interface SendRequestParams {
    method: HttpMethod;
    urlPath: string;
    data?: object;
    headers?: Record<string, string>;
    onChunk?: (text: string) => void;
    onHeaders?: (status: number, headers: Record<string, string>) => void;
    signal?: AbortSignal;
}

export interface FhirRequestConsoleProps {
    method: HttpMethod;
    onMethodChange: (method: HttpMethod) => void;
    urlSuffix: string;
    onUrlSuffixChange: (urlSuffix: string) => void;
    resourceJson: string;
    onResourceJsonChange: (resourceJson: string) => void;
    requestPathPlaceholder: string;
    baseUrlForDisplay?: string;
    sendRequest: (params: SendRequestParams) => Promise<StreamingFetchResult>;
    sendDisabled?: boolean;
    loadingRequestBody?: boolean;
    splitPaneHeight?: string;
    readOnlyHeaderRows?: KeyValueRow[];
    readOnlyHeaderRowsLabel?: string;
}

const FhirRequestConsole = ({
    method,
    onMethodChange,
    urlSuffix,
    onUrlSuffixChange,
    resourceJson,
    onResourceJsonChange,
    requestPathPlaceholder,
    baseUrlForDisplay = '',
    sendRequest,
    sendDisabled = false,
    loadingRequestBody = false,
    splitPaneHeight = 'calc(100vh - 220px)',
    readOnlyHeaderRows,
    readOnlyHeaderRowsLabel,
}: FhirRequestConsoleProps) => {
    const [customHeaders, setCustomHeaders] = useState<KeyValueRow[]>([{ key: '', value: '' }]);
    const [activeRequestTab, setActiveRequestTab] = useState<'body' | 'headers'>('body');
    const [responseJson, setResponseJson] = useState<object | null>(null);
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
    const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
    const [loading, setLoading] = useState<boolean>(false);
    const [leftWidthPercent, setLeftWidthPercent] = useState<number>(50);
    const [streamedText, setStreamedText] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [responseIncomplete, setResponseIncomplete] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const requestUrl = useMemo(() => {
        if (!urlSuffix) {
            return '';
        }
        return urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`;
    }, [urlSuffix]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) {
            return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        const minPercent = (MIN_PANEL_WIDTH / rect.width) * 100;
        setLeftWidthPercent(Math.min(100 - minPercent, Math.max(minPercent, percent)));
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleDragStart = () => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handleSend = async () => {
        if (!requestUrl) {
            return;
        }
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setLoading(true);
            setIsStreaming(true);
            setResponseJson(null);
            setResponseStatus(null);
            setResponseHeaders({});
            setStreamedText('');
            setResponseIncomplete(false);

            let data: object | undefined;
            if (resourceJson.trim() && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                data = JSON.parse(resourceJson);
            }
            const headersToSend = Object.fromEntries(
                customHeaders
                    .map((row) => ({ key: row.key.trim(), value: row.value }))
                    .filter((row) => row.key && row.key.toLowerCase() !== 'authorization')
                    .map((row): [string, string] => [row.key, row.value])
            );

            const { json, status, headers, incomplete } = await sendRequest({
                method,
                urlPath: requestUrl,
                data,
                headers: headersToSend,
                signal: controller.signal,
                onChunk: (chunk) => {
                    if (controller.signal.aborted) {
                        return;
                    }
                    setStreamedText((prev) => prev + chunk);
                },
                onHeaders: (earlyStatus, earlyHeaders) => {
                    if (controller.signal.aborted) {
                        return;
                    }
                    setResponseStatus(earlyStatus);
                    setResponseHeaders(earlyHeaders);
                },
            });
            setResponseStatus(status ?? null);
            setResponseJson(json);
            setResponseHeaders(headers || {});
            setResponseIncomplete(!!incomplete);
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                return;
            }
            if (error instanceof SyntaxError) {
                setResponseStatus(null);
                setResponseJson({ error: 'Invalid JSON in editor' });
            } else {
                setResponseStatus(null);
                setResponseJson({ error: error.message || 'Request failed' });
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setIsStreaming(false);
                setLoading(false);
            }
        }
    };

    const getStatusColor = (status: number): 'success' | 'error' | 'warning' => {
        if (status >= 200 && status < 300) {
            return 'success';
        }
        if (status >= 400) {
            return 'error';
        }
        return 'warning';
    };

    const getMethodColor = (m: HttpMethod): string => {
        switch (m) {
            case 'GET': return '#4caf50';
            case 'POST': return '#ff9800';
            case 'PUT': return '#2196f3';
            case 'PATCH': return '#9c27b0';
            case 'DELETE': return '#f44336';
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                    <InputLabel>Method</InputLabel>
                    <Select
                        value={method}
                        label="Method"
                        onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
                        sx={{ fontWeight: 'bold', color: getMethodColor(method) }}
                    >
                        {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                            <MenuItem key={m} value={m} sx={{ fontWeight: 'bold', color: getMethodColor(m) }}>
                                {m}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    label="Request Path"
                    placeholder={requestPathPlaceholder}
                    value={urlSuffix}
                    onChange={(e) => onUrlSuffixChange(e.target.value)}
                    sx={{ flex: 1, minWidth: 250 }}
                />

                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={loading || loadingRequestBody || sendDisabled || !requestUrl}
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                >
                    {loading ? 'Sending...' : 'Send'}
                </Button>
            </Box>

            {requestUrl && (
                <Typography
                    variant="body2"
                    sx={{
                        fontFamily: 'monospace',
                        mb: 1,
                        px: 1,
                        py: 0.5,
                        backgroundColor: 'action.hover',
                        borderRadius: 1,
                        wordBreak: 'break-all',
                    }}
                >
                    <strong>{method}</strong> {baseUrlForDisplay}
                    {requestUrl}
                </Typography>
            )}

            <Box ref={containerRef} sx={{ display: 'flex', height: splitPaneHeight }}>
                <Paper
                    elevation={2}
                    sx={{ width: `${leftWidthPercent}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
                    <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle2">Request</Typography>
                        <Tabs
                            value={activeRequestTab}
                            onChange={(_, val) => setActiveRequestTab(val)}
                            sx={{ minHeight: 0, ml: 'auto' }}
                        >
                            <Tab label="Body" value="body" sx={{ minHeight: 0, py: 0.5 }} />
                            <Tab label="Headers" value="headers" sx={{ minHeight: 0, py: 0.5 }} />
                        </Tabs>
                    </Box>
                    {loadingRequestBody ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                            <CircularProgress />
                        </Box>
                    ) : activeRequestTab === 'headers' ? (
                        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                            {readOnlyHeaderRows && readOnlyHeaderRows.length > 0 && (
                                <>
                                    <Typography variant="caption" color="text.secondary">
                                        {readOnlyHeaderRowsLabel}
                                    </Typography>
                                    <KeyValueRows rows={readOnlyHeaderRows} readOnly />
                                </>
                            )}
                            {readOnlyHeaderRows !== undefined && (
                                <Typography variant="caption" color="text.secondary">
                                    Additional headers
                                </Typography>
                            )}
                            <KeyValueRows
                                rows={customHeaders}
                                onChange={setCustomHeaders}
                                keyLabel="Header name"
                                valueLabel="Value"
                            />
                        </Box>
                    ) : (
                        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                            <TextField
                                multiline
                                fullWidth
                                value={resourceJson}
                                onChange={(e) => onResourceJsonChange(e.target.value)}
                                slotProps={{
                                    input: {
                                        sx: {
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                            alignItems: 'flex-start',
                                            backgroundColor: 'transparent',
                                        },
                                    },
                                }}
                                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                            />
                        </Box>
                    )}
                </Paper>

                <Box
                    onMouseDown={handleDragStart}
                    sx={{
                        width: '6px',
                        cursor: 'col-resize',
                        backgroundColor: 'divider',
                        '&:hover': { backgroundColor: 'primary.main' },
                        flexShrink: 0,
                    }}
                />

                <Paper elevation={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">Response</Typography>
                        {responseStatus !== null && (
                            <Chip label={responseStatus} size="small" color={getStatusColor(responseStatus)} variant="outlined" />
                        )}
                        {responseIncomplete && (
                            <Chip label="Connection dropped — response incomplete" size="small" color="warning" variant="outlined" />
                        )}
                        <Tabs
                            value={activeResponseTab}
                            onChange={(_, val) => setActiveResponseTab(val)}
                            sx={{ minHeight: 0, ml: 'auto' }}
                        >
                            <Tab label={isStreaming ? 'Body (Receiving…)' : 'Body'} value="body" sx={{ minHeight: 0, py: 0.5 }} />
                            <Tab label="Headers" value="headers" sx={{ minHeight: 0, py: 0.5 }} />
                        </Tabs>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                        {activeResponseTab === 'headers' ? (
                            Object.keys(responseHeaders).length > 0 ? (
                                <KeyValueRows
                                    rows={Object.entries(responseHeaders).map(([key, value]) => ({ key, value }))}
                                    readOnly
                                />
                            ) : (
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                    No response headers yet.
                                </Typography>
                            )
                        ) : isStreaming ? (
                            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', m: 0 }}>
                                {streamedText}
                            </Typography>
                        ) : responseJson ? (
                            <PreJson data={responseJson} collapsed={2} />
                        ) : streamedText ? (
                            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', m: 0 }}>
                                {streamedText}
                            </Typography>
                        ) : (
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                Response will appear here after sending...
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Box>
        </>
    );
};

export default FhirRequestConsole;
