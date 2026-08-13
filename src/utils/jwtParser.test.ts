import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAuthInfo } = vi.hoisted(() => ({ mockGetAuthInfo: vi.fn() }));

vi.mock('./localData.utils', () => ({ getLocalData: vi.fn() }));
vi.mock('./auth.utils', () => ({ removeAuthData: vi.fn() }));
vi.mock('./authUrlProvider', () => ({
    default: vi.fn().mockImplementation(function AuthUrlProviderMock() {
        return { getAuthInfo: mockGetAuthInfo };
    }),
}));
vi.mock('jwt-decode', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jwt-decode')>();
    return { ...actual, jwtDecode: vi.fn() };
});

import { InvalidTokenError, jwtDecode } from 'jwt-decode';
import { getLocalData } from './localData.utils';
import { removeAuthData } from './auth.utils';
import { jwtParser } from './jwtParser';

const mockGetLocalData = vi.mocked(getLocalData);
const mockRemoveAuthData = vi.mocked(removeAuthData);
const mockJwtDecode = vi.mocked(jwtDecode);

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600;
const PAST_EXP = Math.floor(Date.now() / 1000) - 3600;

const baseAuthInfo = {
    customUserName: 'preferred_username',
    customGroup: '',
    customScope: 'custom:scope',
    clientId: 'client',
    tokenForUserDetails: 'jwt',
};

describe('jwtParser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null when no identity provider has been chosen', () => {
        mockGetLocalData.mockReturnValue(null);

        expect(jwtParser()).toBeNull();
        expect(mockRemoveAuthData).not.toHaveBeenCalled();
    });

    it('clears auth data and returns null when the stored provider is not configured', () => {
        mockGetLocalData.mockImplementation((key) => (key === 'identityProvider' ? 'stale-provider' : null));
        mockGetAuthInfo.mockImplementation(() => {
            throw new Error('REACT_APP_AUTH_STALE-PROVIDER_CUSTOM_USERNAME is not defined');
        });

        expect(jwtParser()).toBeNull();
        expect(mockRemoveAuthData).toHaveBeenCalledTimes(1);
    });

    it('returns null when there is no token in local storage', () => {
        mockGetLocalData.mockImplementation((key) => (key === 'identityProvider' ? 'okta' : null));
        mockGetAuthInfo.mockReturnValue(baseAuthInfo);

        expect(jwtParser()).toBeNull();
        expect(mockRemoveAuthData).not.toHaveBeenCalled();
    });

    it('clears auth data and returns null when the token is expired', () => {
        mockGetLocalData.mockImplementation((key) => {
            if (key === 'identityProvider') {return 'okta';}
            if (key === 'jwt') {return 'expired-token';}
            return null;
        });
        mockGetAuthInfo.mockReturnValue(baseAuthInfo);
        mockJwtDecode.mockReturnValue({ exp: PAST_EXP } as any);

        expect(jwtParser()).toBeNull();
        expect(mockRemoveAuthData).toHaveBeenCalledTimes(1);
    });

    it('returns null (without clearing auth data) when the token fails to decode', () => {
        mockGetLocalData.mockImplementation((key) => {
            if (key === 'identityProvider') {return 'okta';}
            if (key === 'jwt') {return 'garbage-token';}
            return null;
        });
        mockGetAuthInfo.mockReturnValue(baseAuthInfo);
        mockJwtDecode.mockImplementation(() => {
            throw new InvalidTokenError('Invalid token specified');
        });

        expect(jwtParser()).toBeNull();
        expect(mockRemoveAuthData).not.toHaveBeenCalled();
    });

    it('rethrows unexpected decode errors', () => {
        mockGetLocalData.mockImplementation((key) => {
            if (key === 'identityProvider') {return 'okta';}
            if (key === 'jwt') {return 'some-token';}
            return null;
        });
        mockGetAuthInfo.mockReturnValue(baseAuthInfo);
        const boom = new Error('boom');
        mockJwtDecode.mockImplementation(() => {
            throw boom;
        });

        expect(() => jwtParser()).toThrow(boom);
    });

    it('derives scope, username and admin status from the decoded token', () => {
        mockGetLocalData.mockImplementation((key) => {
            if (key === 'identityProvider') {return 'okta';}
            if (key === 'jwt') {return 'valid-token';}
            return null;
        });
        mockGetAuthInfo.mockReturnValue({
            ...baseAuthInfo,
            customUserName: 'preferred_username,upn',
            customGroup: 'groups',
        });
        mockJwtDecode.mockReturnValue({
            exp: FUTURE_EXP,
            scope: 'read write',
            groups: 'admin/all',
            preferred_username: 'alice',
        } as any);

        expect(jwtParser()).toEqual({
            scope: 'read write admin/all',
            username: 'alice',
            isAdmin: true,
        });
    });

    it('falls back to the custom scope claim when the token has no top-level scope', () => {
        mockGetLocalData.mockImplementation((key) => {
            if (key === 'identityProvider') {return 'okta';}
            if (key === 'jwt') {return 'valid-token';}
            return null;
        });
        mockGetAuthInfo.mockReturnValue(baseAuthInfo);
        mockJwtDecode.mockReturnValue({
            exp: FUTURE_EXP,
            'custom:scope': 'openid profile',
        } as any);

        const result = jwtParser();

        expect(result?.scope.trim()).toBe('openid profile');
        expect(result?.isAdmin).toBe(false);
    });

    it('strips configured scope prefixes', () => {
        mockGetLocalData.mockImplementation((key) => {
            if (key === 'identityProvider') {return 'okta';}
            if (key === 'jwt') {return 'valid-token';}
            return null;
        });
        mockGetAuthInfo.mockReturnValue({
            ...baseAuthInfo,
            scopeRemovePrefix: ['prefix:'],
        });
        mockJwtDecode.mockReturnValue({
            exp: FUTURE_EXP,
            scope: 'prefix:read prefix:write other',
        } as any);

        const result = jwtParser();

        expect(result?.scope.trim()).toBe('read write other');
    });

    it('falls back to decodedToken.username when no custom username claim matches', () => {
        mockGetLocalData.mockImplementation((key) => {
            if (key === 'identityProvider') {return 'okta';}
            if (key === 'jwt') {return 'valid-token';}
            return null;
        });
        mockGetAuthInfo.mockReturnValue(baseAuthInfo);
        mockJwtDecode.mockReturnValue({
            exp: FUTURE_EXP,
            scope: 'read',
            username: 'fallback-user',
        } as any);

        expect(jwtParser()?.username).toBe('fallback-user');
    });
});
