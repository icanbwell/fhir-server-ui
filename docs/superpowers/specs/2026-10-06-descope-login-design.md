# Sign In With b.well App on Descope Environments — Design

Status: DRAFT for review. Ticket: BAI-1053.

## Problem

On dev, "Sign In With b.well App" (`/bwell-login`, `src/pages/BwellAppLogin.tsx`) fails with
"Unable to sign in right now. Please try again." for valid dev accounts.

Evidence (2026-10-06, `fhir-ui.dev.bwell.zone`):

- The browser's `POST https://api.dev.icanbwell.com/identity/account/login` returns HTTP 500
  `{"statusCode":500,"message":"Internal server error"}`.
- `BwellAppLogin.tsx` only treats 400/401/403 as credential errors, so any other status shows
  the generic message.
- The same account signs in successfully on `https://app.dev.icanbwell.com`. That app signs in
  through a Descope flow (`POST auth.dev.icanbwell.com/v1/flow/start`, `/v1/flow/next`, project
  `P34WYrxC5FleySBOZksaRHN1szsA`) and never calls `/identity/account/login`.
- Ruled out: the host (`api.dev` and `api-gateway.dev` behave the same), CORS, and the client
  key (`Dev=…` is accepted; a junk or missing key returns a clean 400).

Dev's tenant moved to Descope. `BwellAppAuthService.login` still uses the legacy password
endpoint, which does not work for those users. Likely cause, not proven: Descope users are not
served by that endpoint.

Other environments (staging, client-sandbox, prod) are still on the legacy identity service
and still work with the existing form. Any fix has to keep them working and let each environment
move to Descope independently.

## How the b.well app logs in today (ui-platform, `apps/composite`)

- `DescopeLogin.tsx` renders `<Descope flowId=… />` from `@descope/react-sdk` in the page. The
  flow ID comes from the client's login config (flow named `login`, else the first), default
  `bwell-parent-flow`, overridable by query parameter. The tenant comes from provider config.
- On success it reads Descope's session JWT and refresh token and calls
  `bwell.setUserSession({ accessToken: sessionJwt, idToken: sessionJwt, refreshToken })`.
  The b.well SDK accepts the Descope session JWT as the access token.

## Goal

Let a Descope environment sign in to `fhir-server-ui` the way the b.well app does, as a new
provider next to the legacy `bwellapp`, chosen per environment in Helm values. End state
matches today's: a `jwt` in localStorage, `identityProvider` set, and `UserContext` populated, so
`BaseApi`, logout and admin-scope checks work unchanged.

## Non-goals

- Changing legacy environments' behavior.
- Fixing the identity service's 500 for failed logins (separate request to its owner).
- Replacing Okta or the client-credentials providers.

## Proposed design

### New provider `bwelldescope`

- Add `bwelldescope` to `CREDENTIALS_BASED_PROVIDERS`-style handling in `src/utils/auth.utils.ts`
  (no redirect; sign-in happens in the page), a label and route (`/bwell-descope-login`) in
  `src/pages/IdentityProviderSelection.tsx` and `src/App.tsx`.
- New page `src/pages/BwellDescopeLogin.tsx` renders `<Descope>` with:
  - project ID from `REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID`,
  - flow ID from `REACT_APP_AUTH_BWELLDESCOPE_FLOW_ID` (default `bwell-parent-flow`),
  - optional tenant from `REACT_APP_AUTH_BWELLDESCOPE_TENANT_ID`,
  - optional custom base URL from `REACT_APP_AUTH_BWELLDESCOPE_BASE_URL`
    (dev uses `auth.dev.icanbwell.com`).
- On success: `removeAuthData()`, store the Descope session JWT as `jwt`, set
  `identityProvider` to `bwelldescope`, call `jwtParser()`, set `UserContext`, navigate to the
  requested resource. Failure branches mirror `BwellAppLogin` (clear error message, no token left
  behind).
- `AuthUrlProvider.getAuthInfo('bwelldescope')` must not throw; it is called by `jwtParser()` and
  by `BaseApi`'s request interceptor on every FHIR call. Provide the same
  `REACT_APP_AUTH_BWELLDESCOPE_{CUSTOM_USERNAME,CUSTOM_GROUP,CUSTOM_SCOPE,CLIENT_ID,TOKEN_FOR_USER_DETAILS}`
  block that `bwellapp` has.
- Session refresh: Descope session JWTs are short-lived. Decide whether to keep the refresh token
  and call the Descope SDK's refresh (as ui-platform does), or require re-login on expiry as the
  legacy flow does. Default for the first version: re-login on expiry, same as today.
- Logout: the page configures the Descope SDK not to persist tokens or the last-authenticated
  user, so the refresh token is never stored in the browser and there is nothing to revoke in
  v1. Logout clears `jwt`, `identityProvider` and any Descope keys (`DS`, `DSR`,
  `dls_last_user_*`) as defense in depth.

