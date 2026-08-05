# Sign In With b.well App — Design

## Problem

`fhir-server.ui` currently supports two identity providers, both OIDC/PKCE
authorization-code flows: Okta (`src/services/OktaAuthService.ts`) and Cognito
(`src/services/CognitoAuthService.ts`), selected via a strategy factory
(`src/services/AuthServiceFactory.ts`) and rendered as a list of buttons on
`src/pages/IdentityProviderSelection.tsx`.

There used to be a third provider, `bwell` — not a distinct auth mechanism, just a
b.well-owned Cognito user pool reusing `CognitoAuthService`. Its factory case was
removed in commit `14a2f67` ("Remove bwell case from AuthServiceFactory"), but the
env vars (`REACT_APP_AUTH_BWELL_*`) and the `bwell` entry in
`REACT_APP_AUTH_PROVIDERS` were left in `.env`. The picker currently still renders a
"Login with Bwell" button that throws `Unsupported identity provider: bwell` when
clicked — a pre-existing bug this design incidentally fixes.

We want a genuinely new option: "Sign in with b.well App", matching what
`baileyai-skills-service` calls the same thing. There, despite the name, it is **not**
a mobile-app deep-link/QR/push flow — it's a credentials-form (email + password) that
the backend proxies to `POST {BWELL_API_BASE_URL}/identity/account/login` with a
`clientkey` header, returning a JWT (`accessToken.jwtToken`). It's wired via an
`AuthMethodProvider` strategy registry, and the frontend renders a client (tenant)
dropdown sourced from `BWELL_CLIENT_KEYS` when multiple tenants are configured.

`fhir-server.ui` has no backend of its own (pure Vite/React SPA — confirmed via
`package.json` and repo structure), so the credentials POST has to happen directly
from the browser rather than through a proxy like baileyai's `AppLoginManager`.

## Goal

Add "Login with b.well App" as a fourth option on the identity provider picker. It
collects email + password (+ tenant selection when multiple client keys are
configured) and authenticates directly against the b.well identity API from the
browser, producing the same end state as the existing OIDC flows: a `jwt` in
localStorage, `identityProvider` set, and `UserContext` populated — so every other
part of the app (FHIR API calls via `BaseApi`, logout, admin-scope checks) keeps
working unmodified.

## Non-goals

- Building an actual mobile-app deep-link/QR-code/push-notification flow. The label
  says "b.well App" but, per baileyai's implementation, the mechanism is a plain
  credentials POST — we're matching that, not inventing the deep-link flow the name
  might suggest.
- Adding a backend/proxy service to this repo. Decided: call the b.well identity API
  directly from the browser.
