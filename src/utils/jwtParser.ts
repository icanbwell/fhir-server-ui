import { InvalidTokenError, jwtDecode } from 'jwt-decode';
import { getLocalData } from './localData.utils';
import { TUserDetails } from '../types/baseTypes';

export const jwtParser = ({
    customGroup,
    customScope,
}: {
    customGroup: string | undefined;
    customScope: string | undefined;
}): TUserDetails => {
    const token: string | null = getLocalData('jwt');
    if (!token) {
        return {};
    }
    try {
        // calculating scope
        const decodedToken: any = jwtDecode(token);
        let scope: string =
            (decodedToken.scope ? decodedToken.scope : decodedToken[`${customScope}`]) || '';
        scope =
            scope +
            (decodedToken[`${customGroup}`] ? decodedToken[`${customGroup}`] : []).join(' ');

        // checking admin scopes
        const isAdmin: boolean = scope.split(' ').some((s) => s.startsWith('admin/'));

        return {
            scope,
            username: decodedToken.username,
            isAdmin,
        };
    } catch (err) {
        if (err instanceof InvalidTokenError) {
            return {};
        }
        throw err;
    }
};
