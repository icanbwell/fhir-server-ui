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
import OktaAuthService from './OktaAuthService';

const mockPost = vi.mocked(axios.post);

const AUTH_URLS = {
    authorizeUrl: 'https://idp.okta.com/oauth2/v1/authorize',
    tokenUrl: 'https://idp.okta.com/oauth2/v1/token',
    logoutUrl: 'https://idp.okta.com/oauth2/v1/logout',
    wellKnownUrl: 'https://idp.okta.com/.well-known/openid-configuration',
};

const AUTH_INFO = {
    customUserName: 'preferred_username',
    customGroup: 'groups',
    customScope: 'custom:scope',
    clientId: 'okta-client-id',
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

describe('OktaAuthService.getLoginUrlAsync', () => {
    it('builds an authorization-code + PKCE request against the discovered authorize URL', async () => {
        const loginUrl = await new OktaAuthService().getLoginUrlAsync(
            'okta',
            '/4_0_0/Patient/p1'
        );

        const url = new URL(loginUrl);
        expect(`${url.origin}${url.pathname}`).toBe(AUTH_URLS.authorizeUrl);
        expect(url.searchParams.get('client_id')).toBe('okta-client-id');
        expect(url.searchParams.get('response_type')).toBe('code');
        expect(url.searchParams.get('code_challenge_method')).toBe('S256');
        expect(url.searchParams.get('redirect_uri')).toBe(`${ORIGIN}/authcallback`);
        expect(mockGetAuthUrlsAsync).toHaveBeenCalledWith('okta');
    });

    it('requests the groups scope Okta needs for admin detection', async () => {
        const loginUrl = await new OktaAuthService().getLoginUrlAsync('okta', '/');

        expect(new URL(loginUrl).searchParams.get('scope')).toBe('openid profile email groups');
    });

    it('round-trips the requested resource URL through the state parameter', async () => {
        const resourceUrl = '/4_0_0/Patient?_count=10';

        const loginUrl = await new OktaAuthService().getLoginUrlAsync('okta', resourceUrl);

        const state = new URL(loginUrl).searchParams.get('state') as string;
        expect(atob(state)).toBe(resourceUrl);
    });

    it('stores a 128-character verifier drawn only from the unreserved character set (RFC 7636)', async () => {
        await new OktaAuthService().getLoginUrlAsync('okta', '/');

        const verifier = localStorage.getItem('code_verifier') as string;
        expect(verifier).toHaveLength(128);
        expect(verifier).toMatch(VERIFIER_CHARSET);
    });

    it('sends the S256 hash of the stored verifier as the challenge, never the verifier itself', async () => {
        const loginUrl = await new OktaAuthService().getLoginUrlAsync('okta', '/');

        const verifier = localStorage.getItem('code_verifier') as string;
        const challenge = new URL(loginUrl).searchParams.get('code_challenge') as string;
        expect(challenge).toBe(await expectedChallenge(verifier));
        expect(loginUrl).not.toContain(verifier);
        expect(challenge).not.toContain('=');
    });

    it('mints a fresh verifier and challenge on every login attempt', async () => {
        const service = new OktaAuthService();

        const firstUrl = await service.getLoginUrlAsync('okta', '/');
        const firstVerifier = localStorage.getItem('code_verifier');
        const secondUrl = await service.getLoginUrlAsync('okta', '/');
        const secondVerifier = localStorage.getItem('code_verifier');

        expect(secondVerifier).not.toBe(firstVerifier);
        expect(new URL(secondUrl).searchParams.get('code_challenge')).not.toBe(
            new URL(firstUrl).searchParams.get('code_challenge')
        );
    });

    it('fails closed when the provider is not configured', async () => {
        mockGetAuthUrlsAsync.mockRejectedValue(
            new Error('REACT_APP_AUTH_OKTA_AUTHORIZE_URL is not defined')
        );

        await expect(new OktaAuthService().getLoginUrlAsync('okta', '/')).rejects.toThrow(
            'REACT_APP_AUTH_OKTA_AUTHORIZE_URL is not defined'
        );
        expect(localStorage.getItem('code_verifier')).toBeNull();
    });
});

describe('OktaAuthService.fetchTokenAsync', () => {
    it('exchanges the code for tokens using the stored verifier', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');

        const data = await new OktaAuthService().fetchTokenAsync('okta', 'auth-code', '/');

        expect(mockPost).toHaveBeenCalledTimes(1);
        const [url, body, config] = mockPost.mock.calls[0] as [string, URLSearchParams, any];
        expect(url).toBe(AUTH_URLS.tokenUrl);
        expect(body.get('grant_type')).toBe('authorization_code');
        expect(body.get('client_id')).toBe('okta-client-id');
        expect(body.get('code')).toBe('auth-code');
        expect(body.get('code_verifier')).toBe('stored-verifier');
        expect(body.get('redirect_uri')).toBe(`${ORIGIN}/authcallback`);
        expect(config.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        expect(data).toEqual({ access_token: 'at', id_token: 'it' });
    });

    it('never sends a client secret from the browser', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');

        await new OktaAuthService().fetchTokenAsync('okta', 'auth-code', '/');

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
            new OktaAuthService().fetchTokenAsync('okta', 'auth-code', '/')
        ).rejects.toThrow('No code verifier found');

        expect(mockPost).not.toHaveBeenCalled();
    });

    it('consumes the verifier on success so it cannot be replayed (RFC 7636 single use)', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');

        await new OktaAuthService().fetchTokenAsync('okta', 'auth-code', '/');

        expect(localStorage.getItem('code_verifier')).toBeNull();
    });

    it('propagates the IdP failure to the caller instead of returning a partial result', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');
        mockPost.mockRejectedValue(new Error('invalid_grant'));

        await expect(
            new OktaAuthService().fetchTokenAsync('okta', 'auth-code', '/')
        ).rejects.toThrow('invalid_grant');
    });

    it('fails closed when the provider configuration disappears mid-session', async () => {
        localStorage.setItem('code_verifier', 'stored-verifier');
        mockGetAuthInfo.mockImplementation(() => {
            throw new Error('REACT_APP_AUTH_OKTA_CLIENT_ID is not defined');
        });

        await expect(
            new OktaAuthService().fetchTokenAsync('okta', 'auth-code', '/')
        ).rejects.toThrow('REACT_APP_AUTH_OKTA_CLIENT_ID is not defined');
        expect(mockPost).not.toHaveBeenCalled();
    });
});

