# Client Credentials Auth (Cognito + Descope) — Design

## Problem

`fhir-server.ui` currently supports four login options, all interactive and
human-facing: Okta and Cognito (OIDC/PKCE redirect flows, via
`AuthServiceFactory`/`IAuthService`), and "Sign In With b.well App" (a direct
credentials-form POST, added in the previous PR). There is no way for a
developer to obtain a token to test against the FHIR server without going
through one of those human login flows.

Developers want to authenticate with a plain **client ID + client secret**
against either Cognito or Descope — the standard OAuth2 `client_credentials`
grant, used for machine-to-machine (M2M) auth with no human user involved.

This is architecturally different from every existing flow in this app:
OAuth2 `client_credentials` requires a `client_secret`, whereas the existing
PKCE flows are deliberately public-client/secret-free, and the b.well App
flow's `clientkey` is a tenant identifier, not a credential that grants
standing access. This repo is a pure Vite/React SPA with no backend — and
critically, Vite inlines every `REACT_APP_*` env var into the built JS bundle
at build time. A `client_secret` baked into any env var would ship in the
bundle served to every browser, permanently and publicly. **Decided:**
neither `client_id` nor `client_secret` is ever sourced from config — both
are typed fresh into a form by the developer every session, never persisted
to localStorage or env, never pre-filled.

## Goal

Add a fifth login option, "Login with Client Credentials," that lets a
developer pick a provider (Cognito or Descope), type in a client ID and
client secret (and optionally a scope), and get a token the same way the
other direct-POST flows do — landing in the same authenticated end-state
(`jwt` + `identityProvider` in localStorage, `UserContext` populated) so the
rest of the app (FHIR calls via `BaseApi`, logout) works unmodified.

## Non-goals

- Storing or pre-filling `client_id`/`client_secret` from any config source.
- A backend/proxy service — this stays a direct browser-to-token-endpoint
  POST, matching the b.well App PR's precedent.
