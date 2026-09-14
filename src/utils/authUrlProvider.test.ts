import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFetchConfigurationAsync } = vi.hoisted(() => ({
    mockFetchConfigurationAsync: vi.fn(),
}));

vi.mock('../services/WellKnownConfigurationService', () => ({
    WellKnownConfigurationService: vi.fn().mockImplementation(function ServiceMock() {
        return { fetchConfigurationAsync: mockFetchConfigurationAsync };
    }),
}));

import { WellKnownConfigurationService } from '../services/WellKnownConfigurationService';
import { APP_ENV } from '../runtimeEnv';
import AuthUrlProvider from './authUrlProvider';

// APP_ENV is a plain mutable object built once at import time from import.meta.env plus
// window.__ENV__ (src/runtimeEnv.ts), so tests configure the provider by writing to it directly
// and remove exactly the keys they added afterwards.
const ENV_KEYS = [
    'REACT_APP_AUTH_TESTIDP_WELL_KNOWN_URL',
    'REACT_APP_AUTH_TESTIDP_AUTHORIZE_URL',
    'REACT_APP_AUTH_TESTIDP_TOKEN_URL',
    'REACT_APP_AUTH_TESTIDP_LOGOUT_URL',
    'REACT_APP_AUTH_TESTIDP_CUSTOM_USERNAME',
    'REACT_APP_AUTH_TESTIDP_CUSTOM_GROUP',
    'REACT_APP_AUTH_TESTIDP_CUSTOM_SCOPE',
    'REACT_APP_AUTH_TESTIDP_CLIENT_ID',
    'REACT_APP_AUTH_TESTIDP_TOKEN_FOR_USER_DETAILS',
    'REACT_APP_AUTH_TESTIDP_TOKEN_TO_SEND_TO_FHIR_SERVER',
    'REACT_APP_AUTH_TESTIDP_REMOVE_SCOPE_PREFIX',
    'REACT_APP_AUTH_TESTIDP_LOGIN_SCOPES',
];

const clearEnv = () => ENV_KEYS.forEach((key) => Reflect.deleteProperty(APP_ENV, key));

