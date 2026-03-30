import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLocalData, setLocalData } from '../utils/localData.utils';
import UserContext from '../context/UserContext';
import { jwtParser } from '../utils/jwtParser';
import { Buffer } from 'buffer';
import AuthServiceFactory from '../services/AuthServiceFactory';
import { IAuthService } from '../services/IAuthService';
import { AxiosError } from 'axios';

const Auth = () => {
    const { setUserDetails } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isFetchingToken = useRef(false);

    const redirectToLogin = async () => {
        if (isProcessing) {
            return;
        }

        const identityProvider = getLocalData('identityProvider');
        if (!identityProvider) {
            console.error('No identity provider found in local storage');
            setError('No identity provider found in local storage');
            return;
        }
        const authService: IAuthService = AuthServiceFactory.getAuthService();

        setIsProcessing(true);

        let redirect_to_login_url: string | undefined;
        try {
            const resourceUrl = location.state?.resourceUrl || '/';
            redirect_to_login_url = await authService.getLoginUrlAsync(
                identityProvider,
                resourceUrl
            );
            window.location.href = redirect_to_login_url;
        } catch (error1) {
            console.error('Redirect to login failed', error1);
            setError(`Failed to redirect to login: ${redirect_to_login_url}: ${error1}`);
            setIsProcessing(false);
        }
    };

    const fetchTokenAsync = async (code: string) => {
        if (isProcessing || isFetchingToken.current) {
            return;
        }
        isFetchingToken.current = true;
        setIsProcessing(true);

        console.info('Fetching token');

        const identityProvider = getLocalData('identityProvider');
        if (!identityProvider) {
            console.error('No identity provider found in local storage');
            setError('No identity provider found in local storage');
            setIsProcessing(false);
            isFetchingToken.current = false;
            return;
        }
        const authService: IAuthService = AuthServiceFactory.getAuthService();

        try {
            const state = queryParams.get('state');
            const resourceUrl = state ? Buffer.from(state, 'base64').toString('ascii') : '/';
            const tokens = await authService.fetchTokenAsync(identityProvider, code, resourceUrl);

            setLocalData('jwt', tokens.access_token);
            setLocalData('id_token', tokens.id_token);

            if (setUserDetails) {
                setUserDetails(jwtParser());
            }
            console.log(`Token Fetched. Redirecting to ${resourceUrl}`);
            navigate(resourceUrl);
        } catch (error1: any) {
            // error1 is of type AxiosError
            const axiosError = error1 as AxiosError;
            console.error('Token fetch error:', {
                message: axiosError.message,
                status: axiosError.response?.status,
                data: axiosError.response?.data,
            });
            setError(`Failed to fetch token: ${axiosError.message}`);
            setIsProcessing(false);
        } finally {
            isFetchingToken.current = false;
        }
    };

    useEffect(() => {
        setIsProcessing(false);

        const state = queryParams.get('state');
        const resourceUrl = state ? Buffer.from(state, 'base64').toString('ascii') : '/';
        const authAppRedirectPath = process.env.REACT_APP_AUTH_REDIRECT_PATH;
        if (authAppRedirectPath && resourceUrl === process.env.REACT_APP_AUTH_REDIRECT_STATE) {
            window.location.href = authAppRedirectPath + location.search;

            // Redirect to home page after callback
            setTimeout(() => {
                navigate('/');
            }, 5000);
            return;
        }

        // Check if we already have a valid token to avoid re-processing
        const existingJwt = getLocalData('jwt');
        if (existingJwt) {
            navigate(resourceUrl);
            return;
        }

        const code = queryParams.get('code');
        if (!code) {
            if (queryParams.get('error')) {
                const errorCode = queryParams.get('error');
                const errorDescription = queryParams.get('error_description');
                console.error(`Authentication error, ${errorCode}: ${errorDescription}`);
                setError(`Authentication error, ${errorCode}: ${errorDescription}`);
                return;
            }
            redirectToLogin().catch(console.error);
        } else {
            fetchTokenAsync(code).catch(console.error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <>{error ? <div style={{ color: 'red' }}>{error}</div> : <>Authenticating...</>}</>;
};

export default Auth;
