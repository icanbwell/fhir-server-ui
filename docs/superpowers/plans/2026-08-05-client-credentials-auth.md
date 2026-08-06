# Client Credentials Auth (Cognito + Descope) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fifth login option, "Login with Client Credentials," letting developers authenticate with a client ID + client secret via standard OAuth2 `client_credentials` against Cognito or Descope, to test against the FHIR server without a full user login.

**Architecture:** A standalone credentials-form page (`/client-credentials-login`) with a provider dropdown, client ID field, client secret field, and optional scope field. On submit it POSTs form-encoded `grant_type=client_credentials` to whichever provider's token URL is selected, via one shared service function (both providers use the identical OAuth2 request/response shape — verified against real docs, not assumed). Stores the returned token exactly like the b.well App flow does, and is **not** routed through `AuthServiceFactory`/`IAuthService`.

**Tech Stack:** React 19 + TypeScript, Vite, MUI, axios, react-router-dom v7. No test framework exists in this repo — verification is manual (see each task).

**Spec:** `docs/superpowers/specs/2026-08-05-client-credentials-auth-design.md`

**Builds on:** the b.well App PR (branch `feature/bwell-app-auth`, plan `docs/superpowers/plans/2026-08-05-bwell-app-auth.md`) — this plan assumes `src/pages/BwellAppLogin.tsx`, `src/services/BwellAppAuthService.ts`, `IdentityProviderSelection.tsx`'s `PROVIDER_LABELS` pattern, and `auth.utils.ts`'s `bwellapp` logout branch already exist as written there.

## Global Constraints