const DISCOVERY = {
    issuer: 'https://idp.example.com',
    authorization_endpoint: 'https://idp.example.com/oauth2/v1/authorize',
    token_endpoint: 'https://idp.example.com/oauth2/v1/token',
    end_session_endpoint: 'https://idp.example.com/oauth2/v1/logout',
    userinfo_endpoint: 'https://idp.example.com/oauth2/v1/userinfo',
    jwks_uri: 'https://idp.example.com/oauth2/v1/keys',
    scopes_supported: ['openid'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
};

const AUTH_INFO_ENV = {
    REACT_APP_AUTH_TESTIDP_CUSTOM_USERNAME: 'preferred_username',
    REACT_APP_AUTH_TESTIDP_CUSTOM_GROUP: 'groups',
    REACT_APP_AUTH_TESTIDP_CUSTOM_SCOPE: 'custom:scope',
    REACT_APP_AUTH_TESTIDP_CLIENT_ID: 'client-abc',
    REACT_APP_AUTH_TESTIDP_TOKEN_FOR_USER_DETAILS: 'jwt',
};

beforeEach(() => {
    vi.clearAllMocks();
    clearEnv();
    mockFetchConfigurationAsync.mockResolvedValue(DISCOVERY);
});

afterEach(() => {
    clearEnv();
});

describe('AuthUrlProvider.getAuthUrlsAsync via OIDC discovery', () => {
    it('derives all three endpoints from the well-known document', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_WELL_KNOWN_URL:
                'https://idp.example.com/.well-known/openid-configuration',
        });

        const result = await new AuthUrlProvider().getAuthUrlsAsync('testidp');

        expect(result).toEqual({
            authorizeUrl: DISCOVERY.authorization_endpoint,
            tokenUrl: DISCOVERY.token_endpoint,
            logoutUrl: DISCOVERY.end_session_endpoint,
            wellKnownUrl: 'https://idp.example.com/.well-known/openid-configuration',
        });
        expect(mockFetchConfigurationAsync).toHaveBeenCalledWith(
            'https://idp.example.com/.well-known/openid-configuration'
        );
        expect(WellKnownConfigurationService).toHaveBeenCalledTimes(1);
    });

    it('uppercases the provider name when reading environment variables', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_WELL_KNOWN_URL: 'https://idp.example.com/.well-known/oc',
        });

        const result = await new AuthUrlProvider().getAuthUrlsAsync('TestIdp');

        expect(result.wellKnownUrl).toBe('https://idp.example.com/.well-known/oc');
    });

    it('prefers the discovery document over explicitly configured endpoint URLs', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_WELL_KNOWN_URL: 'https://idp.example.com/.well-known/oc',
            REACT_APP_AUTH_TESTIDP_AUTHORIZE_URL: 'https://stale.example.com/authorize',
            REACT_APP_AUTH_TESTIDP_TOKEN_URL: 'https://stale.example.com/token',
            REACT_APP_AUTH_TESTIDP_LOGOUT_URL: 'https://stale.example.com/logout',
        });

        const result = await new AuthUrlProvider().getAuthUrlsAsync('testidp');

        expect(result.authorizeUrl).toBe(DISCOVERY.authorization_endpoint);
        expect(result.tokenUrl).toBe(DISCOVERY.token_endpoint);
        expect(result.logoutUrl).toBe(DISCOVERY.end_session_endpoint);
    });

    it('fails closed when the discovery document omits the authorization endpoint', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_WELL_KNOWN_URL: 'https://idp.example.com/.well-known/oc',
        });
        mockFetchConfigurationAsync.mockResolvedValue({
            ...DISCOVERY,
            authorization_endpoint: undefined,
        });

        await expect(new AuthUrlProvider().getAuthUrlsAsync('testidp')).rejects.toThrow(
            'REACT_APP_AUTH_TESTIDP_AUTHORIZE_URL is not defined'
        );
    });

    it('fails closed when the discovery document omits the token endpoint', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_WELL_KNOWN_URL: 'https://idp.example.com/.well-known/oc',
        });
        mockFetchConfigurationAsync.mockResolvedValue({ ...DISCOVERY, token_endpoint: undefined });

        await expect(new AuthUrlProvider().getAuthUrlsAsync('testidp')).rejects.toThrow(
            'REACT_APP_AUTH_TESTIDP_TOKEN_URL is not defined'
        );
    });

    it('fails closed when the discovery document omits the end-session endpoint', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_WELL_KNOWN_URL: 'https://idp.example.com/.well-known/oc',
        });
        mockFetchConfigurationAsync.mockResolvedValue({
            ...DISCOVERY,
            end_session_endpoint: undefined,
        });

        await expect(new AuthUrlProvider().getAuthUrlsAsync('testidp')).rejects.toThrow(
            'REACT_APP_AUTH_TESTIDP_LOGOUT_URL is not defined'
        );
    });

    it('propagates a discovery failure instead of silently falling back to env URLs', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_WELL_KNOWN_URL: 'https://idp.example.com/.well-known/oc',
            REACT_APP_AUTH_TESTIDP_AUTHORIZE_URL: 'https://stale.example.com/authorize',
            REACT_APP_AUTH_TESTIDP_TOKEN_URL: 'https://stale.example.com/token',
            REACT_APP_AUTH_TESTIDP_LOGOUT_URL: 'https://stale.example.com/logout',
        });
        mockFetchConfigurationAsync.mockRejectedValue(
            new Error('Failed to fetch configuration from https://idp.example.com: timeout')
        );

        await expect(new AuthUrlProvider().getAuthUrlsAsync('testidp')).rejects.toThrow(
            /Failed to fetch configuration/
        );
    });

    it('names the missing variable when nothing at all is configured for the provider', async () => {
        await expect(new AuthUrlProvider().getAuthUrlsAsync('testidp')).rejects.toThrow(
            'REACT_APP_AUTH_TESTIDP_AUTHORIZE_URL is not defined'
        );
        expect(mockFetchConfigurationAsync).not.toHaveBeenCalled();
    });
});

describe('AuthUrlProvider.getAuthUrlsAsync via explicit environment URLs', () => {
    it('BUG-002: resolves from AUTHORIZE_URL/TOKEN_URL/LOGOUT_URL when no WELL_KNOWN_URL is set', async () => {
        // The else branch at authUrlProvider.ts:27-32 exists precisely to support providers
        // configured without OIDC discovery, but the guard at line 45-47 then rejects *because*
        // wellKnownUrl is unset — and reports it as "LOGOUT_URL is not defined", which is both
        // unreachable-by-design and the wrong variable name. Any deployment that configures the
        // three endpoint URLs directly can never authenticate.
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_AUTHORIZE_URL: 'https://idp.example.com/authorize',
            REACT_APP_AUTH_TESTIDP_TOKEN_URL: 'https://idp.example.com/token',
            REACT_APP_AUTH_TESTIDP_LOGOUT_URL: 'https://idp.example.com/logout',
        });

        await expect(new AuthUrlProvider().getAuthUrlsAsync('testidp')).resolves.toMatchObject({
            authorizeUrl: 'https://idp.example.com/authorize',
            tokenUrl: 'https://idp.example.com/token',
            logoutUrl: 'https://idp.example.com/logout',
        });
    });

    it('reports the missing TOKEN_URL when only the authorize URL is configured', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_AUTHORIZE_URL: 'https://idp.example.com/authorize',
        });

        await expect(new AuthUrlProvider().getAuthUrlsAsync('testidp')).rejects.toThrow(
            'REACT_APP_AUTH_TESTIDP_TOKEN_URL is not defined'
        );
    });

    it('never contacts the discovery service when no WELL_KNOWN_URL is configured', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_AUTHORIZE_URL: 'https://idp.example.com/authorize',
            REACT_APP_AUTH_TESTIDP_TOKEN_URL: 'https://idp.example.com/token',
            REACT_APP_AUTH_TESTIDP_LOGOUT_URL: 'https://idp.example.com/logout',
        });

        await new AuthUrlProvider()
            .getAuthUrlsAsync('testidp')
            .catch(() => undefined);

        expect(mockFetchConfigurationAsync).not.toHaveBeenCalled();
        expect(WellKnownConfigurationService).not.toHaveBeenCalled();
    });

    it('treats an empty-string WELL_KNOWN_URL as unset rather than fetching an empty URL', async () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_TESTIDP_WELL_KNOWN_URL: '',
            REACT_APP_AUTH_TESTIDP_AUTHORIZE_URL: 'https://idp.example.com/authorize',
        });

        await expect(new AuthUrlProvider().getAuthUrlsAsync('testidp')).rejects.toThrow(
            'REACT_APP_AUTH_TESTIDP_TOKEN_URL is not defined'
        );
        expect(mockFetchConfigurationAsync).not.toHaveBeenCalled();
    });
});

