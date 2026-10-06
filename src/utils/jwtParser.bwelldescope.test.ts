import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_ENV } from '../runtimeEnv';
import { jwtParser } from './jwtParser';

let envSnapshot: Record<string, string | undefined>;

describe('jwtParser with unconfigured bwelldescope', () => {
    beforeEach(() => {
        envSnapshot = { ...APP_ENV };
        localStorage.clear();
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
});
