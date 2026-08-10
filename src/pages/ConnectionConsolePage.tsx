import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Box, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectionConsoleContent from '../components/ConnectionConsoleContent';
import { getLocalData } from '../utils/localData.utils';

const ConnectionConsolePage = () => {
    const { serviceSlug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const personId = searchParams.get('personId') ?? undefined;
    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;
    const identityProvider = getLocalData('identityProvider');
    const canUseOnBehalfOf = identityProvider === 'clientcredentials' || identityProvider === 'okta';

    const handleSelect = (slug: string | null) => {
        const suffix = personId ? `?personId=${encodeURIComponent(personId)}` : '';
        navigate(slug ? `/connections/${encodeURIComponent(slug)}${suffix}` : `/connections${suffix}`);
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
