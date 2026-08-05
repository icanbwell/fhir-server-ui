# Sign In With b.well App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth login option, "Login with b.well App", that authenticates directly against the b.well identity API from the browser (email + password + tenant client key) and produces the same authenticated end-state as the existing Okta/Cognito OIDC flows.

**Architecture:** A standalone credentials-form page (`/bwell-login`) calls a small service function that POSTs to `{BASE_URL}/identity/account/login` with a `clientkey` header, stores the returned JWT the same way the OIDC flows do (`jwt` + `identityProvider` in localStorage, `UserContext` populated via the existing `jwtParser()`), and is deliberately **not** routed through `AuthServiceFactory`/`IAuthService` (those are OIDC/PKCE-shaped; this flow has no redirect or authorization code).

**Tech Stack:** React 19 + TypeScript, Vite, MUI, axios, react-router-dom v7. No test framework exists in this repo — verification is manual (see each task).

**Spec:** `docs/superpowers/specs/2026-08-05-bwell-app-auth-design.md`

## Global Constraints

- Call the b.well identity API directly from the browser — no backend/proxy added to this repo.
- Support multiple tenant client keys via a dropdown, sourced from `REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS` (comma-separated `Name=key` pairs), matching this repo's existing comma-separated-list convention (`REACT_APP_AUTH_PROVIDERS`).
- Do not modify `AuthServiceFactory.ts` or `IAuthService.ts` — the new flow bypasses them entirely.
- `AuthUrlProvider.getAuthInfo('bwellapp')` must not throw — it's called by `jwtParser()` and by `BaseApi`'s request interceptor on every FHIR call, so the full `REACT_APP_AUTH_BWELLAPP_CUSTOM_USERNAME`/`_CUSTOM_GROUP`/`_CUSTOM_SCOPE`/`_CLIENT_ID`/`_TOKEN_FOR_USER_DETAILS` config block is required even though this flow never calls `getAuthUrlsAsync`.
- No automated tests — this repo has zero existing test infrastructure (no Jest/Vitest, no `*.test.*` files). Each task instead has explicit manual verification steps.
- Remove the dangling `REACT_APP_AUTH_BWELL_*` config and `bwell` provider entry (leftover from the removed Cognito-pool case in commit `14a2f67`) as part of this work.

---

### Task 1: Environment configuration

**Files:**
- Modify: `.env`
- Modify: `docker-compose.yml`

**Interfaces:**
- Produces: `import.meta.env.REACT_APP_AUTH_BWELLAPP_BASE_URL`, `REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS`, `REACT_APP_AUTH_BWELLAPP_CUSTOM_USERNAME`, `REACT_APP_AUTH_BWELLAPP_CUSTOM_GROUP`, `REACT_APP_AUTH_BWELLAPP_CUSTOM_SCOPE`, `REACT_APP_AUTH_BWELLAPP_CLIENT_ID`, `REACT_APP_AUTH_BWELLAPP_TOKEN_FOR_USER_DETAILS`, `REACT_APP_AUTH_BWELLAPP_TOKEN_TO_SEND_TO_FHIR_SERVER` — consumed by Tasks 2, 3, and by the existing `AuthUrlProvider.getAuthInfo()`. `REACT_APP_AUTH_PROVIDERS` now includes `bwellapp` — consumed by `IdentityProviderSelection.tsx` (Task 4).

- [ ] **Step 1: Edit `.env`**

Change the top provider list line from:

```
REACT_APP_AUTH_PROVIDERS='cognito,okta,bwell'
```

to:

```
REACT_APP_AUTH_PROVIDERS='cognito,okta,bwellapp'
```

Then replace the entire `# bwell provider` block:

```
# bwell provider
REACT_APP_AUTH_BWELL_CUSTOM_USERNAME='cognito:username'
REACT_APP_AUTH_BWELL_CUSTOM_GROUP='cognito:groups'
REACT_APP_AUTH_BWELL_CUSTOM_SCOPE='custom:scope'
REACT_APP_AUTH_BWELL_CLIENT_ID='3i43562q02ghinf28av0nqv6di'
REACT_APP_AUTH_BWELL_REDIRECT_URL='http://localhost:5051/authcallback'
REACT_APP_AUTH_BWELL_WELL_KNOWN_URL='https://cognito-idp.us-east-1.amazonaws.com/us-east-1_o71QMdxTG/.well-known/openid-configuration'
REACT_APP_AUTH_BWELL_TOKEN_TO_SEND_TO_FHIR_SERVER='jwt'
REACT_APP_AUTH_BWELL_TOKEN_FOR_USER_DETAILS='jwt'
```

with:

```
# b.well App provider (credentials-form login against the b.well identity API)
REACT_APP_AUTH_BWELLAPP_BASE_URL='https://api.dev.icanbwell.com'
REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS='Default=REPLACE_WITH_REAL_CLIENT_KEY'
REACT_APP_AUTH_BWELLAPP_CUSTOM_USERNAME='cognito:username'
REACT_APP_AUTH_BWELLAPP_CUSTOM_GROUP='cognito:groups'
REACT_APP_AUTH_BWELLAPP_CUSTOM_SCOPE='custom:scope'
REACT_APP_AUTH_BWELLAPP_CLIENT_ID='bwellapp'
REACT_APP_AUTH_BWELLAPP_TOKEN_FOR_USER_DETAILS='jwt'
REACT_APP_AUTH_BWELLAPP_TOKEN_TO_SEND_TO_FHIR_SERVER='jwt'
```

