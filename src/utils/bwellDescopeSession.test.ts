import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockJwtParser } = vi.hoisted(() => ({ mockJwtParser: vi.fn() }));
vi.mock('./jwtParser', () => ({ jwtParser: mockJwtParser }));

import { completeBwellDescopeLogin } from './bwellDescopeSession';

const USER = { username: 'user@example.com', isAdmin: false } as never;

describe('completeBwellDescopeLogin', () => {
    beforeEach(() => {
        localStorage.clear();
        mockJwtParser.mockReset();
    });

    it('stores the jwt and provider, then returns the parsed user', () => {
        mockJwtParser.mockReturnValue(USER);
        expect(completeBwellDescopeLogin('jwt-abc')).toBe(USER);
        expect(localStorage.getItem('jwt')).toBe('jwt-abc');
        expect(localStorage.getItem('identityProvider')).toBe('bwelldescope');
    });

    it('replaces stale auth data from another provider', () => {
        localStorage.setItem('jwt', 'old');
        localStorage.setItem('id_token', 'old-id');
        localStorage.setItem('identityProvider', 'okta');
        mockJwtParser.mockReturnValue(USER);
        completeBwellDescopeLogin('jwt-abc');
        expect(localStorage.getItem('id_token')).toBeNull();
        expect(localStorage.getItem('identityProvider')).toBe('bwelldescope');
    });

    it('clears everything and returns null when the token cannot be parsed into a user', () => {
        mockJwtParser.mockReturnValue(null);
        expect(completeBwellDescopeLogin('jwt-abc')).toBeNull();
        expect(localStorage.getItem('jwt')).toBeNull();
        expect(localStorage.getItem('identityProvider')).toBeNull();
    });

    it.each([undefined, ''])('stores nothing when there is no session jwt (%s)', (value) => {
        expect(completeBwellDescopeLogin(value)).toBeNull();
        expect(localStorage.getItem('jwt')).toBeNull();
        expect(mockJwtParser).not.toHaveBeenCalled();
    });
});
