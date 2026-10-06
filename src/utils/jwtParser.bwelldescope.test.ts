import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_ENV } from '../runtimeEnv';
import { jwtParser } from './jwtParser';

let envSnapshot: Record<string, string | undefined>;

describe('jwtParser with unconfigured bwelldescope', () => {
    beforeEach(() => {
        envSnapshot = { ...APP_ENV };
        localStorage.clear();
        sessionStorage.clear();
        // Ensure bwelldescope is not configured in this environment
        Reflect.deleteProperty(APP_ENV, 'REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID');
        Reflect.deleteProperty(APP_ENV, 'REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_USERNAME');
        Reflect.deleteProperty(APP_ENV, 'REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_SCOPE');
    });

    afterEach(() => {
        localStorage.clear();
        Object.keys(APP_ENV).forEach((key) => Reflect.deleteProperty(APP_ENV, key));
        Object.assign(APP_ENV, envSnapshot);
    });

    it('clears a stored bwelldescope provider that this environment does not configure', () => {
        localStorage.setItem('identityProvider', 'bwelldescope');
        localStorage.setItem('jwt', 'whatever');
        expect(jwtParser()).toBeNull();
        expect(localStorage.getItem('identityProvider')).toBeNull();
        expect(localStorage.getItem('jwt')).toBeNull();
    });

    it('clears the Descope keys too when a stored bwelldescope token has expired', () => {
        Object.assign(APP_ENV, {
            REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_USERNAME: 'email',
            REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_GROUP: 'roles',
            REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_SCOPE: 'scope',
            REACT_APP_AUTH_BWELLDESCOPE_CLIENT_ID: 'bwelldescope',
            REACT_APP_AUTH_BWELLDESCOPE_TOKEN_FOR_USER_DETAILS: 'jwt',
        });
        const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=/g, '');
        const expired = `${encode({ alg: 'none' })}.${encode({ exp: 1, email: 'user@example.com' })}.sig`;
        localStorage.setItem('identityProvider', 'bwelldescope');
        localStorage.setItem('jwt', expired);
        localStorage.setItem('dls_last_user_login_id', 'user@example.com');
        sessionStorage.setItem('dls_last_submitted_login_id', 'user@example.com');

        expect(jwtParser()).toBeNull();

        expect(localStorage.getItem('jwt')).toBeNull();
        expect(localStorage.getItem('dls_last_user_login_id')).toBeNull();
        expect(sessionStorage.getItem('dls_last_submitted_login_id')).toBeNull();
    });
});
