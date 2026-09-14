import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { WellKnownConfigurationService } from './WellKnownConfigurationService';

vi.mock('axios', () => ({
    default: {
        create: vi.fn(),
        get: vi.fn(),
        post: vi.fn(),
        isAxiosError: vi.fn(),
    },
}));

const mockCreate = vi.mocked(axios.create);
const mockIsAxiosError = vi.mocked(axios.isAxiosError);
const mockGet = vi.fn();

// The LRU cache is a private *static* field shared by every instance and never reset
// between tests, so every test must use a URL no other test has used.
let urlCounter = 0;
const uniqueUrl = (label: string): string =>
    `https://idp-${(urlCounter += 1)}.example.com/${label}/.well-known/openid-configuration`;

const DISCOVERY_DOCUMENT = {
    authorization_endpoint: 'https://idp.example.com/oauth2/v1/authorize',
    token_endpoint: 'https://idp.example.com/oauth2/v1/token',
    userinfo_endpoint: 'https://idp.example.com/oauth2/v1/userinfo',
    jwks_uri: 'https://idp.example.com/oauth2/v1/keys',
    issuer: 'https://idp.example.com',
    end_session_endpoint: 'https://idp.example.com/oauth2/v1/logout',
    revocation_endpoint: 'https://idp.example.com/oauth2/v1/revoke',
    introspection_endpoint: 'https://idp.example.com/oauth2/v1/introspect',
    scopes_supported: ['openid', 'profile', 'email'],
    response_types_supported: ['code', 'token'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'none'],
};