describe('OktaAuthService.getLogoutUrlAsync', () => {
    it('builds a logout URL that returns the user to this app', async () => {
        const logoutUrl = await new OktaAuthService().getLogoutUrlAsync('okta');

        const url = new URL(logoutUrl);
        expect(`${url.origin}${url.pathname}`).toBe(AUTH_URLS.logoutUrl);
        expect(url.searchParams.get('client_id')).toBe('okta-client-id');
        expect(url.searchParams.get('post_logout_redirect_uri')).toBe(ORIGIN);
    });

    it('includes the id_token_hint so Okta ends the right session', async () => {
        localStorage.setItem('id_token', 'stored-id-token');

        const logoutUrl = await new OktaAuthService().getLogoutUrlAsync('okta');

        expect(new URL(logoutUrl).searchParams.get('id_token_hint')).toBe('stored-id-token');
    });

    it('omits the id_token_hint when no id token is held', async () => {
        const logoutUrl = await new OktaAuthService().getLogoutUrlAsync('okta');

        expect(new URL(logoutUrl).searchParams.has('id_token_hint')).toBe(false);
    });

    it('never puts the access token or verifier in the logout URL', async () => {
        localStorage.setItem('jwt', 'access-token-value');
        localStorage.setItem('code_verifier', 'verifier-value');

        const logoutUrl = await new OktaAuthService().getLogoutUrlAsync('okta');

        expect(logoutUrl).not.toContain('access-token-value');
        expect(logoutUrl).not.toContain('verifier-value');
    });
});
