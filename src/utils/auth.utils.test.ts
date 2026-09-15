import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAuthService } = vi.hoisted(() => ({ mockGetAuthService: vi.fn() }));

vi.mock('../services/AuthServiceFactory', () => ({
    default: { getAuthService: mockGetAuthService },
}));

import AuthServiceFactory from '../services/AuthServiceFactory';
import { logout, removeAuthData } from './auth.utils';

const ORIGIN = 'https://app.example.com';

const originalLocation = window.location;
let mockReplace: ReturnType<typeof vi.fn>;

const seedAllAuthKeys = (): void => {
    localStorage.setItem('jwt', 'jwt-value');
    localStorage.setItem('id_token', 'id-token-value');
    localStorage.setItem('identityProvider', 'okta');
    localStorage.setItem('code_verifier', 'code-verifier-value');
};

const makeAuthService = (logoutUrl: string) => ({
    getLoginUrlAsync: vi.fn(),
    getLogoutUrlAsync: vi.fn().mockResolvedValue(logoutUrl),
    fetchTokenAsync: vi.fn(),
});

describe('auth.utils', () => {
    beforeEach(() => {
        localStorage.clear();
        mockGetAuthService.mockReset();
        mockReplace = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { origin: ORIGIN, href: `${ORIGIN}/resources`, replace: mockReplace },
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
            configurable: true,
        });
        vi.restoreAllMocks();
    });

    describe('removeAuthData', () => {
        it('clears every token-bearing key and nothing else (invariant 3)', () => {
            seedAllAuthKeys();
            localStorage.setItem('darkMode', 'true');

            removeAuthData();

            expect(localStorage.getItem('jwt')).toBeNull();
            expect(localStorage.getItem('id_token')).toBeNull();
            expect(localStorage.getItem('identityProvider')).toBeNull();
            expect(localStorage.getItem('code_verifier')).toBeNull();
            expect(localStorage.getItem('darkMode')).toBe('true');
            expect(localStorage.length).toBe(1);
        });

        it('is a no-op that does not throw when nothing is stored', () => {
            expect(() => removeAuthData()).not.toThrow();
            expect(localStorage.length).toBe(0);
        });
    });

    describe('logout', () => {
        it('clears auth data and redirects to the app origin when no identity provider is stored', async () => {
            localStorage.setItem('jwt', 'jwt-value');
            localStorage.setItem('id_token', 'id-token-value');
            const setUserDetails = vi.fn();

            await logout(setUserDetails);

            expect(localStorage.getItem('jwt')).toBeNull();
            expect(localStorage.getItem('id_token')).toBeNull();
            expect(setUserDetails).toHaveBeenCalledWith(null);
            expect(mockReplace).toHaveBeenCalledWith(ORIGIN);
            expect(mockGetAuthService).not.toHaveBeenCalled();
        });

        it.each(['bwellapp', 'cognitocc', 'descopecc'])(
            'clears locally and redirects to the origin for the credentials-based provider "%s" without building an IdP logout url',
            async (provider) => {
                seedAllAuthKeys();
                localStorage.setItem('identityProvider', provider);
                const setUserDetails = vi.fn();

                await logout(setUserDetails);

                expect(localStorage.getItem('jwt')).toBeNull();
                expect(localStorage.getItem('id_token')).toBeNull();
                expect(localStorage.getItem('identityProvider')).toBeNull();
                expect(localStorage.getItem('code_verifier')).toBeNull();
                expect(setUserDetails).toHaveBeenCalledWith(null);
                expect(mockReplace).toHaveBeenCalledWith(ORIGIN);
                // These providers have no OIDC end-session endpoint, so no logout url is built.
                expect(mockGetAuthService).not.toHaveBeenCalled();
            }
        );

        it('redirects to the IdP end-session url for an OIDC provider and clears local auth data (invariant 4)', async () => {
            seedAllAuthKeys();
            localStorage.setItem('identityProvider', 'okta');
            const authService = makeAuthService('https://okta.example.com/oauth2/v1/logout?id_token_hint=x');
            mockGetAuthService.mockReturnValue(authService);
            const setUserDetails = vi.fn();

            await logout(setUserDetails);

            expect(AuthServiceFactory.getAuthService).toHaveBeenCalledTimes(1);
            expect(authService.getLogoutUrlAsync).toHaveBeenCalledWith('okta');
            expect(mockReplace).toHaveBeenCalledWith(
                'https://okta.example.com/oauth2/v1/logout?id_token_hint=x'
            );
            expect(setUserDetails).toHaveBeenCalledWith(null);
            // Ordering: the local auth data must be gone by the time we redirect.
            expect(localStorage.getItem('jwt')).toBeNull();
            expect(localStorage.getItem('id_token')).toBeNull();
            expect(localStorage.getItem('identityProvider')).toBeNull();
            expect(localStorage.getItem('code_verifier')).toBeNull();
        });

        it('still clears auth data and redirects to the origin when the logout url cannot be built (invariant 4)', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
            seedAllAuthKeys();
            mockGetAuthService.mockReturnValue({
                getLoginUrlAsync: vi.fn(),
                getLogoutUrlAsync: vi.fn().mockRejectedValue(new Error('well-known fetch failed')),
                fetchTokenAsync: vi.fn(),
            });
            const setUserDetails = vi.fn();

            await logout(setUserDetails);

            expect(localStorage.getItem('jwt')).toBeNull();
            expect(localStorage.getItem('id_token')).toBeNull();
            expect(localStorage.getItem('identityProvider')).toBeNull();
            expect(localStorage.getItem('code_verifier')).toBeNull();
            expect(setUserDetails).toHaveBeenCalledWith(null);
            expect(mockReplace).toHaveBeenCalledWith(ORIGIN);
            expect(consoleError).toHaveBeenCalledWith('Logout failed', expect.any(Error));
        });

        it('still clears auth data and redirects when the stored provider is unsupported (invariant 4 + 17)', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
            seedAllAuthKeys();
            localStorage.setItem('identityProvider', 'stale-provider');
            mockGetAuthService.mockImplementation(() => {
                throw new Error('Unsupported identity provider: stale-provider');
            });

            await logout(vi.fn());

            expect(localStorage.getItem('jwt')).toBeNull();
            expect(localStorage.getItem('identityProvider')).toBeNull();
            expect(mockReplace).toHaveBeenCalledWith(ORIGIN);
            expect(consoleError).toHaveBeenCalledWith('Logout failed', expect.any(Error));
        });

        it('works without the optional setUserDetails callback', async () => {
            seedAllAuthKeys();
            localStorage.setItem('identityProvider', 'bwellapp');

            await expect(logout()).resolves.toBeUndefined();

            expect(localStorage.getItem('jwt')).toBeNull();
            expect(localStorage.getItem('id_token')).toBeNull();
            expect(localStorage.getItem('identityProvider')).toBeNull();
            expect(mockReplace).toHaveBeenCalledWith(ORIGIN);
        });

        it('works without setUserDetails on the OIDC path too', async () => {
            seedAllAuthKeys();
            mockGetAuthService.mockReturnValue(makeAuthService('https://okta.example.com/logout'));

            await expect(logout()).resolves.toBeUndefined();

            expect(localStorage.getItem('jwt')).toBeNull();
            expect(mockReplace).toHaveBeenCalledWith('https://okta.example.com/logout');
        });

        it('matches credentials-based providers case-sensitively: "BWELLAPP" takes the OIDC path', async () => {
            // Characterization test: pins the current behaviour of CREDENTIALS_BASED_PROVIDERS,
            // which is a Set of lower-case names checked without normalising the stored value.
            seedAllAuthKeys();
            localStorage.setItem('identityProvider', 'BWELLAPP');
            const authService = makeAuthService('https://idp.example.com/logout');
            mockGetAuthService.mockReturnValue(authService);

            await logout(vi.fn());

            expect(mockGetAuthService).toHaveBeenCalledTimes(1);
            expect(authService.getLogoutUrlAsync).toHaveBeenCalledWith('BWELLAPP');
            expect(mockReplace).toHaveBeenCalledWith('https://idp.example.com/logout');
        });
    });
});
