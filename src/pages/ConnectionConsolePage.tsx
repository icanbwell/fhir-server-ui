import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PreJson from '../components/PreJson';
import KeyValueRows, { KeyValueRow } from '../components/KeyValueRows';
import TokenServiceApi from '../api/tokenServiceApi';
import ConnectionFhirApi from '../api/connectionFhirApi';
import UserContext from '../context/UserContext';
import { HttpMethod } from '../context/LastRequestContext';
import { ConnectionEntry, ConnectionToken } from '../types/connectionEntry';

const FORBIDDEN_MESSAGE =
    "Connections aren't available for delegated/authorized-representative accounts.";

const parseCustomHeaders = (raw?: string): Record<string, string> => {
    if (!raw) {
        return {};
    }
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

const ConnectionConsolePage = () => {
    const { setUserDetails } = useContext(UserContext);
    const { serviceSlug } = useParams();
    const location = useLocation();

    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;

    const [connection, setConnection] = useState<ConnectionEntry | null>(
        (location.state as { connection?: ConnectionEntry } | null)?.connection || null
    );
    const [connectionToken, setConnectionToken] = useState<ConnectionToken | null>(null);
    const [loadingConnection, setLoadingConnection] = useState<boolean>(false);
    const [loadingToken, setLoadingToken] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);

    const [method, setMethod] = useState<HttpMethod>('GET');
    const [urlSuffix, setUrlSuffix] = useState<string>('');
    const [resourceJson, setResourceJson] = useState<string>('');
    const [customHeaders, setCustomHeaders] = useState<KeyValueRow[]>([{ key: '', value: '' }]);
    const [activeRequestTab, setActiveRequestTab] = useState<'body' | 'headers'>('body');
    const [responseJson, setResponseJson] = useState<object | null>(null);
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
    const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
    const [loading, setLoading] = useState<boolean>(false);
    const [streamedText, setStreamedText] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [responseIncomplete, setResponseIncomplete] = useState<boolean>(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    const connectionMandatedHeaders = useMemo(
        () => parseCustomHeaders(connectionToken?.custom_fhir_api_headers),
        [connectionToken]
    );

    // Resolve connection metadata: prefer the fast path from a ConnectionsListPage click
    // (already in router state), fall back to re-fetching the full list for a bookmarked/
    // refreshed URL that never went through the list page. /get-member-connections has no
    // per-slug filter, so this fetches everything and finds the match client-side.
    useEffect(() => {
        if (connection || !tokenServiceUrl || !serviceSlug) {
            return;
        }
        const resolveConnection = async () => {
            setLoadingConnection(true);
            setError(null);
            try {
                const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
                const { status, connections } = await api.listConnections();
                if (status === 403) {
                    setForbidden(true);
                    return;
                }
                const match = connections.find((c) => c.service_slug === serviceSlug);
                if (match) {
                    setConnection(match);
                } else {
                    setError(`No connection found for service slug "${serviceSlug}".`);
                }
            } catch {
                setError('Failed to load connection details.');
            } finally {
                setLoadingConnection(false);
            }
        };
        resolveConnection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connection, tokenServiceUrl, serviceSlug]);

    const fetchToken = useCallback(async () => {
        if (!tokenServiceUrl || !serviceSlug) {
            return;
        }
        setLoadingToken(true);
        setError(null);
        setForbidden(false);
        try {
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const { status, connectionToken: token } = await api.getConnectionToken({ serviceSlug });
            if (status === 403) {
                setForbidden(true);
            } else if (status === 200 && token) {
                setConnectionToken(token);
            } else {
                setError('Failed to fetch a token for this connection.');
            }
        } catch {
            setError('Failed to fetch a token for this connection.');
        } finally {
            setLoadingToken(false);
        }
    }, [tokenServiceUrl, serviceSlug, setUserDetails]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    const requestUrl = useMemo(() => {
        if (!urlSuffix) {
            return '';
        }
        return urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`;
    }, [urlSuffix]);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handleSend = async () => {
        if (!connectionToken || !requestUrl) {
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

            const connectionApi = new ConnectionFhirApi({
                baseUrl: connectionToken.url,
                token: connectionToken.token,
                customHeaders: connectionMandatedHeaders,
            });

            let data: object | undefined;
            if (resourceJson.trim() && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                data = JSON.parse(resourceJson);
            }
            // Built via Object.fromEntries (rather than a reduce with bracket assignment) so
            // this doesn't trip eslint-plugin-security's detect-object-injection rule, which
            // flags dynamic-key bracket writes as a potential prototype-pollution sink.
            const headersToSend = Object.fromEntries(
                customHeaders
                    .map((row) => ({ key: row.key.trim(), value: row.value }))
                    .filter((row) => row.key && row.key.toLowerCase() !== 'authorization')
                    .map((row): [string, string] => [row.key, row.value])
            );

            const { json, status, headers, incomplete } = await connectionApi.sendRequest({
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
                setResponseJson({
                    error:
                        (error.message || 'Request failed') +
                        ' — this may be a CORS restriction from the source FHIR server.',
                });
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

    const connectionHeaderRows: KeyValueRow[] = Object.entries(connectionMandatedHeaders).map(
        ([key, value]) => ({ key, value })
    );

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {!tokenServiceUrl ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : forbidden ? (
                        <Alert severity="warning">{FORBIDDEN_MESSAGE}</Alert>
                    ) : loadingConnection ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error && !connection ? (
                        <Typography color="error">{error}</Typography>
                    ) : connection ? (
                        <>
                            {/* Connection info bar */}
                            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="h6">{connection.display_name}</Typography>
                                    <Chip label={connection.category} size="small" />
                                    <Chip label={connection.status} size="small" variant="outlined" />
                                    {connection.expired && <Chip label="Expired" size="small" color="warning" />}
                                    {connectionToken && (
                                        <Chip label={connectionToken.fhir_version} size="small" variant="outlined" />
                                    )}
                                    <Box sx={{ flexGrow: 1 }} />
                                    <Button
                                        size="small"
                                        startIcon={loadingToken ? <CircularProgress size={16} /> : <RefreshIcon />}
                                        onClick={fetchToken}
                                        disabled={loadingToken}
                                    >
                                        Refresh Token
                                    </Button>
                                </Box>
                                {connectionToken && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            patient_id: {connectionToken.patient_id}
                                        </Typography>
                                        <Tooltip title="Copy patient_id">
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    navigator.clipboard.writeText(connectionToken.patient_id)
                                                }
                                            >
                                                <ContentCopyIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Typography variant="body2" color="text.secondary">
                                            token expires {connectionToken.expiry}
                                        </Typography>
                                    </Box>
                                )}
                                {error && (
                                    <Typography color="error" sx={{ mt: 1 }}>
                                        {error}
                                    </Typography>
                                )}
                            </Paper>

                            {/* Controls bar */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <FormControl size="small" sx={{ minWidth: 110 }}>
                                    <InputLabel>Method</InputLabel>
                                    <Select
                                        value={method}
                                        label="Method"
                                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
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
                                    placeholder={
                                        connectionToken
                                            ? `e.g. /Patient/${connectionToken.patient_id}`
                                            : 'e.g. /Patient/123'
                                    }
                                    value={urlSuffix}
                                    onChange={(e) => setUrlSuffix(e.target.value)}
                                    sx={{ flex: 1, minWidth: 250 }}
                                />

                                <Button
                                    variant="contained"
                                    onClick={handleSend}
                                    disabled={loading || !connectionToken || !requestUrl}
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
                                    <strong>{method}</strong> {connectionToken?.url}
                                    {requestUrl}
                                </Typography>
                            )}

                            {/* Split pane */}
                            <Box sx={{ display: 'flex', height: 'calc(100vh - 320px)' }}>
                                <Paper elevation={2} sx={{ width: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                                    {activeRequestTab === 'headers' ? (
                                        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                                            {connectionHeaderRows.length > 0 && (
                                                <>
                                                    <Typography variant="caption" color="text.secondary">
                                                        From this connection (always sent)
                                                    </Typography>
                                                    <KeyValueRows rows={connectionHeaderRows} readOnly />
                                                </>
                                            )}
                                            <Typography variant="caption" color="text.secondary">
                                                Additional headers
                                            </Typography>
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
                                                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                                            />
                                        </Box>
                                    )}
                                </Paper>

                                <Box sx={{ width: '6px', backgroundColor: 'divider', flexShrink: 0 }} />

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
                    ) : null}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionConsolePage;
