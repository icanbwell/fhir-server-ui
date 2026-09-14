import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAuthUrlsAsync, mockGetAuthInfo } = vi.hoisted(() => ({
    mockGetAuthUrlsAsync: vi.fn(),
    mockGetAuthInfo: vi.fn(),
}));

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('../utils/authUrlProvider', () => ({
    default: vi.fn().mockImplementation(function AuthUrlProviderMock() {
        return { getAuthUrlsAsync: mockGetAuthUrlsAsync, getAuthInfo: mockGetAuthInfo };
    }),
}));

import axios from 'axios';
import CognitoAuthService from './CognitoAuthService';

const mockPost = vi.mocked(axios.post);

const AUTH_URLS = {
    authorizeUrl: 'https://auth.example.com/oauth2/authorize',
    tokenUrl: 'https://auth.example.com/oauth2/token',
    logoutUrl: 'https://auth.example.com/logout',
    wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
};

const AUTH_INFO = {
    customUserName: 'cognito:username',
    customGroup: 'cognito:groups',
    customScope: 'custom:scope',
    clientId: 'cognito-client-id',
    tokenForUserDetails: 'jwt',
    tokenToSendToFhirServer: 'jwt',
};

const ORIGIN = window.location.origin;
const VERIFIER_CHARSET = /^[A-Za-z0-9\-._~]+$/;

/** Independently recompute the S256 challenge so the assertion does not reuse source logic. */
const expectedChallenge = async (verifier: string): Promise<string> => {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetAuthUrlsAsync.mockResolvedValue(AUTH_URLS);
    mockGetAuthInfo.mockReturnValue(AUTH_INFO);
    mockPost.mockResolvedValue({ data: { access_token: 'at', id_token: 'it' } } as any);
});

describe('CognitoAuthService.getLoginUrlAsync', () => {
    it('builds an authorization-code + PKCE request against the discovered authorize URL', async () => {
        const loginUrl = await new CognitoAuthService().getLoginUrlAsync(
            'cognito',
            '/4_0_0/Patient/p1'
        );

        const url = new URL(loginUrl);
        expect(`${url.origin}${url.pathname}`).toBe(AUTH_URLS.authorizeUrl);
        expect(url.searchParams.get('client_id')).toBe('cognito-client-id');
        expect(url.searchParams.get('response_type')).toBe('code');
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        expect(url.searchParams.get('redirect_uri')).toBe(`${ORIGIN}/authcallback`);
        expect(mockGetAuthUrlsAsync).toHaveBeenCalledWith('cognito');
    });

    it('falls back to the standard OIDC scopes when the provider configures none', async () => {
        const loginUrl = await new CognitoAuthService().getLoginUrlAsync('cognito', '/');

        expect(new URL(loginUrl).searchParams.get('scope')).toBe('openid profile email');
    });

    it('uses the provider-configured login scopes when present (§72)', async () => {
        mockGetAuthInfo.mockReturnValue({
            ...AUTH_INFO,
            loginScopes: 'openid profile email user/*.read',
        });

        const loginUrl = await new CognitoAuthService().getLoginUrlAsync('cognito', '/');

        expect(new URL(loginUrl).searchParams.get('scope')).toBe(
            'openid profile email user/*.read'
        );
    });

    it('omits the scope parameter entirely when the provider configures an empty string', async () => {
        mockGetAuthInfo.mockReturnValue({ ...AUTH_INFO, loginScopes: '' });

        const loginUrl = await new CognitoAuthService().getLoginUrlAsync('cognito', '/');

        // `?? ` only substitutes for null/undefined, so an explicit '' reaches the `if (scopes)`
        // guard and no scope is requested at all.
        expect(new URL(loginUrl).searchParams.has('scope')).toBe(false);
    });

    it('round-trips the requested resource URL through the state parameter', async () => {
        const resourceUrl = '/4_0_0/Person?_count=10';

        const loginUrl = await new CognitoAuthService().getLoginUrlAsync('cognito', resourceUrl);

        const state = new URL(loginUrl).searchParams.get('state') as string;
        expect(atob(state)).toBe(resourceUrl);
    });

    it('stores a 128-character verifier drawn only from the unreserved character set (RFC 7636)', async () => {
        await new CognitoAuthService().getLoginUrlAsync('cognito', '/');

        const verifier = localStorage.getItem('code_verifier') as string;
        expect(verifier).toHaveLength(128);
        expect(verifier).toMatch(VERIFIER_CHARSET);
    });

    it('sends the S256 hash of the stored verifier as the challenge, never the verifier itself', async () => {
        const loginUrl = await new CognitoAuthService().getLoginUrlAsync('cognito', '/');

        const verifier = localStorage.getItem('code_verifier') as string;
        const challenge = new URL(loginUrl).searchParams.get('code_challenge') as string;
        expect(challenge).toBe(await expectedChallenge(verifier));
        expect(loginUrl).not.toContain(verifier);
        expect(challenge).not.toContain('=');
    });

    it('mints a fresh verifier and challenge on every login attempt', async () => {
        const service = new CognitoAuthService();

        const firstUrl = await service.getLoginUrlAsync('cognito', '/');
        const firstVerifier = localStorage.getItem('code_verifier');
        const secondUrl = await service.getLoginUrlAsync('cognito', '/');

        expect(localStorage.getItem('code_verifier')).not.toBe(firstVerifier);
        expect(new URL(secondUrl).searchParams.get('code_challenge')).not.toBe(
            new URL(firstUrl).searchParams.get('code_challenge')
        );
    });

    it('fails closed when the provider is not configured', async () => {
        mockGetAuthUrlsAsync.mockRejectedValue(
            new Error('REACT_APP_AUTH_COGNITO_AUTHORIZE_URL is not defined')
        );

        await expect(new CognitoAuthService().getLoginUrlAsync('cognito', '/')).rejects.toThrow(
            'REACT_APP_AUTH_COGNITO_AUTHORIZE_URL is not defined'
        );
        expect(localStorage.getItem('code_verifier')).toBeNull();
    });
});

