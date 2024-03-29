import { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Buffer } from 'buffer';
import { setLocalData } from '../utils/localData.utils';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { jwtParser } from '../utils/jwtParser';

const Auth = () => {
    const env = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const redirectToLogin = (query: URLSearchParams) => {
        console.log('redirecting to login....');
        const resourceUrl = location.state?.resourceUrl || '/';
        query.set('response_type', 'code');
        query.set('state', Buffer.from(resourceUrl).toString('base64'));

        // state parameter determines the url that Cognito redirects to: https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html
        window.location.replace(`${env.AUTH_CODE_FLOW_URL}/login?${query.toString()}`);
    };

    const fetchToken = async (query: URLSearchParams) => {
        console.log('Fetching token....');
        // if code is present then fetch the JWT token and save it into the localStorage
        const state = queryParams.get('state');
        const resourceUrl = state ? Buffer.from(state, 'base64').toString('ascii') : '/';
        const tokenUrl = `${env.AUTH_CODE_FLOW_URL}/oauth2/token`;

        query.set('grant_type', 'authorization_code');

        const queryString = query.toString();

        try {
            const res = await axios.request({
                url: tokenUrl,
                method: 'post',
                data: queryString,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            setLocalData('jwt', res.data.access_token);
            if (setUserDetails) {
                setUserDetails(jwtParser({
                    customGroup: env.AUTH_CUSTOM_GROUP,
                    customScope: env.AUTH_CUSTOM_SCOPE,
                }));
            }
            // redirect to the url user is trying to access and replace it with current url
            window.location.replace(resourceUrl);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        const code = queryParams.get('code');
        const redirectUri = `${window.location.origin}/authcallback`;

        // Add common queryParams into the query
        const query = new URLSearchParams();
        query.set('client_id', env.AUTH_CODE_FLOW_CLIENT_ID);
        query.set('redirect_uri', redirectUri);

        // if code is not present in the queryParams then this if the first redirect send to login page
        if (!code) {
            redirectToLogin(query);
        } else {
            query.set('code', code);
            fetchToken(query);
        }
    }, [location]);

    return <>Redirecting...</>;
};

export default Auth;
