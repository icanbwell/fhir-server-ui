import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLocalData } from '../utils/localData.utils';
import OktaAuthService from './OktaAuthService';
import CognitoAuthService from './CognitoAuthService';
import AuthServiceFactory from './AuthServiceFactory';

vi.mock('../utils/localData.utils', () => ({ getLocalData: vi.fn() }));

const mockGetLocalData = vi.mocked(getLocalData);

describe('AuthServiceFactory.getAuthService', () => {
    beforeEach(() => {
        mockGetLocalData.mockReset();
    });

    it('returns an OktaAuthService for "okta"', () => {
        mockGetLocalData.mockReturnValue('okta');

        expect(AuthServiceFactory.getAuthService()).toBeInstanceOf(OktaAuthService);
    });

    it('is case-insensitive', () => {
        mockGetLocalData.mockReturnValue('OKTA');

        expect(AuthServiceFactory.getAuthService()).toBeInstanceOf(OktaAuthService);
    });

    it('returns a CognitoAuthService for "cognito"', () => {
        mockGetLocalData.mockReturnValue('cognito');

        expect(AuthServiceFactory.getAuthService()).toBeInstanceOf(CognitoAuthService);
    });

    it('throws when no identity provider is stored', () => {
        mockGetLocalData.mockReturnValue(null);

        expect(() => AuthServiceFactory.getAuthService()).toThrow(
            'No identity provider found in local storage'
        );
    });

    it('throws for an unsupported provider', () => {
        mockGetLocalData.mockReturnValue('some-unknown-provider');

        expect(() => AuthServiceFactory.getAuthService()).toThrow(
            'Unsupported identity provider: some-unknown-provider'
        );
    });
});