describe('CognitoAuthService.fetchTokenAsync', () => {
    it('exchanges the code for tokens using the stored verifier', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');

        const data = await new CognitoAuthService().fetchTokenAsync('cognito', 'auth-code', '/');

        expect(mockPost).toHaveBeenCalledTimes(1);
        const [url, body, config] = mockPost.mock.calls[0] as [string, URLSearchParams, any];
        expect(url).toBe(AUTH_URLS.tokenUrl);
        expect(body.get('grant_type')).toBe('authorization_code');
        expect(body.get('client_id')).toBe('cognito-client-id');
        expect(body.get('code')).toBe('auth-code');
        expect(body.get('code_verifier')).toBe('stored-verifier');
        expect(body.get('redirect_uri')).toBe(`${ORIGIN}/authcallback`);
        expect(config.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        expect(data).toEqual({ access_token: 'at', id_token: 'it' });
    });

    it('never sends a client secret from the browser', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');

        await new CognitoAuthService().fetchTokenAsync('cognito', 'auth-code', '/');

        const body = mockPost.mock.calls[0][1] as URLSearchParams;
        expect(body.has('client_secret')).toBe(false);
        expect([...body.keys()].sort()).toEqual([
            'client_id',
            'code',
            'code_verifier',
            'grant_type',
            'redirect_uri',
        ]);
    });

    it('refuses to exchange a code when no verifier was stored, without contacting the IdP', async () => {
        await expect(
            new CognitoAuthService().fetchTokenAsync('cognito', 'auth-code', '/')
        ).rejects.toThrow('No code verifier found');

        expect(mockPost).not.toHaveBeenCalled();
    });

    it('consumes the verifier on success so it cannot be replayed (RFC 7636 single use)', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');

        await new CognitoAuthService().fetchTokenAsync('cognito', 'auth-code', '/');

        expect(localStorage.getItem('code_verifier')).toBeNull();
    });

    it('propagates the IdP failure to the caller instead of returning a partial result', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');
        mockPost.mockRejectedValue(new Error('invalid_grant'));

        await expect(
            new CognitoAuthService().fetchTokenAsync('cognito', 'auth-code', '/')
        ).rejects.toThrow('invalid_grant');
    });

    it('fails closed when the provider configuration disappears mid-session', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');
        mockGetAuthInfo.mockImplementation(() => {
            throw new Error('REACT_APP_AUTH_COGNITO_CLIENT_ID is not defined');
        });

        await expect(
            new CognitoAuthService().fetchTokenAsync('cognito', 'auth-code', '/')
        ).rejects.toThrow('REACT_APP_AUTH_COGNITO_CLIENT_ID is not defined');
        expect(mockPost).not.toHaveBeenCalled();
    });
});

describe('CognitoAuthService.getLogoutUrlAsync', () => {
    it('builds a logout URL using Cognito\'s logout_uri parameter', async () => {
        const logoutUrl = await new CognitoAuthService().getLogoutUrlAsync('cognito');

        const url = new URL(logoutUrl);
        expect(`${url.origin}${url.pathname}`).toBe(AUTH_URLS.logoutUrl);
        expect(url.searchParams.get('client_id')).toBe('cognito-client-id');
        expect(url.searchParams.get('logout_uri')).toBe(ORIGIN);
        // Cognito's hosted-UI logout does not accept the OIDC-standard names.
        expect(url.searchParams.has('post_logout_redirect_uri')).toBe(false);
        expect(url.searchParams.has('id_token_hint')).toBe(false);
    });

    it('never puts the access token or verifier in the logout URL', async () => {
        localStorage.setItem('jwt', 'access-token-value');
        localStorage.setItem('code_verifier', 'verifier-value');

        const logoutUrl = await new CognitoAuthService().getLogoutUrlAsync('cognito');

        expect(logoutUrl).not.toContain('access-token-value');
        expect(logoutUrl).not.toContain('verifier-value');
    });

    it('fails closed when the logout URL cannot be resolved', async () => {
        mockGetAuthUrlsAsync.mockRejectedValue(
            new Error('REACT_APP_AUTH_COGNITO_LOGOUT_URL is not defined')
        );

        await expect(new CognitoAuthService().getLogoutUrlAsync('cognito')).rejects.toThrow(
            'REACT_APP_AUTH_COGNITO_LOGOUT_URL is not defined'
        );
    });
});
