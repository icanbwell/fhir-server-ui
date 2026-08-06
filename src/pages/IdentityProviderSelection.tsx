import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Button, Box } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EnvContext from '../context/EnvironmentContext';
import { setLocalData } from '../utils/localData.utils';

const PROVIDER_LABELS: Record<string, string> = {
    bwellapp: 'b.well App',
};

const IdentityProviderSelection = () => {
    const env = useContext(EnvContext);
    const navigate = useNavigate();
    const location = useLocation();
    const referringUrl = location.state?.resourceUrl || '/'; // Default to '/' if no referring URL is provided

    console.log('Referring URL:', referringUrl);

    const handleProviderSelection = (provider: string) => {
        if (provider.toLowerCase() === 'bwellapp') {
            navigate('/bwell-login', { state: { resourceUrl: referringUrl } });
            return;
        }
        setLocalData('identityProvider', provider);
        navigate('/authcallback', { state: { resourceUrl: referringUrl } });
    };

    const providers: string[] = env.AUTH_PROVIDERS.split(',').map((s) => s.trim());

    const getProviderLabel = (provider: string): string =>
        PROVIDER_LABELS[provider.toLowerCase()] ??
        provider.charAt(0).toUpperCase() + provider.slice(1);

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <Header />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '60vh',
                    textAlign: 'center',
                    minHeight: '85vh',
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '0 10px',
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Select Identity Provider
                </Typography>
                <Box sx={{ mt: 4 }}>
                    {providers.map((provider) => (
                        <Button
                            key={provider}
                            variant="contained"
                            color="primary"
                            sx={{ mb: 2, width: '100%' }}
                            onClick={() => handleProviderSelection(provider)}
                        >
                            Login with {getProviderLabel(provider)}
                        </Button>
                    ))}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default IdentityProviderSelection;