### Per-environment selection (no environment checks in code)

`REACT_APP_AUTH_PROVIDERS` in each environment's Helm values decides what the picker shows:

| Environment | `REACT_APP_AUTH_PROVIDERS` change |
|---|---|
| dev | replace `bwellapp` with `bwelldescope` |
| staging, client-sandbox, prod | unchanged (`bwellapp` stays) |

Each environment migrates by a one-line change plus the `REACT_APP_AUTH_BWELLDESCOPE_*` values in
`bwell-fhir-server-ui/.helm/fhir-server-ui/<env>.values.yaml`. Config is read at container start,
so no rebuild is needed. `fhir-proa-server-ui` dev has the same `api.dev` value; migrate it
separately only if it is reported failing.

The UI does not try legacy first and fall back to Descope: the legacy endpoint returns a 500
rather than a clean 4xx, so the UI cannot tell "wrong password" from "wrong system".

### What stays the same

`bwellapp` page, service, tests and config. The `Tenant` dropdown stays on the legacy form.

## Alternatives considered

1. **Form posts to Descope's password sign-in REST endpoint.** Keeps the current form, but works
   only if password sign-in is enabled for the project; the b.well app uses a flow that may
   include other steps (MFA, custom screens). Rejected for the first version; revisit if the
   embedded component is unacceptable in this UI.
2. **A new identity API route that accepts email and password for Descope users.** Smallest UI
   change, but requires the identity service owner to provide it; no such route was found
   (`identity/admin/bootstrap` and `identity/admin/token` are the only identity calls seen).
3. **OIDC redirect (Descope Inbound App, like Okta/Cognito).** Changes the sign-in experience
   from an in-page form to a redirect, which does not match how b.well App login behaves.
   Rejected.
4. **Fall back from legacy to Descope in one provider.** Rejected, see above.

## Risks and open questions (not verified)

1. **FHIR server trust.** Does `fhir.dev.bwell.zone` accept a Descope session JWT, and which
   issuer/JWKS does it trust? If not, sign-in will succeed and FHIR requests will 401. This is the
   dev JWKS change reported at the start of this work. Needs the FHIR server owner.
2. **Claims.** Which claims the Descope session JWT carries for username, groups and scope; the
   `jwtParser` settings above depend on it (legacy dev uses `cognito:username`, `cognito:groups`,
   `custom:scope`).
3. **Descope project config.** Project ID, flow ID and tenant for `fhir-ui` (is
   `bwell-parent-flow` correct?), and that the flow is allowed from the `fhir-ui.dev.bwell.zone`
   and `fhir-ui.dev-use1.bwell.zone` origins (Descope approved domains / CORS).
4. **Dependency approval.** `@descope/react-sdk` is new to this repo's `package.json` but already
   used elsewhere in icanbwell: ui-platform (`^2.30.9`, the range this design uses) and the
   kill-the-clipboard-scanner frontends. None of the `policies/approved-tech.yaml` copies checked
   (including `bwell-fhir-server-ui`) list Descope. The org rule is to check `approved-tech.yaml`
   before adding a significant library, so ask EA whether existing org use is enough or a Tech
   Design Review is still needed. Dependencies here resolve through JFrog via the
   `bwell-fhir-server-ui` wrapper repo, so the package must be available there.
5. **Tenant concept.** The legacy form's `Tenant` is a client key. How a Descope tenant or flow
   maps to it for this UI is undecided.
6. **Session lifetime and refresh** (see above).
7. **CSP.** The Descope component loads from `descopecdn.com` / `static.descope.com`
   (and `auth.dev.icanbwell.com`). `nginx.conf` CSP headers, if set, must allow them.

## Testing

- Unit: page renders, success path stores `jwt`, sets `identityProvider`, populates
  `UserContext`; failure paths clear state; `AuthUrlProvider.getAuthInfo('bwelldescope')`;
  provider list gating via `REACT_APP_AUTH_PROVIDERS`.
- Manual on dev after deploy: sign in with a Descope dev account, confirm FHIR requests succeed
  (not 401), logout clears Descope session storage.
- Regression: `bwellapp` flow unchanged in a legacy environment.

## Rollout

1. Resolve open questions 1–4.
2. Implement behind the provider list (no behavior change anywhere until an environment lists
   `bwelldescope`).
3. Enable on dev; verify.
4. Migrate other environments individually as they move to Descope.

## References

- BAI-1053 (diagnosis and evidence).
- ui-platform `apps/composite/src/app/components/DescopeLogin.tsx`, `apps/composite/src/bwellInitRecovery.ts`.
- `docs/superpowers/specs/2026-08-05-bwell-app-auth-design.md` (existing b.well App login).
