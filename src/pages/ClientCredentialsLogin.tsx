import { useContext, useState, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
    Typography,
    Button,
    Box,
    TextField,
    Select,
    MenuItem,
    Link,
    SelectChangeEvent,
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';
import { setLocalData } from '../utils/localData.utils';
import { jwtParser } from '../utils/jwtParser';
import { removeAuthData } from '../utils/auth.utils';
import { getClientCredentialsToken } from '../services/ClientCredentialsAuthService';
import AuthUrlProvider from '../utils/authUrlProvider';
import { APP_ENV } from '../runtimeEnv';

type ProviderOption = {
    label: string;
    identityProvider: string;
    tokenUrl: string | undefined;
};

const PROVIDERS: ProviderOption[] = [
    {
        label: 'Cognito',
        identityProvider: 'cognitocc',
        tokenUrl: APP_ENV.REACT_APP_AUTH_COGNITOCC_TOKEN_URL,
    },
    {
        label: 'Descope',
        identityProvider: 'descopecc',
        tokenUrl: APP_ENV.REACT_APP_AUTH_DESCOPECC_TOKEN_URL,
    },
];

const ClientCredentialsLogin = () => {
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const resourceUrl = location.state?.resourceUrl || '/';

    const [selectedProviderKey, setSelectedProviderKey] = useState<string>(
        PROVIDERS[0].identityProvider
    );
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [scope, setScope] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedProvider =
        PROVIDERS.find((p) => p.identityProvider === selectedProviderKey) ?? PROVIDERS[0];

    const configError = (() => {
        if (!selectedProvider.tokenUrl) {
            return `${selectedProvider.label} client credentials sign-in is not configured (missing token URL).`;
        }
        try {
            new AuthUrlProvider().getAuthInfo(selectedProvider.identityProvider);
        } catch {
            return `${selectedProvider.label} client credentials sign-in is not configured (missing required auth config).`;
        }
        return null;
    })();

    const handleProviderChange = (event: SelectChangeEvent) => {
        setSelectedProviderKey(event.target.value);
        setClientId('');
        setClientSecret('');
        setError(null);
    };

    const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
        formEvent.preventDefault();
        if (isProcessing || !selectedProvider.tokenUrl) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const accessToken = await getClientCredentialsToken(
                selectedProvider.tokenUrl,
                clientId,
                clientSecret,
                scope || undefined
            );
            removeAuthData();
            setLocalData('jwt', accessToken);
            setLocalData('identityProvider', selectedProvider.identityProvider);
            const userDetails = jwtParser();
            if (!userDetails) {
                removeAuthData();
                setError(
                    'Signed in, but the session could not be established. Please contact support.'
                );
                return;
            }
            if (setUserDetails) {
                setUserDetails(userDetails);
            }
            navigate(resourceUrl);
        } catch (loginError: any) {
            const status = loginError?.response?.status;
            if (status === 400 || status === 401 || status === 403) {
                setError(
                    loginError?.response?.data?.error_description ||
                        loginError?.response?.data?.error ||
                        'Invalid client ID or client secret.'
                );
            } else {
                setError('Unable to sign in right now. Please try again.');
            }
            console.error('Client credentials login failed', {
                message: loginError?.message,
                status: loginError?.response?.status,
            });
            setClientSecret('');
        } finally {
            setIsProcessing(false);
        }
    };

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
                    maxWidth: '400px',
                    margin: '0 auto',
                    padding: '0 10px',
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Login With Client Credentials
                </Typography>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    autoComplete="off"
                    sx={{ mt: 4, width: '100%' }}
                >
                    <Select
                        fullWidth
                        value={selectedProviderKey}
                        onChange={handleProviderChange}
                        sx={{ mb: 2 }}
                    >
                        {PROVIDERS.map((provider) => (
                            <MenuItem key={provider.identityProvider} value={provider.identityProvider}>
                                {provider.label}
                            </MenuItem>
                        ))}
                    </Select>
                    {configError ? (
                        <Typography color="error" sx={{ mb: 2 }}>
                            {configError}
                        </Typography>
                    ) : (
                        <>
                            <TextField
                                fullWidth
                                label="Client ID"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                sx={{ mb: 2 }}
                                autoComplete="off"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Client Secret"
                                type="password"
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                sx={{ mb: 2 }}
                                autoComplete="new-password"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Scope (optional)"
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            {error && (
                                <Typography color="error" sx={{ mb: 2 }}>
                                    {error}
                                </Typography>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                sx={{ width: '100%', mb: 2 }}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </>
                    )}
                    <Link component="button" type="button" onClick={() => navigate('/select-idp')}>
                        Back
                    </Link>
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ClientCredentialsLogin;
