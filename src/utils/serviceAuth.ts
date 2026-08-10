import { getLocalData } from './localData.utils';

// The only identityProvider values whose session token can pass ATS's get_service_user
// guard (service-authenticated endpoints) — see docs/superpowers/specs/
// 2026-08-09-connections-other-logins-design.md's "Auth model research" section. Neither
// 'clientcredentials' nor any other single string is ever actually stored as
// identityProvider for a client-credentials login — ClientCredentialsLogin.tsx stores
// 'cognitocc' or 'descopecc' depending on which backend the user picks in that flow.
const SERVICE_AUTHENTICATED_PROVIDERS = new Set(['cognitocc', 'descopecc', 'okta']);

export const canUseServiceAuth = (): boolean =>
    SERVICE_AUTHENTICATED_PROVIDERS.has(getLocalData('identityProvider') ?? '');