- A generic pluggable auth-provider registry (like baileyai's `AuthMethodRegistry`).
  With only one non-OIDC provider, forcing it through a new abstraction layer is not
  justified — see "Existing abstractions, deliberately untouched" below.
- Editing/removing the Okta or Cognito flows.

## Existing precedent / abstractions, deliberately untouched

- `IAuthService` (`src/services/IAuthService.ts`) is OIDC/PKCE-shaped:
  `getLoginUrlAsync` (build a redirect URL), `fetchTokenAsync` (exchange an
  authorization `code` for tokens), `getLogoutUrlAsync`. A credentials POST has no
  redirect and no `code` — shoehorning it into this interface would distort the
  abstraction for a single caller. `AuthServiceFactory.ts` is **not modified**; the
  new flow bypasses it entirely.
- `AuthUrlProvider.getAuthInfo(provider)` (`src/utils/authUrlProvider.ts`) is a
  provider-keyed config resolver used in two places that matter here even though the
  new flow skips OIDC:
  - `jwtParser()` (`src/utils/jwtParser.ts`) calls it to know which claims to read
    (`customUserName`, `customGroup`, `customScope`) and which stored token
    (`tokenForUserDetails`) to decode.
  - `BaseApi.requestInterceptor` (`src/api/baseApi.ts:108-116`) calls it on **every**
    FHIR API request to decide which stored token (`tokenToSendToFhirServer`) to send
    as the `Authorization` header.

  Both throw if the five required keys
  (`CUSTOM_USERNAME`/`CUSTOM_GROUP`/`CUSTOM_SCOPE`/`CLIENT_ID`/`TOKEN_FOR_USER_DETAILS`)
  aren't defined for the given provider prefix. **This means the new provider still
  needs a full `REACT_APP_AUTH_BWELLAPP_*` config block even though it never touches
  `getAuthUrlsAsync` (the OIDC-URL half of the same class)** — otherwise every FHIR
  request after a successful b.well-app login throws inside the axios interceptor.

## Design

### 1. Config — new env vars (replace the dangling `bwell` ones)

In `.env` (and equivalent docker-compose/env-doc files):

```
REACT_APP_AUTH_PROVIDERS='cognito,okta,bwellapp'   # was '...,bwell'

# b.well App provider
REACT_APP_AUTH_BWELLAPP_BASE_URL='https://api.dev.icanbwell.com'
REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS='Default=<client-key>'   # comma-separated Name=key pairs
REACT_APP_AUTH_BWELLAPP_CUSTOM_USERNAME='cognito:username'   # placeholder — see Open Questions
REACT_APP_AUTH_BWELLAPP_CUSTOM_GROUP='cognito:groups'        # placeholder — see Open Questions
REACT_APP_AUTH_BWELLAPP_CUSTOM_SCOPE='custom:scope'          # placeholder — see Open Questions
REACT_APP_AUTH_BWELLAPP_CLIENT_ID='bwellapp'                 # required by getAuthInfo(); unused by this flow otherwise
REACT_APP_AUTH_BWELLAPP_TOKEN_FOR_USER_DETAILS='jwt'
REACT_APP_AUTH_BWELLAPP_TOKEN_TO_SEND_TO_FHIR_SERVER='jwt'
```

Remove `REACT_APP_AUTH_BWELL_*` (the old, dangling Cognito-pool config) as cleanup.

`REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS` format matches baileyai's
`Name=key,Name2=key2` convention and this repo's existing comma-separated-list
convention (`REACT_APP_AUTH_PROVIDERS`). Parsed client-side into `{name, key}[]` —
no separate `/bwell-clients` endpoint is needed since there's no backend to hide the
keys behind (they're tenant identifiers, not secrets — see Security below).

### 2. `src/pages/IdentityProviderSelection.tsx`

Special-case `bwellapp` in `handleProviderSelection` (or a new dedicated handler):
instead of `setLocalData('identityProvider', provider)` + navigate to
`/authcallback`, navigate to `/bwell-login` with `resourceUrl` in router state
(matching how `referringUrl` is already threaded through). Label rendering: add an
explicit case so the button reads "Login with b.well App" rather than the generic
`provider.charAt(0).toUpperCase() + provider.slice(1)` (which would render "Login
with Bwellapp").

### 3. `src/pages/BwellAppLogin.tsx` (new)

Page shell matching existing pages (`Header`/`Footer`, centered column like
`IdentityProviderSelection`). Contents:

- Parses `REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS` into a `{name, key}[]` list.
  - 0 entries → configuration error, show a message (shouldn't happen if
    `bwellapp` is in `REACT_APP_AUTH_PROVIDERS` at all).
  - 1 entry → skip the dropdown, use that key silently.
  - 2+ entries → render an MUI `<Select>` of tenant names, defaulting to the first.
- Email + password `<TextField>`s, a submit `<Button>`, and a "Back" link to
  `/select-idp`.
- `isProcessing`/`error` state mirroring `Auth.tsx`'s pattern.
- On submit: calls `BwellAppAuthService.login(email, password, selectedClientKey)`.
  - Success: `setLocalData('jwt', accessToken)`, `setLocalData('identityProvider',
    'bwellapp')`, `setUserDetails(jwtParser())`, `navigate(resourceUrl)` (from router
    state, defaulting to `/`) — same sequence `Auth.tsx`'s `fetchTokenAsync` already
    does for the OIDC flows.
  - Failure: inline error message (see Error handling below); form stays populated
    except password.

### 4. `src/services/BwellAppAuthService.ts` (new)

Plain async function, not a class implementing `IAuthService` (see "deliberately
untouched" above):

```ts
export async function login(email: string, password: string, clientKey: string): Promise<string> {
    const baseUrl = import.meta.env.REACT_APP_AUTH_BWELLAPP_BASE_URL;
    const response = await axios.post(
        `${baseUrl}/identity/account/login`,
        { email, password },
        { headers: { clientkey: clientKey } }
    );
    const jwtToken = response.data?.accessToken?.jwtToken;
    if (!jwtToken) {
        throw new Error('b.well identity API did not return an access token');
    }
    return jwtToken;
}
```

Uses a bare `axios.post`, not `BaseApi`/`FhirApi` — this call targets the b.well
identity API host, not the configured FHIR server, and must not go through
`BaseApi`'s Bearer-token request interceptor (there's no token yet at this point).

### 5. `src/App.tsx`

Register the new route: `/bwell-login` → `<BwellAppLogin />`, alongside the existing
`/select-idp` and `/authcallback` routes.

### 6. `src/utils/auth.utils.ts` — `logout()`

Current `logout()` always calls `AuthServiceFactory.getAuthService().getLogoutUrlAsync()`
and redirects to an OIDC end-session endpoint. There is no such endpoint for
`bwellapp`. Add a branch: if `identityProvider === 'bwellapp'`, skip
`AuthServiceFactory` entirely — just `removeAuthData()`, clear user context, and
`window.location.replace(window.location.origin)`, i.e. the same fallback path
already used today when no `identityProvider` is set at all.

## Error handling

- **401 (invalid credentials)**: inline form message "Invalid email or password."
- **Network error / non-401 failure**: inline form message "Unable to sign in right
  now. Please try again." No automatic retry — resubmission is user-initiated, same
  as any login form.
- **Missing/misconfigured env** (`BASE_URL` or `CLIENT_KEYS` absent): fail fast with a
  clear on-page message rather than a silent broken button, consistent with how a
  misconfigured OIDC provider currently surfaces as a thrown error in
  `AuthUrlProvider`.

## Security

- `clientkey` values ship in the frontend bundle via `REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS`.
  This is acceptable: they're tenant identifiers, not user secrets — the same trust
  model as `REACT_APP_AUTH_OKTA_CLIENT_ID` already being public in this app.
- The b.well identity API must allow CORS from this app's origin(s) for the direct
  browser POST to succeed. This is an infra/backend-side change **outside this repo**
  — flag to whoever owns `api.<env>.icanbwell.com` before this ships; if CORS can't be
  granted, the fallback is the backend-proxy alternative that was considered and
  rejected for scope reasons in this round.

## Testing

- Unit test `BwellAppAuthService.login()`: success path (extracts `jwtToken`), 401
  path (throws), malformed-response path (missing `accessToken.jwtToken`, throws).
- Component test for `BwellAppLogin.tsx`: renders dropdown only when 2+ client keys
  configured; submit disabled while `isProcessing`; error message shown on failed
  login; successful login calls `navigate` with the expected resource URL.
- Manual verification against a real dev-environment b.well identity API account
  before merging, specifically to confirm the JWT claim names (see Open Questions).

## Open questions

1. **JWT claim names**: `REACT_APP_AUTH_BWELLAPP_CUSTOM_USERNAME`/`_CUSTOM_GROUP`/
   `_CUSTOM_SCOPE` are placeholders (reused from the old `bwell` Cognito config) —
   the actual claim names issued by `POST /identity/account/login`'s JWT are not yet
   confirmed. Needs a real token from that endpoint to verify before shipping;
   otherwise `username`/`isAdmin`/scope-based UI gating may silently be wrong even
   though login "succeeds."
2. **CORS**: needs confirmation from whoever owns the b.well identity API that
   browser-origin CORS is (or can be) enabled for this app's deployed origins
   (localhost dev, staging, prod).
