import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Box, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectionConsoleContent from '../components/ConnectionConsoleContent';
import { canUseServiceAuth } from '../utils/serviceAuth';

const ConnectionConsolePage = () => {
    const { serviceSlug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const personId = searchParams.get('personId') || undefined;
    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;
    // See src/utils/serviceAuth.ts for which identityProvider values qualify.
    const canUseOnBehalfOf = canUseServiceAuth();

    const handleSelect = (slug: string | null) => {
        const suffix = personId ? `?personId=${encodeURIComponent(personId)}` : '';
        navigate(
            slug ? `/connections/${encodeURIComponent(slug)}${suffix}` : `/connections${suffix}`
        );
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {!tokenServiceUrl ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : personId && !canUseOnBehalfOf ? (
                        <Typography color="error">
                            This view requires a service-authenticated login.
                        </Typography>
                    ) : !personId && canUseOnBehalfOf ? (
                        // cognitocc/descopecc sessions can never pass ATS's
                        // get_current_user guard used by the self-mode ("my own connections")
                        // endpoints — attempting it would 401 and trigger a full app logout via
                        // handleUnauthorized. These sessions are only meant to use the
                        // on-behalf-of (personId-present) flow, reached via the "Test
                        // Connections" link on a Patient/Person card.
                        <Typography color="error">
                            This login can&apos;t browse your own connections here — use the Test
                            Connections link on a specific Patient/Person page instead.
                        </Typography>
                    ) : (
                        <ConnectionConsoleContent
                            key={personId ?? 'self'}
                            serviceSlug={serviceSlug}
                            personId={personId}
                            onSelect={handleSelect}
                        />
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionConsolePage;
