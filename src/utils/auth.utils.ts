import { getLocalData, removeLocalData } from './localData.utils';
import { IAuthService } from '../services/IAuthService';
import AuthServiceFactory from '../services/AuthServiceFactory';

const CREDENTIALS_BASED_PROVIDERS = new Set(['bwellapp', 'cognitocc', 'descopecc']);

export const removeAuthData = (): void => {
    removeLocalData('jwt');
    removeLocalData('id_token');
    removeLocalData('identityProvider');
    removeLocalData('code_verifier');
};

export const logout = async (setUserDetails?: (_userDetails: any) => void): Promise<void> => {
    try {
        const identityProvider = getLocalData('identityProvider');

        if (identityProvider && CREDENTIALS_BASED_PROVIDERS.has(identityProvider)) {
            // b.well App / client-credentials auth are direct credentials POSTs with no
            // OIDC end-session endpoint - just clear local state instead of building a logout URL.
            removeAuthData();
            if (setUserDetails) {
                setUserDetails(null);
            }
            window.location.replace(window.location.origin);
            return;
        }

        if (identityProvider) {
            const authService: IAuthService = AuthServiceFactory.getAuthService();
            // Construct full logout URL
            const logoutUrl: string = await authService.getLogoutUrlAsync(identityProvider);

            // Clear local storage and user details
            removeAuthData();

            // Clear user context
            if (setUserDetails) {
                setUserDetails(null);
            }

            // Redirect to identity provider logout
            window.location.replace(logoutUrl);
        }
        else {
            // If no identity provider is set, just clear local storage and redirect to home
            removeAuthData();
            if (setUserDetails) {
                setUserDetails(null);
            }
            window.location.replace(window.location.origin);
        }
    } catch (error) {
        console.error('Logout failed', error);

        // Fallback logout
        removeAuthData();

        if (setUserDetails) {
            setUserDetails(null);
        }

        // Redirect to home or login page
        window.location.replace(window.location.origin);
    }
};