describe('AuthUrlProvider.getAuthInfo', () => {
    it('returns every configured claim mapping for the provider', () => {
        Object.assign(APP_ENV, AUTH_INFO_ENV, {
            REACT_APP_AUTH_TESTIDP_TOKEN_TO_SEND_TO_FHIR_SERVER: 'id_token',
            REACT_APP_AUTH_TESTIDP_REMOVE_SCOPE_PREFIX: 'prefix:, other:',
            REACT_APP_AUTH_TESTIDP_LOGIN_SCOPES: 'openid profile email',
        });

        expect(new AuthUrlProvider().getAuthInfo('testidp')).toEqual({
            customUserName: 'preferred_username',
            customGroup: 'groups',
            customScope: 'custom:scope',
            clientId: 'client-abc',
            tokenForUserDetails: 'jwt',
            tokenToSendToFhirServer: 'id_token',
            scopeRemovePrefix: ['prefix:', 'other:'],
            loginScopes: 'openid profile email',
        });
    });

    it('defaults the FHIR-bound token key to jwt when unset (INV-2)', () => {
        Object.assign(APP_ENV, AUTH_INFO_ENV);

        expect(new AuthUrlProvider().getAuthInfo('testidp').tokenToSendToFhirServer).toBe('jwt');
    });

    it('defaults the FHIR-bound token key to jwt when configured as an empty string', () => {
        Object.assign(APP_ENV, AUTH_INFO_ENV, {
            REACT_APP_AUTH_TESTIDP_TOKEN_TO_SEND_TO_FHIR_SERVER: '',
        });

        expect(new AuthUrlProvider().getAuthInfo('testidp').tokenToSendToFhirServer).toBe('jwt');
    });

    it('leaves the optional scope-prefix list undefined when not configured', () => {
        Object.assign(APP_ENV, AUTH_INFO_ENV);

        const info = new AuthUrlProvider().getAuthInfo('testidp');

        expect(info.scopeRemovePrefix).toBeUndefined();
        expect(info.loginScopes).toBeUndefined();
    });

    it('trims whitespace around each configured scope prefix', () => {
        Object.assign(APP_ENV, AUTH_INFO_ENV, {
            REACT_APP_AUTH_TESTIDP_REMOVE_SCOPE_PREFIX: '  a:  ,b:,  c:',
        });

        expect(new AuthUrlProvider().getAuthInfo('testidp').scopeRemovePrefix).toEqual([
            'a:',
            'b:',
            'c:',
        ]);
    });

    it.each([
        ['REACT_APP_AUTH_TESTIDP_CUSTOM_USERNAME', 'CUSTOM_USERNAME'],
        ['REACT_APP_AUTH_TESTIDP_CUSTOM_GROUP', 'CUSTOM_GROUP'],
        ['REACT_APP_AUTH_TESTIDP_CUSTOM_SCOPE', 'CUSTOM_SCOPE'],
        ['REACT_APP_AUTH_TESTIDP_CLIENT_ID', 'CLIENT_ID'],
        ['REACT_APP_AUTH_TESTIDP_TOKEN_FOR_USER_DETAILS', 'TOKEN_FOR_USER_DETAILS'],
    ])('fails closed and names %s when it is missing', (key, suffix) => {
        Object.assign(APP_ENV, AUTH_INFO_ENV);
        Reflect.deleteProperty(APP_ENV, key);

        expect(() => new AuthUrlProvider().getAuthInfo('testidp')).toThrow(
            `REACT_APP_AUTH_TESTIDP_${suffix} is not defined`
        );
    });

    it('fails closed for an identity provider that was never configured at all', () => {
        expect(() => new AuthUrlProvider().getAuthInfo('unknown-provider')).toThrow(
            'REACT_APP_AUTH_UNKNOWN-PROVIDER_CUSTOM_USERNAME is not defined'
        );
    });
});
