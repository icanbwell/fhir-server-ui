import { useContext, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectionRequestConsole from '../components/ConnectionRequestConsole';
import TokenServiceApi from '../api/tokenServiceApi';
import UserContext from '../context/UserContext';
import { ConnectionEntry } from '../types/connectionEntry';
import { CONNECTIONS_FORBIDDEN_MESSAGE } from '../constants/connectionsConstants';

const ConnectionConsolePage = () => {
    const { setUserDetails } = useContext(UserContext);
    const { serviceSlug } = useParams();
    const location = useLocation();

    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;

    const [connection, setConnection] = useState<ConnectionEntry | null>(
        (location.state as { connection?: ConnectionEntry } | null)?.connection || null
    );
    const [loadingConnection, setLoadingConnection] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);

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
                        <Alert severity="warning">{CONNECTIONS_FORBIDDEN_MESSAGE}</Alert>
                    ) : loadingConnection ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error && !connection ? (
                        <Typography color="error">{error}</Typography>
                    ) : connection ? (
                        <ConnectionRequestConsole connection={connection} />
                    ) : null}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionConsolePage;
