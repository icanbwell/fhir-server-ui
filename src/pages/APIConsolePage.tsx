import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
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
import Header from '../components/Header';
import Footer from '../components/Footer';
import PreJson from '../components/PreJson';
import KeyValueRows, { KeyValueRow } from '../components/KeyValueRows';
import FhirApi from '../api/fhirApi';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { getLocalData } from '../utils/localData.utils';

const MIN_PANEL_WIDTH = 200;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const APIConsolePage = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const { id: routeId, resourceType: routeResourceType, operation: routeOperation } = useParams();

    const [searchParams, setSearchParams] = useSearchParams();

    // Determine if we arrived from a ResourceCard redirect (route params present)
    const isFromRedirect = Boolean(routeId && routeResourceType && routeOperation);

    // Initialize state from route params (redirect) or search params (standalone)
    const [method, setMethod] = useState<HttpMethod>(
        (searchParams.get('method') as HttpMethod) || (isFromRedirect ? 'POST' : 'GET')
    );
    // When arriving via a ResourceCard redirect, there's no separate resourceType/id/
    // operation state anymore — compose the one field's initial value directly from the
    // route params so it starts pre-filled correctly.
    const [urlSuffix, setUrlSuffix] = useState<string>(
        isFromRedirect && routeResourceType && routeId && routeOperation
            ? `/4_0_0/${routeResourceType}/${routeId}/${routeOperation}?smartMerge=true`
            : searchParams.get('urlSuffix') || ''
    );

    const [resourceJson, setResourceJson] = useState<string>('');
    const [customHeaders, setCustomHeaders] = useState<KeyValueRow[]>([{ key: '', value: '' }]);
    const [activeRequestTab, setActiveRequestTab] = useState<'body' | 'headers'>('body');
    const [responseJson, setResponseJson] = useState<object | null>(null);
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
    const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
    const [loading, setLoading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(false);
    const [leftWidthPercent, setLeftWidthPercent] = useState<number>(50);
    const [streamedText, setStreamedText] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [responseIncomplete, setResponseIncomplete] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Sync state to search params (only for standalone /api-console route)
    useEffect(() => {
        if (isFromRedirect) {
            return;
        }
        const newParams: Record<string, string> = {};
        if (method && method !== 'GET') {
            newParams.method = method;
        }
        if (urlSuffix) {
            newParams.urlSuffix = urlSuffix;
        }
        setSearchParams(newParams, { replace: true });
    }, [method, urlSuffix, isFromRedirect, setSearchParams]);

    // Build the request URL preview
    const requestUrl = useMemo(() => {
        if (!urlSuffix) {
            return '';
        }
        return urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`;
    }, [urlSuffix]);

    // Draggable divider logic
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

    // Auto-fetch resource when arriving from ResourceCard redirect
    useEffect(() => {
        if (!isFromRedirect || !fhirUrl || !routeId || !routeResourceType) {
            return;
        }
        const fetchResource = async () => {
            try {
                setFetching(true);
                const identityProvider = getLocalData('identityProvider');
                if (!identityProvider) {
                    return;
                }
                const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
                const { json } = await fhirApi.getResource({ id: routeId, resourceType: routeResourceType });
                if (json) {
                    setResourceJson(JSON.stringify(json, null, 2));
                }
            } catch (error) {
                console.error('Failed to fetch resource:', error);
            } finally {
                setFetching(false);
            }
        };
        fetchResource();
    }, [fhirUrl, routeId, routeResourceType, isFromRedirect, setUserDetails]);

    // Abort any in-flight request when navigating away or unmounting
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handleSend = async () => {
        if (!fhirUrl || !requestUrl) {
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
            const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
            let data: object | undefined;
            if (resourceJson.trim() && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                data = JSON.parse(resourceJson);
            }
            const headersToSend = customHeaders.reduce<Record<string, string>>((acc, row) => {
                const key = row.key.trim();
                if (key && key.toLowerCase() !== 'authorization') {
                    acc[key] = row.value;
                }
                return acc;
            }, {});
            const { json, status, headers, incomplete } = await fhirApi.sendRequest({
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
                // Populate status/headers as soon as the response headers arrive, before the
                // body finishes streaming.
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
            // Only the most recent request owns this UI state. A superseded request's finally
            // block still runs (a `return` inside try does not skip finally), and clearing these
            // flags would disable the streaming UI for the newer request that is still in flight.
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
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {/* Controls bar */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* HTTP Method */}
                        <FormControl size="small" sx={{ minWidth: 110 }}>
                            <InputLabel>Method</InputLabel>
                            <Select
                                value={method}
                                label="Method"
                                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                                sx={{
                                    fontWeight: 'bold',
                                    color: getMethodColor(method),
                                }}
                            >
                                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                                    <MenuItem key={m} value={m} sx={{ fontWeight: 'bold', color: getMethodColor(m) }}>
                                        {m}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Request path — the literal, complete path sent, unmodified */}
                        <TextField
                            size="small"
                            label="Request Path"
                            placeholder="Full path, e.g. /4_0_0/Patient/123 or /version"
                            value={urlSuffix}
                            onChange={(e) => setUrlSuffix(e.target.value)}
                            sx={{ flex: 1, minWidth: 250 }}
                        />

                        <Button
                            variant="contained"
                            onClick={handleSend}
                            disabled={loading || fetching || !requestUrl}
                            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </Button>
                    </Box>

                    {/* URL preview */}
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
                            <strong>{method}</strong> {requestUrl}
                        </Typography>
                    )}

                    {/* Split pane */}
                    <Box
                        ref={containerRef}
                        sx={{
                            display: 'flex',
                            height: 'calc(100vh - 220px)',
                        }}
                    >
                        {/* Left: Editable JSON */}
                        <Paper
                            elevation={2}
                            sx={{
                                width: `${leftWidthPercent}%`,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    p: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
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
                            {fetching ? (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        flex: 1,
                                    }}
                                >
                                    <CircularProgress />
                                </Box>
                            ) : activeRequestTab === 'headers' ? (
                                <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
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
                                        onChange={(e) => setResourceJson(e.target.value)}
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
                                        sx={{
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                border: 'none',
                                            },
                                        }}
                                    />
                                </Box>
                            )}
                        </Paper>

                        {/* Draggable divider */}
                        <Box
                            onMouseDown={handleDragStart}
                            sx={{
                                width: '6px',
                                cursor: 'col-resize',
                                backgroundColor: 'divider',
                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                },
                                flexShrink: 0,
                            }}
                        />

                        {/* Right: Response JSON */}
                        <Paper
                            elevation={2}
                            sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    p: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Typography variant="subtitle2">Response</Typography>
                                {responseStatus !== null && (
                                    <Chip
                                        label={responseStatus}
                                        size="small"
                                        color={getStatusColor(responseStatus)}
                                        variant="outlined"
                                    />
                                )}
                                {responseIncomplete && (
                                    <Chip
                                        label="Connection dropped — response incomplete"
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                    />
                                )}
                                <Tabs
                                    value={activeResponseTab}
                                    onChange={(_, val) => setActiveResponseTab(val)}
                                    sx={{ minHeight: 0, ml: 'auto' }}
                                >
                                    <Tab
                                        label={isStreaming ? 'Body (Receiving…)' : 'Body'}
                                        value="body"
                                        sx={{ minHeight: 0, py: 0.5 }}
                                    />
                                    <Tab label="Headers" value="headers" sx={{ minHeight: 0, py: 0.5 }} />
                                </Tabs>
                            </Box>
                            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                                {activeResponseTab === 'headers' ? (
                                    Object.keys(responseHeaders).length > 0 ? (
                                        <KeyValueRows
                                            rows={Object.entries(responseHeaders).map(([key, value]) => ({
                                                key,
                                                value,
                                            }))}
                                            readOnly
                                        />
                                    ) : (
                                        <Typography
                                            variant="body2"
                                            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                        >
                                            No response headers yet.
                                        </Typography>
                                    )
                                ) : isStreaming ? (
                                    <Typography
                                        component="pre"
                                        sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', m: 0 }}
                                    >
                                        {streamedText}
                                    </Typography>
                                ) : responseJson ? (
                                    <PreJson data={responseJson} collapsed={2} />
                                ) : streamedText ? (
                                    <Typography
                                        component="pre"
                                        sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', m: 0 }}
                                    >
                                        {streamedText}
                                    </Typography>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                    >
                                        Response will appear here after sending...
                                    </Typography>
                                )}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default APIConsolePage;
