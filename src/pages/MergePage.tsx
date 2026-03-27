import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    FormControlLabel,
    Paper,
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

const MIN_PANEL_WIDTH = 200;

const MergePage = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const { id, resourceType = '' } = useParams();

    const [resourceJson, setResourceJson] = useState<string>('');
    const [responseJson, setResponseJson] = useState<string>('');
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [smartMerge, setSmartMerge] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [fetching, setFetching] = useState<boolean>(true);
    const [leftWidthPercent, setLeftWidthPercent] = useState<number>(50);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) {
            return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const containerWidth = rect.width;
        const offsetX = e.clientX - rect.left;
        const percent = (offsetX / containerWidth) * 100;
        const minPercent = (MIN_PANEL_WIDTH / containerWidth) * 100;
        const maxPercent = 100 - minPercent;
        setLeftWidthPercent(Math.min(maxPercent, Math.max(minPercent, percent)));
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
        const fetchResource = async () => {
            if (!fhirUrl || !id || !resourceType) {
                return;
            }
            try {
                setFetching(true);
                const identityProvider = getLocalData('identityProvider');
                if (!identityProvider) {
                    return;
                }
                const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
                const { json } = await fhirApi.getResource({ id, resourceType });
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
    }, [fhirUrl, id, resourceType, setUserDetails]);

    const handleSend = async () => {
        if (!fhirUrl || !id || !resourceType) {
            return;
        }
        try {
            setLoading(true);
            setResponseJson('');
            setResponseStatus(null);
            const parsedResource = JSON.parse(resourceJson);
            const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
            const { json, status } = await fhirApi.mergeResource({
                resourceType,
                id,
                resource: parsedResource,
                smartMerge,
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

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {/* Top bar */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mb: 2,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                            {resourceType}/{id}/$merge
                        </Typography>
                        <Tooltip
                            title="smartMerge true will merge the resource with existing data. false will replace the whole existing resource."
                            arrow
                        >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={smartMerge}
                                        onChange={(e) => setSmartMerge(e.target.checked)}
                                    />
                                }
                                label="smartMerge"
                            />
                        </Tooltip>
                        <Box sx={{ flex: 1 }} />
                        <Button
                            variant="contained"
                            onClick={handleSend}
                            disabled={loading || fetching}
                            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </Button>
                    </Box>

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

export default MergePage;
