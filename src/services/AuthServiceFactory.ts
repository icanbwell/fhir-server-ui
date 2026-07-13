import OktaAuthService from './OktaAuthService';
import CognitoAuthService from './CognitoAuthService';
import { IAuthService } from './IAuthService';
import { getLocalData } from '../utils/localData.utils';

class AuthServiceFactory {
    static getAuthService(): IAuthService {
        const identityProvider = getLocalData('identityProvider');

        if (!identityProvider) {
            throw new Error('No identity provider found in local storage');
        }

        switch (identityProvider.toLowerCase()) {
            case 'okta':
                return new OktaAuthService();
            case 'cognito':
                return new CognitoAuthService();
            default:
                throw new Error(`Unsupported identity provider: ${identityProvider}`);
        }
    }
}

export default AuthServiceFactory;
