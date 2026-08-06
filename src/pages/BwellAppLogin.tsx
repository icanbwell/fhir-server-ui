import { useContext, useEffect, useMemo, useState, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Typography,
    Button,
    Box,
    TextField,
    Select,
    MenuItem,
    Link,
    SelectChangeEvent,
    FormControl,
    InputLabel,
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';
import { getLocalData, setLocalData } from '../utils/localData.utils';
import { jwtParser } from '../utils/jwtParser';
import { removeAuthData } from '../utils/auth.utils';
import { login, parseClientKeys } from '../services/BwellAppAuthService';
import { exchangeToken } from '../services/TokenExchangeService';

const CLIENT_KEYS_MISSING_MESSAGE =
    'No b.well App client keys are configured (REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS).';

const BwellAppLogin = () => {
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const resourceUrl = location.state?.resourceUrl || '/';

    const clientKeys = useMemo(
        () => parseClientKeys(import.meta.env.REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS),
        []
    );

    const configError = useMemo(() => {
        if (!import.meta.env.REACT_APP_AUTH_BWELLAPP_BASE_URL) {
            return 'b.well App sign-in is not configured (missing base URL).';
        }
        if (clientKeys.length === 0) {
            return CLIENT_KEYS_MISSING_MESSAGE;
        }
        return null;
    }, [clientKeys]);

    const [selectedClientName, setSelectedClientName] = useState<string>(
        clientKeys[0]?.name || ''
    );
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (getLocalData('jwt')) {
            navigate(resourceUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClientChange = (event: SelectChangeEvent) => {
        setSelectedClientName(event.target.value);
    };

    const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
        formEvent.preventDefault();
        if (isProcessing) {
            return;
        }

        if (clientKeys.length === 0) {
            setError(CLIENT_KEYS_MISSING_MESSAGE);
            return;
        }

        const selectedClient =
            clientKeys.find((c) => c.name === selectedClientName) ?? clientKeys[0];

        setIsProcessing(true);
        setError(null);

        try {
            const { accessToken, refreshToken } = await login(email, password, selectedClient.key);

            // The b.well identity gateway's login access token is an intermediate credential,
            // not one the FHIR server accepts directly - it must be exchanged (using the same
            // client key, plus the login refresh token) for the access token the FHIR server
            // actually trusts. See TokenExchangeService for why both the access and refresh
            // tokens are required together for this exchange to succeed.
            let jwtToken: string;
            try {
                jwtToken = await exchangeToken(accessToken, refreshToken, selectedClient.key);
            } catch (exchangeError: any) {
                console.error('b.well App token exchange failed', exchangeError);
                const reason = exchangeError?.message;
                setError(
                    reason
                        ? `Signed in, but could not obtain a FHIR server access token: ${reason}`
                        : 'Signed in, but could not obtain a FHIR server access token. Please contact support.'
                );
                return;
            }

            removeAuthData();
            setLocalData('jwt', jwtToken);
            setLocalData('identityProvider', 'bwellapp');
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
                setError(loginError?.response?.data?.message || 'Invalid email or password.');
            } else {
                setError('Unable to sign in right now. Please try again.');
            }
            console.error('b.well App login failed', {
                message: loginError?.message,
                status: loginError?.response?.status,
            });
            setPassword('');
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
                    Sign In With b.well App
                </Typography>
                {configError ? (
                    <Typography color="error" sx={{ mt: 4 }}>
                        {configError}
                    </Typography>
                ) : (
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, width: '100%' }}>
                        {clientKeys.length > 0 && (
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel id="bwell-tenant-label">Tenant</InputLabel>
                                <Select
                                    labelId="bwell-tenant-label"
                                    label="Tenant"
                                    value={selectedClientName}
                                    onChange={handleClientChange}
                                >
                                    {clientKeys.map((client) => (
                                        <MenuItem key={client.name} value={client.name}>
                                            {client.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mb: 2 }}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 2 }}
                            required
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
                        <Link
                            component="button"
                            type="button"
                            onClick={() => navigate('/select-idp', { state: { resourceUrl } })}
                        >
                            Back
                        </Link>
                    </Box>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default BwellAppLogin;
