import { useMemo } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import ConnectionPicker from './ConnectionPicker';
import ConnectionRequestConsole from './ConnectionRequestConsole';
import useConnections from '../hooks/useConnections';

interface ConnectionConsoleContentProps {
    serviceSlug: string | undefined;
    personId?: string;
    onSelect: (slug: string | null) => void;
}

const ConnectionConsoleContent = ({
    serviceSlug,
    personId,
    onSelect,
}: ConnectionConsoleContentProps) => {
    const { connections, loading, error, forbidden, hasLoaded, reload } = useConnections(personId);

    const connection = useMemo(
        () => connections.find((c) => c.service_slug === serviceSlug) ?? null,
        [connections, serviceSlug]
    );
    const notFound = hasLoaded && !error && !forbidden && !!serviceSlug && !connection;

    return (
        <>
            {personId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Testing connections for Person {personId} (service session)
                </Alert>
            )}

            <ConnectionPicker
                connections={connections}
                loading={loading}
                forbidden={forbidden}
                selectedSlug={serviceSlug}
                onSelect={onSelect}
                hideLoginBanner={!!personId}
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
                <ConnectionRequestConsole
                    connection={connection}
                    personId={personId}
                    key={connection.service_slug}
                />
            )}
        </>
    );
};

export default ConnectionConsoleContent;
