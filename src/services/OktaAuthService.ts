import axios, { AxiosResponse } from 'axios';
import AuthUrlProvider from '../utils/authUrlProvider';
import { IAuthService } from './IAuthService';
import { getLocalData, removeLocalData, setLocalData } from '../utils/localData.utils';

class OktaAuthService implements IAuthService {
    private authUrlProvider: AuthUrlProvider;

    constructor() {
        this.authUrlProvider = new AuthUrlProvider();
    }

    private generateCodeVerifier(length = 128): string {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(values, (x) => possible[x % possible.length]).join('');
    }

    private async generateCodeChallenge(codeVerifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    async getLoginUrlAsync(identityProvider: string, resourceUrl: string): Promise<string> {
        const authUrls = await this.authUrlProvider.getAuthUrlsAsync(identityProvider);
        const authInfo = this.authUrlProvider.getAuthInfo(identityProvider);
        const verifier = this.generateCodeVerifier();
        const challenge = await this.generateCodeChallenge(verifier);

        setLocalData('code_verifier', verifier);

        const authParams = new URLSearchParams({
            client_id: authInfo.clientId,
            response_type: 'code',
            scope: 'openid profile email groups',
            redirect_uri: `${window.location.origin}/authcallback`,
            state: btoa(resourceUrl),
            code_challenge: challenge,
            code_challenge_method: 'S256',
        });

        return `${authUrls.authorizeUrl}?${authParams.toString()}`;
    }

    async fetchTokenAsync(
        identityProvider: string,
        code: string,
        _resourceUrl: string
    ): Promise<any> {
        const authUrls = await this.authUrlProvider.getAuthUrlsAsync(identityProvider);
        const authInfo = this.authUrlProvider.getAuthInfo(identityProvider);
        const storedVerifier = getLocalData('code_verifier');

        if (!storedVerifier) {
            throw new Error('No code verifier found');
        }

        const tokenRequestData = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: authInfo.clientId,
            code: code,
            redirect_uri: `${window.location.origin}/authcallback`,
            code_verifier: storedVerifier,
        });

        try {
            const response: AxiosResponse = await axios.post(
                authUrls.tokenUrl,
                tokenRequestData,
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                }
            );

            removeLocalData('code_verifier');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async getLogoutUrlAsync(identityProvider: string): Promise<string> {
        const authUrls = await this.authUrlProvider.getAuthUrlsAsync(identityProvider);
        const authInfo = this.authUrlProvider.getAuthInfo(identityProvider);
        const idToken = getLocalData('id_token');
        const logoutParams = new URLSearchParams({
            client_id: authInfo.clientId,
            post_logout_redirect_uri: window.location.origin,
        });
        // Add ID token hint if available
        if (idToken) {
            logoutParams.set('id_token_hint', idToken);
        }

        return `${authUrls.logoutUrl}?${logoutParams.toString()}`;
    }
}

export default OktaAuthService;
