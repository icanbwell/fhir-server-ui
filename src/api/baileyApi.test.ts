import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAuthInfo } = vi.hoisted(() => ({ mockGetAuthInfo: vi.fn() }));

vi.mock('../utils/auth.utils', () => ({ logout: vi.fn(), removeAuthData: vi.fn() }));
vi.mock('../utils/authUrlProvider', () => ({
    default: vi.fn().mockImplementation(function AuthUrlProviderMock() {
        return { getAuthInfo: mockGetAuthInfo };
    }),
}));

import BaileyApi from './baileyApi';

const makeApi = () => new BaileyApi({ fhirUrl: 'https://bailey.example.com', setUserDetails: undefined });

describe('BaileyApi.getAuthHeaders', () => {
    beforeEach(() => {
        localStorage.clear();
        mockGetAuthInfo.mockReset();
    });

    it('attaches the session bearer token', () => {
        localStorage.setItem('jwt', 'session-token-abc');

        expect(makeApi().getAuthHeaders()['Authorization']).toBe('Bearer session-token-abc');
    });

    it('sends Origin-Service fhir-ui', () => {
        expect(makeApi().getAuthHeaders()['Origin-Service']).toBe('fhir-ui');
    });

    it('returns only Authorization and Origin-Service so the library owns Accept and Content-Type', () => {
        localStorage.setItem('jwt', 'session-token-abc');

        expect(Object.keys(makeApi().getAuthHeaders()).sort()).toEqual(['Authorization', 'Origin-Service']);
    });

    it('omits Authorization (not "Bearer null") when no session token exists', () => {
        const headers = makeApi().getAuthHeaders();

        expect(Object.keys(headers).map((name) => name.toLowerCase())).not.toContain('authorization');
        expect(Object.values(headers).join(' ')).not.toContain('null');
    });

    it.each([
        { label: 'id_token', tokenKey: 'id_token' as string | undefined, expected: 'Bearer id-token-value' },
        { label: 'jwt', tokenKey: 'jwt' as string | undefined, expected: 'Bearer access-token-value' },
        { label: 'undefined (falls back to jwt)', tokenKey: undefined, expected: 'Bearer access-token-value' },
    ])('uses the token chosen by the identity provider: $label', ({ tokenKey, expected }) => {
        localStorage.setItem('identityProvider', 'okta');
        localStorage.setItem('jwt', 'access-token-value');
        localStorage.setItem('id_token', 'id-token-value');
        mockGetAuthInfo.mockReturnValue({ clientId: 'c', tokenForUserDetails: 'jwt', tokenToSendToFhirServer: tokenKey });

        expect(makeApi().getAuthHeaders()['Authorization']).toBe(expected);
        expect(mockGetAuthInfo).toHaveBeenCalledWith('okta');
    });

    it('sends an opaque non-JWT token unchanged', () => {
        localStorage.setItem('jwt', 'not-a-jwt');

        expect(makeApi().getAuthHeaders()['Authorization']).toBe('Bearer not-a-jwt');
    });
});
