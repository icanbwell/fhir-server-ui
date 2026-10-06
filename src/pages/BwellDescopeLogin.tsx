// src/pages/BwellDescopeLogin.tsx
import { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AuthProvider, Descope } from '@descope/react-sdk';
import { Link, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';
import { getLocalData } from '../utils/localData.utils';
import { getBwellDescopeConfig } from '../utils/bwellDescopeConfig';
import { completeBwellDescopeLogin } from '../utils/bwellDescopeSession';

const NOT_CONFIGURED_MESSAGE =
    'b.well App sign-in is not configured (missing REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID).';
const SESSION_ERROR_MESSAGE =
    'Signed in, but the session could not be established. Please contact support.';
const GENERIC_ERROR_MESSAGE = 'Unable to sign in right now. Please try again.';

const BwellDescopeLogin = () => {
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const resourceUrl = location.state?.resourceUrl || '/';
    const config = useMemo(() => getBwellDescopeConfig(), []);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (getLocalData('jwt')) {
            navigate(resourceUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSuccess = (event: CustomEvent<{ sessionJwt?: string }>) => {
        const userDetails = completeBwellDescopeLogin(event.detail?.sessionJwt);
        if (!userDetails) {
            setError(SESSION_ERROR_MESSAGE);
            return;
        }
        if (setUserDetails) {
            setUserDetails(userDetails);
        }
        navigate(resourceUrl);
    };

    const handleError = (event: CustomEvent<Record<string, unknown>>) => {
        // Log only the error type, never the full detail, which can echo user input.
        console.error('b.well Descope login failed', { type: event.detail?.errorType });
        setError(GENERIC_ERROR_MESSAGE);
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
                    minHeight: '85vh',
                    maxWidth: '400px',
                    margin: '0 auto',
                    padding: '0 10px',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Sign In With b.well App
                </Typography>
                {!config ? (
                    <Typography color="error" sx={{ mt: 4 }}>
                        {NOT_CONFIGURED_MESSAGE}
                    </Typography>
                ) : (
                    <AuthProvider
                        projectId={config.projectId}
                        baseUrl={config.baseUrl}
                        baseStaticUrl={config.baseStaticUrl}
                        persistTokens={false}
                        storeLastAuthenticatedUser={false}
                    >
                        <Descope
                            flowId={config.flowId}
                            tenant={config.tenantId}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                        {error && (
                            <Typography color="error" sx={{ mt: 2 }}>
                                {error}
                            </Typography>
                        )}
                    </AuthProvider>
                )}
                <Link
                    component="button"
                    type="button"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/select-idp', { state: { resourceUrl } })}
                >
                    Back
                </Link>
            </div>
            <Footer />
        </div>
    );
};

export default BwellDescopeLogin;
