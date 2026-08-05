import { useContext, useMemo, useState, FormEvent } from 'react';
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
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';
import { setLocalData } from '../utils/localData.utils';
import { jwtParser } from '../utils/jwtParser';
import { login, parseClientKeys } from '../services/BwellAppAuthService';

const BwellAppLogin = () => {
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const resourceUrl = location.state?.resourceUrl || '/';

    const clientKeys = useMemo(
        () => parseClientKeys(import.meta.env.REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS),
        []
    );

    const [selectedClientName, setSelectedClientName] = useState<string>(
        clientKeys[0]?.name || ''
    );
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClientChange = (event: SelectChangeEvent) => {
        setSelectedClientName(event.target.value);
    };

    const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
        formEvent.preventDefault();
        if (isProcessing) {
            return;
        }

        if (clientKeys.length === 0) {
            setError(
                'No b.well App client keys are configured (REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS).'
            );
            return;
        }

        const selectedClient =
            clientKeys.find((c) => c.name === selectedClientName) ?? clientKeys[0];

        setIsProcessing(true);
        setError(null);

        try {
            const jwtToken = await login(email, password, selectedClient.key);
            setLocalData('jwt', jwtToken);
            setLocalData('identityProvider', 'bwellapp');
            if (setUserDetails) {
                setUserDetails(jwtParser());
            }
            navigate(resourceUrl);
        } catch (loginError: any) {
            const status = loginError?.response?.status;
            if (status === 401) {
                setError('Invalid email or password.');
            } else {
                setError('Unable to sign in right now. Please try again.');
            }
            console.error('b.well App login failed', loginError);
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
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, width: '100%' }}>
                    {clientKeys.length > 1 && (
                        <Select
                            fullWidth
                            value={selectedClientName}
                            onChange={handleClientChange}
                            sx={{ mb: 2 }}
                        >
                            {clientKeys.map((client) => (
                                <MenuItem key={client.name} value={client.name}>
                                    {client.name}
                                </MenuItem>
                            ))}
                        </Select>
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
                        color="secondary"
                        sx={{ width: '100%', mb: 2 }}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Signing In...' : 'Sign In'}
                    </Button>
                    <Link component="button" type="button" onClick={() => navigate('/select-idp')}>
                        Back
                    </Link>
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default BwellAppLogin;