- Building this for end users — it's dev/test tooling. The `/client-credentials-login`
  route itself is registered unconditionally in `App.tsx` (matching
  `/bwell-login`'s existing precedent) and is reachable by direct URL
  regardless of the picker. The effective gate per environment is two-fold:
  omitting `clientcredentials` from `REACT_APP_AUTH_PROVIDERS` hides the
  picker button, and leaving `REACT_APP_AUTH_COGNITOCC_TOKEN_URL`/
  `REACT_APP_AUTH_DESCOPECC_TOKEN_URL` unset makes the page itself refuse to
  submit (it renders an on-page config error instead of the form) even if
  someone navigates to it directly.
- Reusing the existing `cognito` OIDC provider's app client — AWS Cognito
  requires a distinct, confidential app client for `client_credentials`
  (cannot share the public PKCE client already configured as `fhir-ui`).

## Research: both providers are genuinely standard OAuth2 (verified against real docs, not assumed)

**Cognito** (verified against [AWS's token endpoint docs](https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html)):
```
POST https://{domain}/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={id}&client_secret={secret}&scope={scope}
```
Response: `{"access_token": "...", "token_type": "Bearer", "expires_in": 3600}`
(no `id_token`/`refresh_token` for this grant). Errors are HTTP 400 with a
body like `{"error": "invalid_client"}` (not 401).

**Descope** has two separate M2M mechanisms — verified against
[Descope's OIDC endpoints docs](https://docs.descope.com/getting-started/oidc-endpoints)
and [Inbound Apps docs](https://docs.descope.com/identity-federation/inbound-apps/using-inbound-apps):
1. **Access Keys** (project-level): HTTP Basic auth with
   `base64(ProjectID:AccessKey)` against `{BASE_URL}/oauth2/v1/token`. The
   "Client ID" here is actually the Descope Project ID, shared across the
   whole project, not a distinct registered app.
2. **Inbound Apps** (what this design uses): creating an Inbound App gives a
   genuine, distinct `client_id`/`client_secret` pair. Token endpoint:
   ```
   POST {BASE_URL}/oauth2/v1/apps/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=client_credentials&client_id={id}&client_secret={secret}&scope={scope}
   ```
   Response: `{"access_token": "...", "token_type": "Bearer", "expires_in": 3600, "refresh_token": "...", "id_token": "..."}`.

Inbound Apps is the mechanism this design uses — it's the one that actually
matches "log in with a client ID and client secret," and it's genuinely
OAuth2-standard, same shape as Cognito's `client_secret_post` variant.

**Consequence:** since both providers use the identical request/response
shape, this design uses **one shared function**, not provider-specific
services — the "provider" selection only picks which token URL (and other
per-provider config) to use, not different request logic.

## Existing precedent / lessons applied from the b.well App PR

The b.well App PR ([`docs/superpowers/specs/2026-08-05-bwell-app-auth-design.md`](2026-08-05-bwell-app-auth-design.md))
established the "standalone credentials-form, bypass `AuthServiceFactory`"
pattern this design reuses directly. Its final whole-branch review also
surfaced three defects that are designed in from the start here instead of
being caught after the fact:
1. Never log the raw error/request config on failure (it can contain the
   submitted secret) — log only `{ message, status }`.
2. After a successful token fetch, `jwtParser()` can return `null` (bad
   token, or a missing per-provider env var causing `getAuthInfo` to throw,
   which itself wipes the just-written localStorage). Check for `null` and
   show an error instead of silently navigating back to the picker.
3. Prefer the API's own error message; treat 400/401/403 as credential
   rejection (Cognito's real error response is 400, not 401 — don't assume
   401 the way the b.well App PR initially did); reserve the generic
   "unable to sign in" message for no-response/network failures.

Also applied proactively: `removeAuthData()` before writing the new session
(clears stale prior-provider localStorage keys), clearing the password field
on failure, and failing fast on missing config at render time rather than
only after a submit attempt — all patterns the b.well App PR's final review
added reactively; this design includes them from the start.

## Design

### 1. Config — new env vars, one block per provider

```
REACT_APP_AUTH_PROVIDERS='cognito,okta,bwellapp,clientcredentials'

# Cognito client-credentials provider (distinct app client from `cognito`'s PKCE client)
REACT_APP_AUTH_COGNITOCC_TOKEN_URL='https://<domain>.auth.<region>.amazoncognito.com/oauth2/token'
REACT_APP_AUTH_COGNITOCC_CUSTOM_USERNAME='client_id'   # placeholder — see Open Questions
REACT_APP_AUTH_COGNITOCC_CUSTOM_GROUP='scope'          # placeholder — see Open Questions
REACT_APP_AUTH_COGNITOCC_CUSTOM_SCOPE='scope'
REACT_APP_AUTH_COGNITOCC_CLIENT_ID='cognitocc'         # required by getAuthInfo(); unused by this flow (real client_id is typed per-session)
REACT_APP_AUTH_COGNITOCC_TOKEN_FOR_USER_DETAILS='jwt'
REACT_APP_AUTH_COGNITOCC_TOKEN_TO_SEND_TO_FHIR_SERVER='jwt'

# Descope client-credentials provider (Inbound App token endpoint)
REACT_APP_AUTH_DESCOPECC_TOKEN_URL='https://api.descope.com/oauth2/v1/apps/token'
REACT_APP_AUTH_DESCOPECC_CUSTOM_USERNAME='client_id'   # placeholder — see Open Questions
REACT_APP_AUTH_DESCOPECC_CUSTOM_GROUP='scope'          # placeholder — see Open Questions
REACT_APP_AUTH_DESCOPECC_CUSTOM_SCOPE='scope'
REACT_APP_AUTH_DESCOPECC_CLIENT_ID='descopecc'         # required by getAuthInfo(); unused by this flow
REACT_APP_AUTH_DESCOPECC_TOKEN_FOR_USER_DETAILS='jwt'
REACT_APP_AUTH_DESCOPECC_TOKEN_TO_SEND_TO_FHIR_SERVER='jwt'
```

No `client_id`/`client_secret` config anywhere — those are always the form's
runtime values, per the Problem section's decision.

### 2. `src/services/ClientCredentialsAuthService.ts` (new)

One shared function, since both providers use the identical OAuth2 shape:

```ts
export async function getClientCredentialsToken(
    tokenUrl: string,
    clientId: string,
    clientSecret: string,
    scope?: string
): Promise<string> {
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
    });
    if (scope) {
        body.append('scope', scope);
    }

    const response = await axios.post(tokenUrl, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const accessToken = response.data?.access_token;
    if (!accessToken) {
        throw new Error('Token endpoint did not return an access token');
    }
    return accessToken;
}
```

Bare `axios.post`, not through `BaseApi`/`FhirApi` — same reasoning as
`BwellAppAuthService`: different host, no Bearer-token interceptor needed at
token-fetch time.

### 3. `src/pages/ClientCredentialsLogin.tsx` (new)

Page shell matching `BwellAppLogin.tsx`'s structure:

- Provider `<Select>`: "Cognito" / "Descope", mapping to `identityProvider`
  key `cognitocc` / `descopecc` and the corresponding
  `REACT_APP_AUTH_<PROVIDER>_TOKEN_URL`.
- Client ID `<TextField>`, Client Secret `<TextField type="password">`,
  optional Scope `<TextField>` (useful since both providers' client_credentials
  tokens are scoped to resource-server permissions the FHIR server may
  require).
- Config fail-fast: the provider `<Select>` is always rendered (so switching
  providers is never blocked); if the selected provider's `TOKEN_URL` env var
  is missing, render an on-page config error in place of the credential
  fields and submit button below the Select, instead of hiding the whole
  form.
- On submit: `getClientCredentialsToken(tokenUrl, clientId, clientSecret,
  scope)`. On success: `removeAuthData()`, then `setLocalData('jwt',
  accessToken)`, `setLocalData('identityProvider', selectedProviderKey)`,
  then `jwtParser()` — if `null`, show an error and stop; otherwise
  `setUserDetails(...)` and `navigate(resourceUrl)`.
- On failure: log only `{ message, status }` (never the raw error/config).
  Treat 400/401/403 as credential rejection — show
  `loginError?.response?.data?.error_description ??
  loginError?.response?.data?.error ?? 'Invalid client ID or client secret.'`.
  Otherwise show the generic "Unable to sign in right now. Please try
  again." Clear the password field in all failure cases.

### 4. `src/pages/IdentityProviderSelection.tsx` / `src/App.tsx`

Same pattern as `bwellapp`: clicking "Login with Client Credentials"
navigates to `/client-credentials-login` with `resourceUrl` in router state,
instead of the OIDC path. Route registered next to `/authcallback` and
`/bwell-login` in `App.tsx`, outside the authenticated-gate `Outlet`.

### 5. `src/utils/auth.utils.ts` — generalize the non-OIDC logout check

The b.well App PR added a single hardcoded `identityProvider === 'bwellapp'`
branch in `logout()`. This design now has three non-OIDC providers
(`bwellapp`, `cognitocc`, `descopecc`), so the check generalizes to a set
instead of growing a third copy-pasted branch:

```ts
const CREDENTIALS_BASED_PROVIDERS = new Set(['bwellapp', 'cognitocc', 'descopecc']);

// ...
if (identityProvider && CREDENTIALS_BASED_PROVIDERS.has(identityProvider)) {
    removeAuthData();
    if (setUserDetails) {
        setUserDetails(null);
    }
    window.location.replace(window.location.origin);
    return;
}
```

## Security

- `client_id`/`client_secret` are never in config, localStorage, or logs —
  only ever in React component state during an active form submission.
- Unlike the b.well App PR's `clientkey` (a tenant identifier, fine to be
  public), a leaked `client_secret` here would grant standing, indefinite
  access to mint tokens as that client. Because it's never baked into the
  build, the only exposure surface is the developer's own browser
  session/devtools — same trust model as pasting a secret into Postman or
  curl.
- This is dev/test tooling: the mitigation is *not shipping it* rather than
  hardening it further — omit `clientcredentials` from
  `REACT_APP_AUTH_PROVIDERS` in any production environment's config.

## Testing

No automated test suite exists in this repo (unchanged from the b.well App
PR). Manual verification per task, described in the implementation plan.

## Open questions

1. **JWT claim names for the "identity" display**: neither Cognito's nor
   Descope's client_credentials access tokens have a human username claim —
   `CUSTOM_USERNAME`/`CUSTOM_GROUP` above are placeholders (`client_id`,
   `scope`) guessed from each provider's documented token shape, not
   verified against a real issued token. Needs confirmation before this is
   fully correct; until then, the username shown in the UI after a
   client-credentials login may be blank or incorrect even though the login
   itself succeeded.
2. **Cognito operational prerequisite**: a second, confidential Cognito app
   client (distinct from `fhir-ui`) must be provisioned in the same user
   pool, with `client_credentials` grant enabled and scoped to whatever
   resource-server scopes are needed to call the FHIR server — an
   out-of-repo dependency for whoever administers the Cognito user pool.
3. **Descope operational prerequisite**: an Inbound App must be created in
   the Descope console for this to work at all — also out-of-repo.
