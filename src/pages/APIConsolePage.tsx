import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FhirApi from '../api/fhirApi';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { getLocalData } from '../utils/localData.utils';
import { resourceDefinitions } from '../utils/resourceDefinitions';

const MIN_PANEL_WIDTH = 200;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Operation = '' | '$merge' | '$graph' | '$everything';

const RESOURCE_NAMES = resourceDefinitions.map((r) => r.name);
const OPERATIONS: { value: Operation; label: string }[] = [
    { value: '', label: 'None' },
    { value: '$merge', label: '$merge' },
    { value: '$graph', label: '$graph' },
    { value: '$everything', label: '$everything' },
];

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
    const [selectedResourceType, setSelectedResourceType] = useState<string>(
        routeResourceType || searchParams.get('resourceType') || ''
    );
    const [operation, setOperation] = useState<Operation>(
        (isFromRedirect ? routeOperation as Operation : searchParams.get('operation') as Operation) || ''
    );
    const [resourceId, setResourceId] = useState<string>(
        routeId || searchParams.get('id') || ''
    );
    const [params, setParams] = useState<string>(searchParams.get('params') || '');
    const [smartMerge, setSmartMerge] = useState<boolean>(
        searchParams.get('smartMerge') !== 'false'
    );
    const [urlSuffix, setUrlSuffix] = useState<string>(searchParams.get('urlSuffix') || '');

    const [resourceJson, setResourceJson] = useState<string>('');
    const [responseJson, setResponseJson] = useState<string>('');
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(false);
    const [leftWidthPercent, setLeftWidthPercent] = useState<number>(50);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    // Sync state to search params (only for standalone /api-console route)
    useEffect(() => {
        if (isFromRedirect) {
            return;
        }
        const newParams: Record<string, string> = {};
        if (method && method !== 'GET') {
            newParams.method = method;
        }
        if (selectedResourceType) {
            newParams.resourceType = selectedResourceType;
        }
        if (operation) {
            newParams.operation = operation;
        }
        if (resourceId) {
            newParams.id = resourceId;
        }
        if (params) {
            newParams.params = params;
        }
        if (operation === '$merge' && !smartMerge) {
            newParams.smartMerge = 'false';
        }
        if (!operation && urlSuffix) {
            newParams.urlSuffix = urlSuffix;
        }
        setSearchParams(newParams, { replace: true });
    }, [method, selectedResourceType, operation, resourceId, params, smartMerge, urlSuffix, isFromRedirect, setSearchParams]);

    // Build the request URL preview
    const requestUrl = useMemo(() => {
        if (!selectedResourceType) {
            return '';
        }
        let url = `/4_0_0/${selectedResourceType}`;
        if (operation) {
            if (resourceId) {
                url += `/${resourceId}`;
            }
            url += `/${operation}`;
            const queryParts: string[] = [];
            if (operation === '$merge') {
                queryParts.push(`smartMerge=${smartMerge}`);
            }
            if (params) {
                queryParts.push(params);
            }
            if (queryParts.length) {
                url += `?${queryParts.join('&')}`;
            }
        } else if (urlSuffix) {
            const separator = urlSuffix.startsWith('/') || urlSuffix.startsWith('?') ? '' : '/';
            url += `${separator}${urlSuffix}`;
        }
        return url;
    }, [selectedResourceType, operation, resourceId, params, smartMerge, urlSuffix]);

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

    const handleSend = async () => {
        if (!fhirUrl || !requestUrl) {
            return;
        }
        try {
            setLoading(true);
            setResponseJson('');
            setResponseStatus(null);
            const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
            let data: object | undefined;
            if (resourceJson.trim() && (method === 'POST' || method === 'PUT')) {
                data = JSON.parse(resourceJson);
            }
            const { json, status } = await fhirApi.sendRequest({
                method,
                urlPath: requestUrl,
                data,
            });
            setResponseStatus(status);
            setResponseJson(JSON.stringify(json, null, 2));
        } catch (error: any) {
            if (error instanceof SyntaxError) {
                setResponseStatus(null);
                setResponseJson(JSON.stringify({ error: 'Invalid JSON in editor' }, null, 2));
            } else {
                setResponseStatus(null);
                setResponseJson(
                    JSON.stringify({ error: error.message || 'Request failed' }, null, 2)
                );
            }
        } finally {
            setLoading(false);
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
                                disabled={isFromRedirect}
                                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                                sx={{
                                    fontWeight: 'bold',
                                    color: getMethodColor(method),
                                }}
                            >
                                {(['GET', 'POST', 'PUT', 'DELETE'] as HttpMethod[]).map((m) => (
                                    <MenuItem key={m} value={m} sx={{ fontWeight: 'bold', color: getMethodColor(m) }}>
                                        {m}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Resource Type */}
                        <Autocomplete
                            size="small"
                            sx={{ width: 220 }}
                            disabled={isFromRedirect}
                            options={RESOURCE_NAMES}
                            value={selectedResourceType || null}
                            onChange={(_, val) => setSelectedResourceType(val || '')}
                            renderInput={(inputProps) => (
                                <TextField {...inputProps} label="Resource Type" />
                            )}
                        />

                        <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>/</Typography>

                        {operation ? (
                            <>
                                {/* ID input */}
                                <TextField
                                    size="small"
                                    label="ID (optional)"
                                    disabled={isFromRedirect}
                                    value={resourceId}
                                    onChange={(e) => setResourceId(e.target.value)}
                                    sx={{ width: 160 }}
                                />

                                <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>/</Typography>

                                {/* Operation */}
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Operation</InputLabel>
                                    <Select
                                        value={operation}
                                        label="Operation"
                                        disabled={isFromRedirect}
                                        onChange={(e) => setOperation(e.target.value as Operation)}
                                    >
                                        {OPERATIONS.map((op) => (
                                            <MenuItem key={op.value} value={op.value}>
                                                {op.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>/</Typography>

                                {/* Params input */}
                                <TextField
                                    size="small"
                                    label="Query params (optional)"
                                    placeholder="key=value&key2=value2"
                                    value={params}
                                    onChange={(e) => setParams(e.target.value)}
                                    sx={{ minWidth: 200, flex: 1 }}
                                />

                                {/* smartMerge checkbox */}
                                {operation === '$merge' && (
                                    <Tooltip
                                        title="smartMerge true will merge the resource with existing data. false will replace the whole existing resource."
                                        arrow
                                    >
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={smartMerge}
                                                    onChange={(e) => setSmartMerge(e.target.checked)}
                                                    size="small"
                                                />
                                            }
                                            label="smartMerge"
                                        />
                                    </Tooltip>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Operation selector (shows None selected) */}
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Operation</InputLabel>
                                    <Select
                                        value={operation}
                                        label="Operation"
                                        disabled={isFromRedirect}
                                        onChange={(e) => setOperation(e.target.value as Operation)}
                                    >
                                        {OPERATIONS.map((op) => (
                                            <MenuItem key={op.value} value={op.value}>
                                                {op.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>/</Typography>

                                {/* Free-text URL suffix */}
                                <TextField
                                    size="small"
                                    label="URL path"
                                    placeholder="e.g. 123/$graph?contained=true or _search?name=John"
                                    value={urlSuffix}
                                    onChange={(e) => setUrlSuffix(e.target.value)}
                                    sx={{ flex: 1, minWidth: 250 }}
                                />
                            </>
                        )}

                        <Button
                            variant="contained"
                            onClick={handleSend}
                            disabled={loading || fetching || !selectedResourceType}
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
                            <Typography
                                variant="subtitle2"
                                sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                            >
                                Request Body
                            </Typography>
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
                            </Box>
                            <Box
                                sx={{
                                    flex: 1,
                                    overflow: 'auto',
                                    p: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {responseJson || 'Response will appear here after sending...'}
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