(`REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS` needs a real client key from whoever owns the b.well identity API for this to work end-to-end in dev — `REPLACE_WITH_REAL_CLIENT_KEY` is a placeholder to swap in Task 3's manual verification.)

- [ ] **Step 2: Edit `docker-compose.yml`**

After the existing commented-out Okta example block (the one ending in `# REACT_APP_AUTH_OKTA_REMOVE_SCOPE_PREFIX: ''`), add a matching commented example for the new provider:

```yaml
      # To configure b.well App sign-in, uncomment the following lines and set the
      # appropriate values, and add 'bwellapp' to REACT_APP_AUTH_PROVIDERS
      #
      # REACT_APP_AUTH_BWELLAPP_BASE_URL: 'https://api.dev.icanbwell.com'
      # REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS: 'Default=<client-key>'
      # REACT_APP_AUTH_BWELLAPP_CUSTOM_USERNAME: 'cognito:username'
      # REACT_APP_AUTH_BWELLAPP_CUSTOM_GROUP: 'cognito:groups'
      # REACT_APP_AUTH_BWELLAPP_CUSTOM_SCOPE: 'custom:scope'
      # REACT_APP_AUTH_BWELLAPP_CLIENT_ID: 'bwellapp'
      # REACT_APP_AUTH_BWELLAPP_TOKEN_FOR_USER_DETAILS: 'jwt'
      # REACT_APP_AUTH_BWELLAPP_TOKEN_TO_SEND_TO_FHIR_SERVER: 'jwt'
```

- [ ] **Step 3: Manual verification**

Run `yarn dev` and confirm the app still boots at `http://localhost:5051` with no console errors related to env parsing. (The picker will render a generic "Login with Bwellapp" button at this point since Task 4 hasn't relabeled/rewired it yet — that's expected and gets fixed in Task 4.)

- [ ] **Step 4: Commit**

```bash
git add .env docker-compose.yml
git commit -m "config: replace dangling bwell env vars with b.well App provider config"
```

---

### Task 2: b.well App auth service

**Files:**
- Create: `src/services/BwellAppAuthService.ts`

**Interfaces:**
- Consumes: `import.meta.env.REACT_APP_AUTH_BWELLAPP_BASE_URL` (Task 1).
- Produces: `login(email: string, password: string, clientKey: string): Promise<string>` (resolves to the JWT string, throws on failure) and `parseClientKeys(rawClientKeys: string | undefined): { name: string; key: string }[]` — both consumed by Task 3 (`BwellAppLogin.tsx`).

- [ ] **Step 1: Create `src/services/BwellAppAuthService.ts`**

```ts
import axios from 'axios';

export async function login(
    email: string,
    password: string,
    clientKey: string
): Promise<string> {
    const baseUrl = import.meta.env.REACT_APP_AUTH_BWELLAPP_BASE_URL;
    if (!baseUrl) {
        throw new Error('REACT_APP_AUTH_BWELLAPP_BASE_URL is not defined');
    }

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

export function parseClientKeys(
    rawClientKeys: string | undefined
): { name: string; key: string }[] {
    if (!rawClientKeys) {
        return [];
    }
    return rawClientKeys
        .split(',')
        .map((pair) => pair.trim())
        .filter((pair) => pair.length > 0)
        .map((pair) => {
            const [name, key] = pair.split('=').map((s) => s.trim());
            return { name, key };
        })
        .filter((entry) => entry.name && entry.key);
}
```

- [ ] **Step 2: Manual verification**

Run `yarn lint` — must show no new errors/warnings for this file. Run `yarn build` — must complete with no TypeScript errors (this is the closest thing to a type-check test given there's no test runner).

Then sanity-check `parseClientKeys` directly: temporarily open a Node REPL (`node -e "..."` won't work since it's TS/ESM with import.meta — instead open the browser devtools console on any page after `yarn dev` is running, and paste:

```js
'Default=abc,Second=def'.split(',').map(s=>s.trim()).filter(Boolean).map(p=>{const [n,k]=p.split('=').map(s=>s.trim());return {n,k};})
```

Confirm it returns `[{n: 'Default', k: 'abc'}, {n: 'Second', k: 'def'}]` — this is the same splitting logic `parseClientKeys` uses, confirming the parsing behavior before it's wired into UI in Task 3.

- [ ] **Step 3: Commit**

```bash
git add src/services/BwellAppAuthService.ts
git commit -m "feat: add BwellAppAuthService for direct b.well identity API login"
```

---

### Task 3: b.well App login page and route

**Files:**
- Create: `src/pages/BwellAppLogin.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `login`, `parseClientKeys` from `src/services/BwellAppAuthService.ts` (Task 2); `REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS` (Task 1); existing `jwtParser()` (`src/utils/jwtParser.ts`), `setLocalData()` (`src/utils/localData.utils.ts`), `UserContext` (`src/context/UserContext.ts`).
- Produces: default-exported `BwellAppLogin` component, mounted at route `/bwell-login`, expecting `location.state.resourceUrl` (a string, defaulting to `/`) the same way `Auth.tsx` and `IdentityProviderSelection.tsx` already do. Consumed by Task 4 (the picker navigates here).

- [ ] **Step 1: Create `src/pages/BwellAppLogin.tsx`**

```tsx
import { useContext, useMemo, useState, FormEvent } from 'react';
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
import { login, parseClientKeys } from '../services/BwellAppAuthService';

const BwellAppLogin = () => {
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const resourceUrl = location.state?.resourceUrl || '/';

    const clientKeys = useMemo(
        () => parseClientKeys(import.meta.env.REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS),
        []
    );

    const [selectedClientName, setSelectedClientName] = useState<string>(
        clientKeys[0]?.name || ''
    );
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClientChange = (event: SelectChangeEvent) => {
        setSelectedClientName(event.target.value);
    };

    const handleSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
        formEvent.preventDefault();
        if (isProcessing) {
            return;
        }

        if (clientKeys.length === 0) {
            setError(
                'No b.well App client keys are configured (REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS).'
            );
            return;
        }

        const selectedClient =
            clientKeys.find((c) => c.name === selectedClientName) ?? clientKeys[0];

        setIsProcessing(true);
        setError(null);

        try {
            const jwtToken = await login(email, password, selectedClient.key);
            setLocalData('jwt', jwtToken);
            setLocalData('identityProvider', 'bwellapp');
            if (setUserDetails) {
                setUserDetails(jwtParser());
            }
            navigate(resourceUrl);
        } catch (loginError: any) {
            const status = loginError?.response?.status;
            if (status === 401) {
                setError('Invalid email or password.');
            } else {
                setError('Unable to sign in right now. Please try again.');
            }
            console.error('b.well App login failed', loginError);
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
                    Sign In With b.well App
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, width: '100%' }}>
                    {clientKeys.length > 1 && (
                        <Select
                            fullWidth
                            value={selectedClientName}
                            onChange={handleClientChange}
                            sx={{ mb: 2 }}
                        >
                            {clientKeys.map((client) => (
                                <MenuItem key={client.name} value={client.name}>
                                    {client.name}
                                </MenuItem>
                            ))}
                        </Select>
                    )}
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ mb: 2 }}
                        required
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mb: 2 }}
                        required
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
                    <Link component="button" type="button" onClick={() => navigate('/select-idp')}>
                        Back
                    </Link>
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default BwellAppLogin;
```

- [ ] **Step 2: Register the route in `src/App.tsx`**

Add the import near the other page imports:

```tsx
import IdentityProviderSelection from './pages/IdentityProviderSelection';
import BwellAppLogin from './pages/BwellAppLogin';
```

Add the route next to `/authcallback` (outside the authenticated-gate `Outlet`, same as `Auth`):

```tsx
                    <Route key="authcallback" path="/authcallback" element={<Auth />} />
                    <Route key="bwellLogin" path="/bwell-login" element={<BwellAppLogin />} />
