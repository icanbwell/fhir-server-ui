import { getLocalData } from './localData.utils';

// The only identityProvider values whose session token can pass ATS's get_service_user
// guard (service-authenticated endpoints) — see docs/superpowers/specs/
// 2026-08-09-connections-other-logins-design.md's "Auth model research" section. Neither
// 'clientcredentials' nor any other single string is ever actually stored as
// identityProvider for a client-credentials login — ClientCredentialsLogin.tsx stores
// 'cognitocc' or 'descopecc' depending on which backend the user picks in that flow.
//
// 'okta' is deliberately excluded even though ATS's issuer allow-list technically covers it:
// unlike cognitocc/descopecc, 'okta' is also the identityProvider value set by this app's
// ordinary interactive Okta member login (AuthServiceFactory.ts), and there's no separate
// client-credentials-style Okta provider to distinguish the two. Until ATS's
// OKTA_EXPECTED_CIDS allow-list is extended to reject this app's interactive Okta client id,
// including 'okta' here would let an interactive-Okta session pass this check, hit the
// on-behalf-of endpoints, get a 401 from ATS's cid check, and trigger a full app logout via
// BaseApi.handleUnauthorized. Re-add it once that allow-list change ships.
const SERVICE_AUTHENTICATED_PROVIDERS = new Set(['cognitocc', 'descopecc']);

export const canUseServiceAuth = (): boolean =>
    SERVICE_AUTHENTICATED_PROVIDERS.has(getLocalData('identityProvider') ?? '');
