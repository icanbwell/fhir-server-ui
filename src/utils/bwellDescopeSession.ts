import { TUserDetails } from '../types/baseTypes';
import { removeAuthData } from './auth.utils';
import { BWELL_DESCOPE_PROVIDER } from './bwellDescopeConfig';
import { clearDescopeStorage } from './descopeStorage';
import { jwtParser } from './jwtParser';
import { setLocalData } from './localData.utils';

export const completeBwellDescopeLogin = (sessionJwt: string | undefined): TUserDetails | null => {
    if (!sessionJwt) {
        return null;
    }
    removeAuthData();
    clearDescopeStorage();
    setLocalData('jwt', sessionJwt);
    setLocalData('identityProvider', BWELL_DESCOPE_PROVIDER);
    const userDetails = jwtParser();
    if (!userDetails) {
        removeAuthData();
        return null;
    }
    return userDetails;
};
