import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Paper,
    Tooltip,
    Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FhirRequestConsole, { SendRequestParams } from './FhirRequestConsole';
import { KeyValueRow } from './KeyValueRows';
import TokenServiceApi from '../api/tokenServiceApi';
import ConnectionFhirApi from '../api/connectionFhirApi';
import UserContext from '../context/UserContext';
import { HttpMethod } from '../context/LastRequestContext';
import { StreamingFetchResult } from '../utils/streamingFetch';
import { ConnectionEntry, ConnectionToken } from '../types/connectionEntry';
import { CONNECTIONS_FORBIDDEN_MESSAGE } from '../constants/connectionsConstants';

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

interface ConnectionRequestConsoleProps {
    connection: ConnectionEntry;
}

const ConnectionRequestConsole = ({ connection }: ConnectionRequestConsoleProps) => {
    const { setUserDetails } = useContext(UserContext);
    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;

    const [connectionToken, setConnectionToken] = useState<ConnectionToken | null>(null);
    const [loadingToken, setLoadingToken] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);

    const [method, setMethod] = useState<HttpMethod>('GET');
    const [urlSuffix, setUrlSuffix] = useState<string>('');
    const [resourceJson, setResourceJson] = useState<string>('');

    const connectionMandatedHeaders = useMemo(
        () => parseCustomHeaders(connectionToken?.custom_fhir_api_headers),
        [connectionToken]
    );

    const fetchToken = useCallback(async () => {
        if (!tokenServiceUrl) {
            return;
        }
        setLoadingToken(true);
        setError(null);
        setForbidden(false);
        try {
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const { status, connectionToken: token } = await api.getConnectionToken({
                serviceSlug: connection.service_slug,
            });
            if (status === 403) {
                setForbidden(true);
            } else if (status === 200 && token) {
                setConnectionToken(token);
            } else if (status === 404) {
                setError('No usable token for this connection — it may need to be reconnected.');
            } else {
                setError('Failed to fetch a token for this connection.');
            }
        } catch {
            setError('Failed to fetch a token for this connection.');
        } finally {
            setLoadingToken(false);
        }
    }, [tokenServiceUrl, connection.service_slug, setUserDetails]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    const sendRequest = useCallback(
        (params: SendRequestParams): Promise<StreamingFetchResult> => {
            if (!connectionToken) {
                return Promise.resolve({
                    status: undefined,
                    json: { error: 'No token available' },
                    headers: {},
                    rawText: '',
                });
            }
            return new ConnectionFhirApi({
                baseUrl: connectionToken.url,
                token: connectionToken.token,
                customHeaders: connectionMandatedHeaders,
            }).sendRequest(params);
        },
        [connectionToken, connectionMandatedHeaders]
    );

    const connectionHeaderRows: KeyValueRow[] = Object.entries(connectionMandatedHeaders).map(
        ([key, value]) => ({ key, value })
    );

    if (!tokenServiceUrl) {
        return (
            <Typography color="error">
                Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
            </Typography>
        );
    }

    if (forbidden) {
        return <Alert severity="warning">{CONNECTIONS_FORBIDDEN_MESSAGE}</Alert>;
    }

    return (
        <>
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
                                onClick={() => navigator.clipboard.writeText(connectionToken.patient_id)}
                            >
                                <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                            token expires {new Date(connectionToken.expiry).toLocaleString()}
                        </Typography>
                    </Box>
                )}
                {error && (
                    <Typography color="error" sx={{ mt: 1 }}>
                        {error}
                    </Typography>
                )}
            </Paper>

            <FhirRequestConsole
                method={method}
                onMethodChange={setMethod}
                urlSuffix={urlSuffix}
                onUrlSuffixChange={setUrlSuffix}
                resourceJson={resourceJson}
                onResourceJsonChange={setResourceJson}
                requestPathPlaceholder={
                    connectionToken ? `e.g. /Patient/${connectionToken.patient_id}` : 'e.g. /Patient/123'
                }
                baseUrlForDisplay={connectionToken?.url}
                sendRequest={sendRequest}
                sendDisabled={!connectionToken}
                splitPaneHeight="calc(100vh - 320px)"
                readOnlyHeaderRows={connectionHeaderRows}
                readOnlyHeaderRowsLabel="From this connection (always sent)"
            />
        </>
    );
};

export default ConnectionRequestConsole;