```

- [ ] **Step 3: Manual verification**

Run `yarn dev`, then in a browser:

1. Navigate directly to `http://localhost:5051/bwell-login`.
2. Confirm the form renders: Email field, Password field, Sign In button, Back link. Confirm the tenant dropdown is **hidden** (only one `Default=...` key is configured from Task 1).
3. Open browser devtools Network tab. Submit the form with any email/password.
4. Confirm a `POST` request fires to `{REACT_APP_AUTH_BWELLAPP_BASE_URL}/identity/account/login` with a `clientkey` request header and a JSON body `{"email": "...", "password": "..."}`. This confirms the wiring is correct even before a real b.well dev account is available:
   - If the placeholder client key from Task 1 is still in place, expect a 401/403 from the API — confirm the inline error "Invalid email or password." (or "Unable to sign in right now...") renders and the Sign In button re-enables.
   - Once a real `REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS` value and valid b.well dev credentials are available, repeat this step and confirm: no error shown, `localStorage.jwt` and `localStorage.identityProvider` (`bwellapp`) are set (check via devtools Application tab), and the browser navigates to `/` (or the original resource URL).
5. Click Back — confirm it navigates to `/select-idp`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/BwellAppLogin.tsx src/App.tsx
git commit -m "feat: add BwellAppLogin page and /bwell-login route"
```

---

### Task 4: Wire the picker button

**Files:**
- Modify: `src/pages/IdentityProviderSelection.tsx`

**Interfaces:**
- Consumes: route `/bwell-login` (Task 3); `REACT_APP_AUTH_PROVIDERS` containing `bwellapp` (Task 1).
- Produces: clicking the b.well App button on `/select-idp` navigates to `/bwell-login` with `{ resourceUrl }` in router state, instead of the generic OIDC path.

- [ ] **Step 1: Edit `src/pages/IdentityProviderSelection.tsx`**

Replace the full file contents with:

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
};

const IdentityProviderSelection = () => {
    const env = useContext(EnvContext);
    const navigate = useNavigate();
    const location = useLocation();
    const referringUrl = location.state?.resourceUrl || '/'; // Default to '/' if no referring URL is provided

    console.log('Referring URL:', referringUrl);

    const handleProviderSelection = (provider: string) => {
        if (provider.toLowerCase() === 'bwellapp') {
            navigate('/bwell-login', { state: { resourceUrl: referringUrl } });
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

Run `yarn dev`, clear localStorage, navigate to `http://localhost:5051/` (with no existing session — you should be redirected to `/select-idp`). Confirm three buttons render: "Login with Cognito", "Login with Okta", "Login with b.well App" (not "Login with Bwellapp"). Click "Login with b.well App" and confirm it navigates to `/bwell-login`. Click Cognito or Okta and confirm they still behave as before (navigate to `/authcallback` and redirect to that provider's login).