describe('WellKnownConfigurationService', () => {
    beforeEach(() => {
        mockGet.mockReset();
        mockCreate.mockReset();
        mockIsAxiosError.mockReset();
        mockCreate.mockReturnValue({ get: mockGet } as never);
        mockIsAxiosError.mockReturnValue(false);
    });

    it('creates its axios instance with a JSON Accept header and a 10 second timeout', () => {
        const service = new WellKnownConfigurationService({});

        expect(service).toBeInstanceOf(WellKnownConfigurationService);
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockCreate).toHaveBeenCalledWith({
            headers: { Accept: 'application/json' },
            timeout: 10000,
        });
    });

    it('extracts the documented OIDC discovery fields verbatim from the response body', async () => {
        const url = uniqueUrl('verbatim');
        mockGet.mockResolvedValue({ data: DISCOVERY_DOCUMENT });

        const config = await new WellKnownConfigurationService({}).fetchConfigurationAsync(url);

        expect(mockGet).toHaveBeenCalledWith(url);
        expect(config.authorization_endpoint).toBe('https://idp.example.com/oauth2/v1/authorize');
        expect(config.token_endpoint).toBe('https://idp.example.com/oauth2/v1/token');
        expect(config.userinfo_endpoint).toBe('https://idp.example.com/oauth2/v1/userinfo');
        expect(config.jwks_uri).toBe('https://idp.example.com/oauth2/v1/keys');
        expect(config.issuer).toBe('https://idp.example.com');
        expect(config.end_session_endpoint).toBe('https://idp.example.com/oauth2/v1/logout');
        expect(config.revocation_endpoint).toBe('https://idp.example.com/oauth2/v1/revoke');
        expect(config.introspection_endpoint).toBe('https://idp.example.com/oauth2/v1/introspect');
        expect(config.scopes_supported).toEqual(['openid', 'profile', 'email']);
        expect(config.response_types_supported).toEqual(['code', 'token']);
        expect(config.token_endpoint_auth_methods_supported).toEqual([
            'client_secret_basic',
            'none',
        ]);
    });

    it('defaults the three list-valued fields to empty arrays when the IdP omits them', async () => {
        const url = uniqueUrl('missing-lists');
        mockGet.mockResolvedValue({
            data: {
                authorization_endpoint: 'https://sparse.example.com/authorize',
                token_endpoint: 'https://sparse.example.com/token',
            },
        });

        const config = await new WellKnownConfigurationService({}).fetchConfigurationAsync(url);

        // Downstream code iterates these, so they must be [] and not undefined.
        expect(config.scopes_supported).toEqual([]);
        expect(config.response_types_supported).toEqual([]);
        expect(config.token_endpoint_auth_methods_supported).toEqual([]);
        // Scalar fields that were genuinely absent stay undefined.
        expect(config.issuer).toBeUndefined();
        expect(config.end_session_endpoint).toBeUndefined();
    });

    it('drops fields outside the documented set instead of passing the whole document through', async () => {
        const url = uniqueUrl('extra-keys');
        mockGet.mockResolvedValue({
            data: {
                ...DISCOVERY_DOCUMENT,
                device_authorization_endpoint: 'https://idp.example.com/oauth2/v1/device',
                registration_endpoint: 'https://idp.example.com/oauth2/v1/register',
                claims_supported: ['sub', 'email'],
            },
        });

        const config = await new WellKnownConfigurationService({}).fetchConfigurationAsync(url);

        expect(config).not.toHaveProperty('device_authorization_endpoint');
        expect(config).not.toHaveProperty('registration_endpoint');
        expect(config).not.toHaveProperty('claims_supported');
        expect(Object.keys(config).sort()).toEqual([
            'authorization_endpoint',
            'end_session_endpoint',
            'introspection_endpoint',
            'issuer',
            'jwks_uri',
            'response_types_supported',
            'revocation_endpoint',
            'scopes_supported',
            'token_endpoint',
            'token_endpoint_auth_methods_supported',
            'userinfo_endpoint',
        ]);
    });

    it('serves a repeated fetch of the same url from the cache without a second HTTP call', async () => {
        const url = uniqueUrl('cache-hit');
        mockGet.mockResolvedValue({ data: DISCOVERY_DOCUMENT });
        const service = new WellKnownConfigurationService({});

        const first = await service.fetchConfigurationAsync(url);
        const second = await service.fetchConfigurationAsync(url);

        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
        expect(second.token_endpoint).toBe('https://idp.example.com/oauth2/v1/token');
    });

    it('keys the cache by url so two different IdPs do not collide', async () => {
        const firstUrl = uniqueUrl('idp-one');
        const secondUrl = uniqueUrl('idp-two');
        const service = new WellKnownConfigurationService({});

        mockGet.mockResolvedValueOnce({
            data: { ...DISCOVERY_DOCUMENT, authorization_endpoint: 'https://one.example.com/authorize' },
        });
        const first = await service.fetchConfigurationAsync(firstUrl);

        mockGet.mockResolvedValueOnce({
            data: { ...DISCOVERY_DOCUMENT, authorization_endpoint: 'https://two.example.com/authorize' },
        });
        const second = await service.fetchConfigurationAsync(secondUrl);

        expect(mockGet).toHaveBeenCalledTimes(2);
        expect(first.authorization_endpoint).toBe('https://one.example.com/authorize');
        expect(second.authorization_endpoint).toBe('https://two.example.com/authorize');
    });

    it('rejects a non-object response body (e.g. an HTML error page served with 200)', async () => {
        const url = uniqueUrl('html-body');
        mockGet.mockResolvedValue({ data: '<html><body>502 Bad Gateway</body></html>' });

        await expect(
            new WellKnownConfigurationService({}).fetchConfigurationAsync(url)
        ).rejects.toThrow(`Failed to fetch configuration from ${url}: Invalid configuration data`);
    });

    it('rejects a null response body rather than returning an all-undefined configuration', async () => {
        const url = uniqueUrl('null-body');
        mockGet.mockResolvedValue({ data: null });

        await expect(
            new WellKnownConfigurationService({}).fetchConfigurationAsync(url)
        ).rejects.toThrow(`Failed to fetch configuration from ${url}: Invalid configuration data`);
    });

    it('wraps an axios error using response.data when the IdP returned a body', async () => {
        const url = uniqueUrl('axios-response-data');
        mockIsAxiosError.mockReturnValue(true);
        mockGet.mockRejectedValue({
            message: 'Request failed with status code 503',
            response: { data: 'service unavailable' },
        });

        await expect(
            new WellKnownConfigurationService({}).fetchConfigurationAsync(url)
        ).rejects.toThrow(`Failed to fetch configuration from ${url}: service unavailable`);
    });

    it('wraps an axios error using its message when there is no response body', async () => {
        const url = uniqueUrl('axios-message-only');
        mockIsAxiosError.mockReturnValue(true);
        mockGet.mockRejectedValue({ message: 'timeout of 10000ms exceeded' });

        await expect(
            new WellKnownConfigurationService({}).fetchConfigurationAsync(url)
        ).rejects.toThrow(`Failed to fetch configuration from ${url}: timeout of 10000ms exceeded`);
    });

    it('wraps a non-axios, non-Error thrown value via String(error)', async () => {
        const url = uniqueUrl('thrown-string');
        mockGet.mockRejectedValue('kaboom');

        await expect(
            new WellKnownConfigurationService({}).fetchConfigurationAsync(url)
        ).rejects.toThrow(`Failed to fetch configuration from ${url}: kaboom`);
    });

    it('does not cache a failed fetch, so a later retry of the same url can succeed', async () => {
        const url = uniqueUrl('retry-after-failure');
        const service = new WellKnownConfigurationService({});

        mockGet.mockRejectedValueOnce(new Error('DNS failure'));
        await expect(service.fetchConfigurationAsync(url)).rejects.toThrow(
            `Failed to fetch configuration from ${url}: DNS failure`
        );

        mockGet.mockResolvedValueOnce({ data: DISCOVERY_DOCUMENT });
        const config = await service.fetchConfigurationAsync(url);

        expect(mockGet).toHaveBeenCalledTimes(2);
        expect(config.authorization_endpoint).toBe('https://idp.example.com/oauth2/v1/authorize');
    });
});
