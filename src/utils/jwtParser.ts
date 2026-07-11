import { InvalidTokenError, jwtDecode } from 'jwt-decode';
import { getLocalData } from './localData.utils';
import { TUserDetails } from '../types/baseTypes';
import AuthUrlProvider from './authUrlProvider';
import { removeAuthData } from './auth.utils';

export const jwtParser = (): TUserDetails | null => {
    const identityProvider = getLocalData('identityProvider');
    if (!identityProvider) {
        return null; // no identity provider has been chosen by the user yet
    }
    let authInfo;
    try {
        authInfo = new AuthUrlProvider().getAuthInfo(identityProvider);
    } catch {
        // the stored identityProvider isn't configured in this environment (e.g. stale
        // localStorage from a different env) - treat it like an invalid session
        removeAuthData();
        return null;
    }
    const token = getLocalData(authInfo.tokenForUserDetails || 'jwt');
    if (!token) {
        return null;
    }
    try {
        // calculating scope
        const decodedToken: any = jwtDecode(token);

        if (decodedToken.exp < new Date().getTime() / 1000) {
            // Clear local storage and user details
            removeAuthData();
            return null;
        }
        let scope: string =
            (decodedToken.scope ? decodedToken.scope : decodedToken[`${authInfo.customScope}`]) ||
            '';

        // split customGroup into a string array on comma
        const customGroupArray: string[] = authInfo.customGroup
            ? authInfo.customGroup.split(',')
            : [];
        // see if any of the custom groups are in the token
        const groupsInToken: string[] = customGroupArray
            .map((group) => decodedToken[`${group}`] || null)
            .filter((g) => g !== null);
        // adding custom groups to the scope
        scope = (scope ? scope + ' ' : '') + groupsInToken.join(' ');

        scope = scope.replace(/,/g, ' '); // replace commas with spaces

        // remove any prefixes from the scope
        if (authInfo.scopeRemovePrefix !== undefined) {
            let scopes = scope.split(' ').map(
                (s) => {
                    for (const prefix of authInfo.scopeRemovePrefix ?? []) {
                        if (s.startsWith(prefix)) {
                            return s.substring(prefix.length);
                        }
                    }
                    return s;
                }
            );
            scope = scopes.join(' ');
        }

        // checking admin scopes
        const isAdmin: boolean = scope.split(' ').some((s) => s.startsWith('admin/'));

        // check if any of the custom usernames are in the token
        const customUserNameArray: string[] = authInfo.customUserName
            ? authInfo.customUserName.split(',')
            : [];
        // see if any of the custom groups are in the token
        const userNameInToken: string | undefined = customUserNameArray
            .map((group) => decodedToken[`${group}`] || null)
            .filter((u) => u !== null)
            .pop();

        return {
            scope,
            username: userNameInToken || decodedToken.username,
            isAdmin,
        };
    } catch (err) {
        if (err instanceof InvalidTokenError) {
            return null;
        }
        throw err;
    }
};
