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

    it('returns only Authorization and Origin-Service', () => {
        localStorage.setItem('jwt', 'session-token-abc');

        expect(Object.keys(makeApi().getAuthHeaders()).sort()).toEqual(['Authorization', 'Origin-Service']);
    });

    it('omits Authorization when no session token exists', () => {
        const headers = makeApi().getAuthHeaders();

        expect(Object.keys(headers).map((name) => name.toLowerCase())).not.toContain('authorization');
        expect(Object.values(headers)).not.toContain('Bearer null');
    });

    it.each([
        { label: 'id_token', tokenKey: 'id_token' as string | undefined, expected: 'Bearer id-token-value' },
        { label: 'jwt', tokenKey: 'jwt' as string | undefined, expected: 'Bearer jwt-value' },
        { label: 'undefined (falls back to jwt)', tokenKey: undefined, expected: 'Bearer jwt-value' },
    ])('uses the token chosen by the identity provider: $label', ({ tokenKey, expected }) => {
        localStorage.setItem('identityProvider', 'provider-a');
        localStorage.setItem('jwt', 'jwt-value');
        localStorage.setItem('id_token', 'id-token-value');
        mockGetAuthInfo.mockReturnValue({ tokenToSendToFhirServer: tokenKey });

        expect(makeApi().getAuthHeaders()['Authorization']).toBe(expected);
    });

    it('sends an opaque non-JWT token unchanged', () => {
        localStorage.setItem('jwt', 'not-a-jwt');

        expect(makeApi().getAuthHeaders()['Authorization']).toBe('Bearer not-a-jwt');
    });
});