- [ ] **Step 3: Commit**

```bash
git add src/pages/IdentityProviderSelection.tsx
git commit -m "feat: wire b.well App button to /bwell-login instead of the OIDC flow"
```

---

### Task 5: Logout handling for the b.well App provider

**Files:**
- Modify: `src/utils/auth.utils.ts`

**Interfaces:**
- Consumes: `identityProvider` value `'bwellapp'` in localStorage, set by Task 3's `BwellAppLogin`.
- Produces: `logout()` no longer calls `AuthServiceFactory.getAuthService()` (and therefore never throws `Unsupported identity provider`) when `identityProvider === 'bwellapp'`.

- [ ] **Step 1: Edit `src/utils/auth.utils.ts`**

Change:

```ts
export const logout = async (setUserDetails?: (_userDetails: any) => void): Promise<void> => {
    try {
        const identityProvider = getLocalData('identityProvider');
        if (identityProvider) {
            const authService: IAuthService = AuthServiceFactory.getAuthService();
```

to:

```ts
export const logout = async (setUserDetails?: (_userDetails: any) => void): Promise<void> => {
    try {
        const identityProvider = getLocalData('identityProvider');

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

        if (identityProvider) {
            const authService: IAuthService = AuthServiceFactory.getAuthService();
```

(Everything else in the function stays as-is — the existing `if (identityProvider)`/`else`/`catch` branches are unchanged, just now unreachable for `'bwellapp'` because of the early `return` above.)

- [ ] **Step 2: Manual verification (full end-to-end)**

With a real `REACT_APP_AUTH_BWELLAPP_CLIENT_KEYS` value and valid b.well dev credentials available (see Task 3 Step 3 note):

1. `yarn dev`, log in via "Login with b.well App" with valid credentials.
2. Confirm you land on the home page / original resource URL and the app shows you as logged in (check `Footer`/`UserContext`-driven UI, e.g. username display if present).
3. Navigate to any FHIR resource list page. Open devtools Network tab, confirm the request to the FHIR server carries `Authorization: Bearer <jwt>` and returns a non-401 response (i.e. `BaseApi`'s interceptor correctly resolved `tokenToSendToFhirServer` for `bwellapp` without throwing).
4. Trigger logout (via whatever UI element calls `logout()` — check `Header.tsx`/`Footer.tsx` for the logout button).
5. Confirm you're redirected to the app's origin (home page), and that `localStorage` no longer has `jwt`, `id_token`, or `identityProvider` (devtools Application tab).

- [ ] **Step 3: Commit**

```bash
git add src/utils/auth.utils.ts
git commit -m "fix: handle logout for the b.well App provider without AuthServiceFactory"
```

---

## Post-plan follow-ups (not part of this plan, tracked as open questions in the spec)

- Confirm the real JWT claim names returned by `POST /identity/account/login` and correct `REACT_APP_AUTH_BWELLAPP_CUSTOM_USERNAME`/`_CUSTOM_GROUP`/`_CUSTOM_SCOPE` if they differ from the Cognito-based placeholders used here.
- Confirm CORS is enabled on the b.well identity API for this app's deployed origins (localhost dev, staging, prod) — required for the browser-direct POST to succeed outside of local dev exceptions.