- Neither `client_id` nor `client_secret` is ever sourced from env/config, written to localStorage, or logged — both are typed fresh into the form every session. Only the token endpoint URL (per provider, public/non-secret) is configurable.
- Both providers use the identical OAuth2 `client_credentials` request shape (`application/x-www-form-urlencoded`, body `grant_type=client_credentials&client_id=...&client_secret=...&scope=...`) — use one shared service function, not provider-specific functions.
- New `identityProvider` keys are `cognitocc` and `descopecc` — distinct from the existing `cognito` OIDC provider (Cognito requires a separate confidential app client for `client_credentials`).
- `AuthUrlProvider.getAuthInfo(provider)` must not throw for either new provider — it's called by `jwtParser()` and by `BaseApi`'s request interceptor on every FHIR call, so the full `CUSTOM_USERNAME`/`CUSTOM_GROUP`/`CUSTOM_SCOPE`/`CLIENT_ID`/`TOKEN_FOR_USER_DETAILS` config block is required for both, even though `CLIENT_ID` there is an unused placeholder (the real client ID is typed per-session).
- Do not modify `AuthServiceFactory.ts` or `IAuthService.ts`.
- Apply these lessons from the b.well App PR's final review **from the start**, not after review flags them:
  - Never log the raw error/request config on failure — log only `{ message, status }`.
  - After a successful token fetch, check `jwtParser()` for `null` before calling `setUserDetails`/`navigate` — show an error and stop instead of silently bouncing to the picker.
  - Treat HTTP 400/401/403 as credential rejection (Cognito's real error response is 400, not 401); prefer the API's own `error`/`error_description` field when present; reserve the generic "Unable to sign in right now" message for no-response/other failures.
  - Call `removeAuthData()` before writing the new session on success.
  - Clear the client secret field on failure.
  - Fail fast with an on-page config error when the selected provider's token URL isn't configured, rather than only surfacing after a submit attempt.
- No automated tests — this repo has zero test infrastructure. Each task has manual verification steps instead.

---

### Task 1: Environment configuration

**Files:**
- Modify: `.env`
- Modify: `docker-compose.yml`

**Interfaces:**
- Produces: `import.meta.env.REACT_APP_AUTH_COGNITOCC_TOKEN_URL`, `REACT_APP_AUTH_DESCOPECC_TOKEN_URL`, and the standard `getAuthInfo()` keys for both — consumed by Tasks 2/3 and by `AuthUrlProvider.getAuthInfo()`. `REACT_APP_AUTH_PROVIDERS` now includes `clientcredentials` — consumed by `IdentityProviderSelection.tsx` (Task 4).

- [ ] **Step 1: Edit `.env`**

Change the top provider list line from:

```
REACT_APP_AUTH_PROVIDERS='cognito,okta,bwellapp'
```

to:

```
REACT_APP_AUTH_PROVIDERS='cognito,okta,bwellapp,clientcredentials'
```

Then add two new blocks after the existing `# b.well App provider` block:

```
# Cognito client-credentials provider (distinct app client from the `cognito` PKCE client above)
REACT_APP_AUTH_COGNITOCC_TOKEN_URL='https://REPLACE_WITH_REAL_DOMAIN.auth.us-east-1.amazoncognito.com/oauth2/token'
REACT_APP_AUTH_COGNITOCC_CUSTOM_USERNAME='client_id'
REACT_APP_AUTH_COGNITOCC_CUSTOM_GROUP='scope'
REACT_APP_AUTH_COGNITOCC_CUSTOM_SCOPE='scope'
REACT_APP_AUTH_COGNITOCC_CLIENT_ID='cognitocc'
REACT_APP_AUTH_COGNITOCC_TOKEN_FOR_USER_DETAILS='jwt'
REACT_APP_AUTH_COGNITOCC_TOKEN_TO_SEND_TO_FHIR_SERVER='jwt'

# Descope client-credentials provider (Inbound App token endpoint)
REACT_APP_AUTH_DESCOPECC_TOKEN_URL='https://api.descope.com/oauth2/v1/apps/token'
REACT_APP_AUTH_DESCOPECC_CUSTOM_USERNAME='client_id'
REACT_APP_AUTH_DESCOPECC_CUSTOM_GROUP='scope'
REACT_APP_AUTH_DESCOPECC_CUSTOM_SCOPE='scope'
REACT_APP_AUTH_DESCOPECC_CLIENT_ID='descopecc'
REACT_APP_AUTH_DESCOPECC_TOKEN_FOR_USER_DETAILS='jwt'
REACT_APP_AUTH_DESCOPECC_TOKEN_TO_SEND_TO_FHIR_SERVER='jwt'
```

(`REACT_APP_AUTH_COGNITOCC_TOKEN_URL` needs a real Cognito domain from whoever provisions the second, confidential app client — `REPLACE_WITH_REAL_DOMAIN` is a placeholder, same treatment as the b.well App PR's `REPLACE_WITH_REAL_CLIENT_KEY`. `REACT_APP_AUTH_DESCOPECC_TOKEN_URL` uses Descope's documented default API host — swap it if your Descope project uses a custom/EU domain.)

- [ ] **Step 2: Edit `docker-compose.yml`**

After the existing commented-out b.well App example block (the one ending in `# REACT_APP_AUTH_BWELLAPP_TOKEN_TO_SEND_TO_FHIR_SERVER: 'jwt'`), add matching commented examples for the two new providers:

```yaml
      # To configure Cognito client-credentials sign-in, uncomment the following lines
      # and set the appropriate values, and add 'clientcredentials' to REACT_APP_AUTH_PROVIDERS
      #
      # REACT_APP_AUTH_COGNITOCC_TOKEN_URL: 'https://<domain>.auth.<region>.amazoncognito.com/oauth2/token'
      # REACT_APP_AUTH_COGNITOCC_CUSTOM_USERNAME: 'client_id'
      # REACT_APP_AUTH_COGNITOCC_CUSTOM_GROUP: 'scope'
      # REACT_APP_AUTH_COGNITOCC_CUSTOM_SCOPE: 'scope'
      # REACT_APP_AUTH_COGNITOCC_CLIENT_ID: 'cognitocc'
      # REACT_APP_AUTH_COGNITOCC_TOKEN_FOR_USER_DETAILS: 'jwt'
      # REACT_APP_AUTH_COGNITOCC_TOKEN_TO_SEND_TO_FHIR_SERVER: 'jwt'
      # To configure Descope client-credentials sign-in, uncomment the following lines
      # and set the appropriate values, and add 'clientcredentials' to REACT_APP_AUTH_PROVIDERS
      #
      # REACT_APP_AUTH_DESCOPECC_TOKEN_URL: 'https://api.descope.com/oauth2/v1/apps/token'
      # REACT_APP_AUTH_DESCOPECC_CUSTOM_USERNAME: 'client_id'
      # REACT_APP_AUTH_DESCOPECC_CUSTOM_GROUP: 'scope'
      # REACT_APP_AUTH_DESCOPECC_CUSTOM_SCOPE: 'scope'
      # REACT_APP_AUTH_DESCOPECC_CLIENT_ID: 'descopecc'
      # REACT_APP_AUTH_DESCOPECC_TOKEN_FOR_USER_DETAILS: 'jwt'
      # REACT_APP_AUTH_DESCOPECC_TOKEN_TO_SEND_TO_FHIR_SERVER: 'jwt'
```

- [ ] **Step 3: Manual verification**

Run `yarn dev` and confirm the app still boots at `http://localhost:5051` with no console errors related to env parsing. (The picker will render a generic "Login with Clientcredentials" button at this point since Task 4 hasn't relabeled/rewired it yet — expected, fixed in Task 4.)

- [ ] **Step 4: Commit**

`.env` is git-ignored and untracked (same as the b.well App PR) — only `docker-compose.yml` gets committed:

```bash
git add docker-compose.yml
git commit -m "config: add Cognito/Descope client-credentials provider example config"
```

---

### Task 2: Client credentials auth service

**Files:**
- Create: `src/services/ClientCredentialsAuthService.ts`

**Interfaces:**
- Consumes: nothing from env directly — the token URL is passed in by the caller (Task 3).
- Produces: `getClientCredentialsToken(tokenUrl: string, clientId: string, clientSecret: string, scope?: string): Promise<string>` (resolves to the access token, throws on failure) — consumed by Task 3.

- [ ] **Step 1: Create `src/services/ClientCredentialsAuthService.ts`**

```ts
import axios from 'axios';

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

- [ ] **Step 2: Manual verification**

Run `yarn lint` — no new errors/warnings for this file. Run `yarn build` — no TypeScript errors.

Then sanity-check the request shape directly against the real Cognito or Descope docs example with curl (no app code involved, just confirms the body-building logic matches the documented shape):

```bash
node -e "
const params = new URLSearchParams({ grant_type: 'client_credentials', client_id: 'abc', client_secret: 'xyz' });
params.append('scope', 'my-scope');
console.log(params.toString());
"
```

Confirm the output is `grant_type=client_credentials&client_id=abc&client_secret=xyz&scope=my-scope` — matching the exact body shape documented for both Cognito (`client_secret_post`) and Descope Inbound Apps.

- [ ] **Step 3: Commit**

```bash
git add src/services/ClientCredentialsAuthService.ts
git commit -m "feat: add ClientCredentialsAuthService for Cognito/Descope OAuth2 client_credentials"
```

---

### Task 3: Client credentials login page and route

**Files:**
- Create: `src/pages/ClientCredentialsLogin.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `getClientCredentialsToken` from Task 2; `REACT_APP_AUTH_COGNITOCC_TOKEN_URL`/`REACT_APP_AUTH_DESCOPECC_TOKEN_URL` from Task 1; existing `jwtParser()`, `setLocalData()`, `removeAuthData()` (`src/utils/auth.utils.ts`), `UserContext`.
- Produces: default-exported `ClientCredentialsLogin` component, mounted at route `/client-credentials-login`, expecting `location.state.resourceUrl` the same way `BwellAppLogin.tsx`/`Auth.tsx` do. Consumed by Task 4 (the picker navigates here) and Task 5 (`identityProvider` values `cognitocc`/`descopecc` this page writes must be recognized by `logout()`).

- [ ] **Step 1: Create `src/pages/ClientCredentialsLogin.tsx`**

```tsx
import { useContext, useState, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Typography,
    Button,
    Box,
    TextField,
    Select,
    MenuItem,
    Link,
    SelectChangeEvent,
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';
import { setLocalData } from '../utils/localData.utils';
import { jwtParser } from '../utils/jwtParser';
import { removeAuthData } from '../utils/auth.utils';
import { getClientCredentialsToken } from '../services/ClientCredentialsAuthService';

type ProviderOption = {
    label: string;
    identityProvider: string;
    tokenUrl: string | undefined;
};

const PROVIDERS: ProviderOption[] = [
    {
        label: 'Cognito',
        identityProvider: 'cognitocc',
        tokenUrl: import.meta.env.REACT_APP_AUTH_COGNITOCC_TOKEN_URL,
    },
    {
        label: 'Descope',
        identityProvider: 'descopecc',
        tokenUrl: import.meta.env.REACT_APP_AUTH_DESCOPECC_TOKEN_URL,
    },
];

const ClientCredentialsLogin = () => {
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const resourceUrl = location.state?.resourceUrl || '/';

    const [selectedProviderKey, setSelectedProviderKey] = useState<string>(
        PROVIDERS[0].identityProvider
    );
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [scope, setScope] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedProvider =
        PROVIDERS.find((p) => p.identityProvider === selectedProviderKey) ?? PROVIDERS[0];

    const configError = !selectedProvider.tokenUrl
        ? `${selectedProvider.label} client credentials sign-in is not configured (missing token URL).`
        : null;

    const handleProviderChange = (event: SelectChangeEvent) => {
        setSelectedProviderKey(event.target.value);
    };

    const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
        formEvent.preventDefault();
        if (isProcessing || !selectedProvider.tokenUrl) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const accessToken = await getClientCredentialsToken(
                selectedProvider.tokenUrl,
                clientId,
                clientSecret,
                scope || undefined
            );
            removeAuthData();
            setLocalData('jwt', accessToken);
            setLocalData('identityProvider', selectedProvider.identityProvider);
            const userDetails = jwtParser();
            if (!userDetails) {
                setError(
                    'Signed in, but the session could not be established. Please contact support.'
                );
                return;
            }
            if (setUserDetails) {
                setUserDetails(userDetails);
            }
            navigate(resourceUrl);
        } catch (loginError: any) {
            const status = loginError?.response?.status;
            if (status === 400 || status === 401 || status === 403) {
                setError(
                    loginError?.response?.data?.error_description ||
                        loginError?.response?.data?.error ||
                        'Invalid client ID or client secret.'
                );
            } else {
                setError('Unable to sign in right now. Please try again.');
            }
            console.error('Client credentials login failed', {
                message: loginError?.message,
                status: loginError?.response?.status,
            });
            setClientSecret('');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <Header />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '60vh',
                    textAlign: 'center',
                    minHeight: '85vh',
                    maxWidth: '400px',
                    margin: '0 auto',
                    padding: '0 10px',
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Login With Client Credentials
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, width: '100%' }}>
                    <Select
                        fullWidth
                        value={selectedProviderKey}
                        onChange={handleProviderChange}
                        sx={{ mb: 2 }}
                    >
                        {PROVIDERS.map((provider) => (
                            <MenuItem key={provider.identityProvider} value={provider.identityProvider}>
                                {provider.label}
                            </MenuItem>
                        ))}
                    </Select>
                    {configError ? (
                        <Typography color="error" sx={{ mb: 2 }}>
                            {configError}
                        </Typography>
                    ) : (
                        <>
                            <TextField
                                fullWidth
                                label="Client ID"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                sx={{ mb: 2 }}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Client Secret"
                                type="password"
                                value={clientSecret}
                                onChange={(e) => setClientSecret(e.target.value)}
                                sx={{ mb: 2 }}
                                required
                            />
                            <TextField
                                fullWidth
                                label="Scope (optional)"
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            {error && (
                                <Typography color="error" sx={{ mb: 2 }}>
                                    {error}
                                </Typography>
                            )}
                            <Button
                                type="submit"
                                variant="contained"
                                color="secondary"
                                sx={{ width: '100%', mb: 2 }}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </>
                    )}
                    <Link component="button" type="button" onClick={() => navigate('/select-idp')}>
                        Back
                    </Link>
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ClientCredentialsLogin;
```

- [ ] **Step 2: Register the route in `src/App.tsx`**

Add the import near the other page imports:

```tsx
import BwellAppLogin from './pages/BwellAppLogin';
import ClientCredentialsLogin from './pages/ClientCredentialsLogin';
```

Add the route next to `/bwell-login` (outside the authenticated-gate `Outlet`, same as `Auth`/`BwellAppLogin`):

```tsx
                    <Route key="bwellLogin" path="/bwell-login" element={<BwellAppLogin />} />
                    <Route key="clientCredentialsLogin" path="/client-credentials-login" element={<ClientCredentialsLogin />} />
```

- [ ] **Step 3: Manual verification**

Run `yarn dev`, then in a browser:

1. Navigate directly to `http://localhost:5051/client-credentials-login`.
2. Confirm the form renders: provider dropdown (Cognito/Descope), Client ID field, Client Secret field, Scope field, Sign In button, Back link.
3. With the placeholder `REACT_APP_AUTH_COGNITOCC_TOKEN_URL` from Task 1 still in place, select Cognito, enter any client ID/secret, submit. Open devtools Network tab — confirm a `POST` fires to the configured token URL with `Content-Type: application/x-www-form-urlencoded` and a body containing `grant_type=client_credentials&client_id=...&client_secret=...`. Confirm the request fails (DNS/network error against the placeholder domain, or a real 400 if you've set a real Cognito domain) and the inline error renders, the client secret field clears, and the Sign In button re-enables.
4. Switch the dropdown to Descope, repeat step 3 against `REACT_APP_AUTH_DESCOPECC_TOKEN_URL`.
5. Click Back — confirm it navigates to `/select-idp`.
6. Once real Cognito/Descope credentials are available (second Cognito app client provisioned, Descope Inbound App created — see the spec's Open Questions), repeat step 3 with real values and confirm: no error, `localStorage.jwt` and `localStorage.identityProvider` (`cognitocc` or `descopecc`) are set, and the browser navigates to `/` (or the original resource URL).

- [ ] **Step 4: Commit**

```bash
git add src/pages/ClientCredentialsLogin.tsx src/App.tsx
git commit -m "feat: add ClientCredentialsLogin page and /client-credentials-login route"
```

---

### Task 4: Wire the picker button

**Files:**
- Modify: `src/pages/IdentityProviderSelection.tsx`

**Interfaces:**
- Consumes: route `/client-credentials-login` (Task 3); `REACT_APP_AUTH_PROVIDERS` containing `clientcredentials` (Task 1).
- Produces: clicking the "Client Credentials" button on `/select-idp` navigates to `/client-credentials-login` with `{ resourceUrl }` in router state.

- [ ] **Step 1: Edit `src/pages/IdentityProviderSelection.tsx`**

Replace the full file contents with (generalizing the single-provider special case from the b.well App PR into a small route-lookup map, since there are now two non-OIDC providers):

```tsx
import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Button, Box } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import EnvContext from '../context/EnvironmentContext';
import { setLocalData } from '../utils/localData.utils';

const PROVIDER_LABELS: Record<string, string> = {
    bwellapp: 'b.well App',
    clientcredentials: 'Client Credentials',
};

const PROVIDER_ROUTES: Record<string, string> = {
    bwellapp: '/bwell-login',
    clientcredentials: '/client-credentials-login',
};

const IdentityProviderSelection = () => {
    const env = useContext(EnvContext);
    const navigate = useNavigate();
    const location = useLocation();
    const referringUrl = location.state?.resourceUrl || '/'; // Default to '/' if no referring URL is provided

    console.log('Referring URL:', referringUrl);

    const handleProviderSelection = (provider: string) => {
        const customRoute = PROVIDER_ROUTES[provider.toLowerCase()];
        if (customRoute) {
            navigate(customRoute, { state: { resourceUrl: referringUrl } });
            return;
        }
        setLocalData('identityProvider', provider);
        navigate('/authcallback', { state: { resourceUrl: referringUrl } });
    };

    const providers: string[] = env.AUTH_PROVIDERS.split(',').map((s) => s.trim());

    const getProviderLabel = (provider: string): string =>
        PROVIDER_LABELS[provider.toLowerCase()] ??
        provider.charAt(0).toUpperCase() + provider.slice(1);

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <Header />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '60vh',
                    textAlign: 'center',
                    minHeight: '85vh',
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '0 10px',
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Select Identity Provider
                </Typography>
                <Box sx={{ mt: 4 }}>
                    {providers.map((provider) => (
                        <Button
                            key={provider}
                            variant="contained"
                            color={provider.toLowerCase() === 'okta' ? 'primary' : 'secondary'}
                            sx={{ mb: 2, width: '100%' }}
                            onClick={() => handleProviderSelection(provider)}
                        >
                            Login with {getProviderLabel(provider)}
                        </Button>
                    ))}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default IdentityProviderSelection;
```

- [ ] **Step 2: Manual verification**

Run `yarn dev`, clear localStorage, navigate to `http://localhost:5051/`. Confirm four buttons render: "Login with Cognito", "Login with Okta", "Login with b.well App", "Login with Client Credentials" (not "Login with Clientcredentials"). Click "Login with Client Credentials" and confirm it navigates to `/client-credentials-login`. Click "Login with b.well App" and confirm it still navigates to `/bwell-login` (regression check on the existing special case). Click Cognito/Okta and confirm they still navigate to `/authcallback` as before.

- [ ] **Step 3: Commit**

```bash
git add src/pages/IdentityProviderSelection.tsx
git commit -m "feat: wire Client Credentials button to /client-credentials-login"
```

---

### Task 5: Generalize logout handling for credentials-based providers

**Files:**
- Modify: `src/utils/auth.utils.ts`

**Interfaces:**
- Consumes: `identityProvider` values `cognitocc`/`descopecc` in localStorage, set by Task 3's `ClientCredentialsLogin`.
- Produces: `logout()` no longer calls `AuthServiceFactory.getAuthService()` for any of `bwellapp`, `cognitocc`, or `descopecc`.

- [ ] **Step 1: Edit `src/utils/auth.utils.ts`**

Change the `bwellapp`-specific branch added by the b.well App PR:

```ts
        if (identityProvider === 'bwellapp') {
            // b.well App auth is a direct credentials POST with no OIDC end-session
            // endpoint - just clear local state instead of building a logout URL.
            removeAuthData();
            if (setUserDetails) {
                setUserDetails(null);
            }
            window.location.replace(window.location.origin);
            return;
        }
```

to a generalized check covering all non-OIDC providers:

```ts
        if (identityProvider && CREDENTIALS_BASED_PROVIDERS.has(identityProvider)) {
            // b.well App / client-credentials auth are direct credentials POSTs with no
            // OIDC end-session endpoint - just clear local state instead of building a logout URL.
            removeAuthData();
            if (setUserDetails) {
                setUserDetails(null);
            }
            window.location.replace(window.location.origin);
            return;
        }
```

And add the `CREDENTIALS_BASED_PROVIDERS` constant near the top of the file, above `removeAuthData`:

```ts
const CREDENTIALS_BASED_PROVIDERS = new Set(['bwellapp', 'cognitocc', 'descopecc']);
```

(Everything else in the function — the OIDC branch, the else/no-provider branch, and the catch block — stays exactly as-is.)

- [ ] **Step 2: Manual verification**

Since no real Cognito/Descope client-credentials app clients exist yet (see Task 3 Step 3), verify via synthetic state injection like the b.well App PR's Task 5 did: with `yarn dev` running, use browser devtools (or Playwright MCP's `browser_evaluate`) to run:

```js
localStorage.setItem('jwt', 'fake.jwt.value');
localStorage.setItem('identityProvider', 'cognitocc');
```

Reload the page, trigger logout (the logout icon button in `Header.tsx`), and confirm: no thrown error, `localStorage` no longer has `jwt`/`identityProvider`, and the browser ends up back at the app's origin. Repeat with `identityProvider` set to `descopecc`. Then repeat once more with `identityProvider` set to `bwellapp` to confirm the generalized check didn't regress the existing b.well App logout path.

- [ ] **Step 3: Commit**

```bash
git add src/utils/auth.utils.ts
git commit -m "refactor: generalize logout's non-OIDC provider check to a set"
```

---

## Post-plan follow-ups (not part of this plan, tracked as open questions in the spec)

- Confirm the real JWT claim names returned by Cognito's and Descope's client_credentials tokens, and correct `REACT_APP_AUTH_COGNITOCC_CUSTOM_USERNAME`/`_CUSTOM_GROUP` and the Descope equivalents if they differ from the `client_id`/`scope` placeholders used here.
- Provision the second, confidential Cognito app client (client_credentials grant + resource-server scopes) in the same user pool.
- Create a Descope Inbound App and confirm its exact `client_id`/`client_secret`/token-endpoint behavior against a real request.
