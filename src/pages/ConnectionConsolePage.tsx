import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Button, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectionPicker from '../components/ConnectionPicker';
import ConnectionRequestConsole from '../components/ConnectionRequestConsole';
import useConnections from '../hooks/useConnections';

const ConnectionConsolePage = () => {
    const { serviceSlug } = useParams();
    const navigate = useNavigate();
    const { connections, loading, error, forbidden, configMissing, hasLoaded, reload } = useConnections();

    const connection = useMemo(
        () => connections.find((c) => c.service_slug === serviceSlug) ?? null,
        [connections, serviceSlug]
    );
    const notFound = hasLoaded && !error && !forbidden && !!serviceSlug && !connection;

    const handleSelect = (slug: string | null) => {
        navigate(slug ? `/connections/${encodeURIComponent(slug)}` : '/connections');
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {configMissing ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : (
                        <>
                            <ConnectionPicker
                                connections={connections}
                                loading={loading}
                                forbidden={forbidden}
                                selectedSlug={serviceSlug}
                                onSelect={handleSelect}
                            />

                            {error && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography color="error">{error}</Typography>
                                    <Button onClick={() => reload()}>Retry</Button>
                                </Box>
                            )}

                            {notFound && (
                                <Typography color="error">
                                    No connection found for service slug &quot;{serviceSlug}&quot;.
                                </Typography>
                            )}

                            {connection && (
                                <ConnectionRequestConsole connection={connection} key={connection.service_slug} />
                            )}
                        </>
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionConsolePage;
