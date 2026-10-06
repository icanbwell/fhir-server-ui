# b.well App Login on Descope Environments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `bwelldescope` identity provider that signs a user in through an embedded Descope flow, selectable per environment, without changing the legacy `bwellapp` provider.

**Architecture:** A new credentials-style page (`/bwell-descope-login`) renders `<Descope>` from `@descope/react-sdk`. On success it stores the Descope session JWT as `jwt` and sets `identityProvider=bwelldescope`, then runs the existing `jwtParser()` so `UserContext`, `BaseApi` and logout keep working. `REACT_APP_AUTH_PROVIDERS` in each environment's Helm values decides which provider appears; no code checks the environment.

**Tech Stack:** React 19, TypeScript, MUI, react-router, Vite, Vitest + Testing Library, `@descope/react-sdk` (new).

**Spec:** `docs/superpowers/specs/2026-10-06-descope-login-design.md`

## Global Constraints

- Branch name `XX-PROJ-123` style; ticket is `BAI-1053`, branch `IQ-BAI-1053` (design PR #297 is on it; implementation uses a new branch `IQ-BAI-1053-impl` off the design branch's base, or the same ticket on a separate branch if #297 has merged).
- Every commit message starts with `BAI-1053 ` and has no AI-attribution trailer.
- Yarn is the package manager (`yarn.lock`); tests run with `yarn test` (Vitest, jsdom, `globals` off: import `describe/it/expect/vi` explicitly).
- 4-space indentation, single quotes, follow the repo ESLint/Prettier config.
- The legacy `bwellapp` page, service, tests and env vars must not change behavior.
- No PHI or real credentials in tests, fixtures, logs or docs; use synthetic values (`user@example.com`, `jwt-abc`).
- Client config is read from `APP_ENV` (`src/runtimeEnv.ts`) via `REACT_APP_*` names; never read `import.meta.env` directly.
- `@descope/react-sdk` is new to this repo but already used in icanbwell (ui-platform, same `^2.30.9` range). No `approved-tech.yaml` copy lists Descope: Task 2 waits for EA to confirm that existing org use suffices or that a Tech Design Review is needed, and the package must be resolvable through the JFrog-backed `bwell-fhir-server-ui` wrapper.

## Review Focus

1. A Descope JWT missing the configured claims (`CUSTOM_USERNAME` etc.): `jwtParser()` returns `null`, so the user must see "session could not be established" and no `jwt` may remain in storage (Task 3, Task 4).
2. A stale `identityProvider=bwelldescope` in localStorage in an environment that does not configure it: `jwtParser()` must clear it and return `null`, not throw (Task 3).
3. A flow-success event with no `sessionJwt`: show an error, store nothing (Task 3, Task 4).
4. `REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID` unset: show a configuration message and do not render the Descope component (Task 1, Task 4).
5. A user who already has a `jwt` opens the login route: redirect to the requested resource instead of showing the flow, as `BwellAppLogin` does (Task 4).

---

### Task 1: Descope config helper and env documentation

**Files:**
- Create: `src/utils/bwellDescopeConfig.ts`
- Create: `src/utils/bwellDescopeConfig.test.ts`
- Modify: `.env.example` (after the `REACT_APP_AUTH_BWELLAPP_*` block, line 42)

**Interfaces:**
- Produces: `BWELL_DESCOPE_PROVIDER = 'bwelldescope'`, `DEFAULT_BWELL_DESCOPE_FLOW_ID = 'bwell-parent-flow'`, `type BwellDescopeConfig = { projectId: string; flowId: string; tenantId?: string; baseUrl?: string; baseStaticUrl?: string }`, `getBwellDescopeConfig(): BwellDescopeConfig | null`.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/bwellDescopeConfig.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_ENV } from '../runtimeEnv';
import {
    BWELL_DESCOPE_PROVIDER,
    DEFAULT_BWELL_DESCOPE_FLOW_ID,
    getBwellDescopeConfig,
} from './bwellDescopeConfig';

let envSnapshot: Record<string, string | undefined>;

describe('getBwellDescopeConfig', () => {
    beforeEach(() => {
        envSnapshot = { ...APP_ENV };
    });

    afterEach(() => {
        Object.keys(APP_ENV).forEach((key) => Reflect.deleteProperty(APP_ENV, key));
        Object.assign(APP_ENV, envSnapshot);
    });

    it('uses the lower-case provider key that matches REACT_APP_AUTH_PROVIDERS', () => {
        expect(BWELL_DESCOPE_PROVIDER).toBe('bwelldescope');
    });

    it('returns null when the project id is not configured', () => {
        Reflect.deleteProperty(APP_ENV, 'REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID');
        expect(getBwellDescopeConfig()).toBeNull();
    });

    it('returns null when the project id is only whitespace', () => {
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = '   ';
        expect(getBwellDescopeConfig()).toBeNull();
    });

    it('defaults the flow id and leaves optional settings undefined', () => {
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = 'P-test';
        expect(getBwellDescopeConfig()).toEqual({
            projectId: 'P-test',
            flowId: DEFAULT_BWELL_DESCOPE_FLOW_ID,
            tenantId: undefined,
            baseUrl: undefined,
            baseStaticUrl: undefined,
        });
    });

    it('reads and trims every configured value', () => {
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = ' P-test ';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_FLOW_ID = ' custom-flow ';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_TENANT_ID = ' tenant-1 ';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_BASE_URL = ' https://auth.example.com ';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_BASE_STATIC_URL = ' https://static.example.com ';
        expect(getBwellDescopeConfig()).toEqual({
            projectId: 'P-test',
            flowId: 'custom-flow',
            tenantId: 'tenant-1',
            baseUrl: 'https://auth.example.com',
            baseStaticUrl: 'https://static.example.com',
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/utils/bwellDescopeConfig.test.ts`
Expected: FAIL (cannot resolve `./bwellDescopeConfig`).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/utils/bwellDescopeConfig.ts
import { APP_ENV } from '../runtimeEnv';

export const BWELL_DESCOPE_PROVIDER = 'bwelldescope';
export const DEFAULT_BWELL_DESCOPE_FLOW_ID = 'bwell-parent-flow';

export type BwellDescopeConfig = {
    projectId: string;
    flowId: string;
    tenantId?: string;
    baseUrl?: string;
    baseStaticUrl?: string;
};

const readTrimmed = (name: string): string | undefined => APP_ENV[name]?.trim() || undefined;

export const getBwellDescopeConfig = (): BwellDescopeConfig | null => {
    const projectId = readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID');
    if (!projectId) {
        return null;
    }
    return {
        projectId,
        flowId:
            readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_FLOW_ID') ?? DEFAULT_BWELL_DESCOPE_FLOW_ID,
        tenantId: readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_TENANT_ID'),
        baseUrl: readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_BASE_URL'),
        baseStaticUrl: readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_BASE_STATIC_URL'),
    };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/utils/bwellDescopeConfig.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Document the env vars**

Add to `.env.example` after line 42:

```
# Descope-based b.well App sign-in (an alternative to BWELLAPP above; list `bwelldescope`
# instead of `bwellapp` in REACT_APP_AUTH_PROVIDERS for environments on Descope)
REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID='REPLACE_WITH_DESCOPE_PROJECT_ID'
REACT_APP_AUTH_BWELLDESCOPE_FLOW_ID='bwell-parent-flow'
REACT_APP_AUTH_BWELLDESCOPE_TENANT_ID=''
REACT_APP_AUTH_BWELLDESCOPE_BASE_URL=''
REACT_APP_AUTH_BWELLDESCOPE_BASE_STATIC_URL=''
REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_USERNAME='REPLACE_WITH_USERNAME_CLAIM'
REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_GROUP='REPLACE_WITH_GROUPS_CLAIM'
REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_SCOPE='REPLACE_WITH_SCOPE_CLAIM'
REACT_APP_AUTH_BWELLDESCOPE_CLIENT_ID='bwelldescope'
REACT_APP_AUTH_BWELLDESCOPE_TOKEN_FOR_USER_DETAILS='jwt'
REACT_APP_AUTH_BWELLDESCOPE_TOKEN_TO_SEND_TO_FHIR_SERVER='jwt'
```

The claim names are the unresolved spec question 2; keep the placeholders until the Descope token claims are confirmed.

- [ ] **Step 6: Commit**

```bash
git add src/utils/bwellDescopeConfig.ts src/utils/bwellDescopeConfig.test.ts .env.example
git commit -m "BAI-1053 add bwelldescope config helper and env docs"
```

---

### Task 2: Add the Descope SDK dependency (blocked on approval)

**Files:**
- Modify: `package.json`, `yarn.lock`

**Interfaces:**
- Produces: `@descope/react-sdk` importable: `AuthProvider`, `Descope`.

- [ ] **Step 1: Confirm approval**

Check the repo's `policies/approved-tech.yaml` (the `bwell-fhir-server-ui` copy has no Descope entry; ui-platform already uses the SDK) and get EA's answer on whether that precedent suffices or a Tech Design Review is needed for BAI-1053. Do not continue without it. Record the outcome link in the PR description.

- [ ] **Step 2: Install, using the version ui-platform pins**

Run: `grep '"@descope/react-sdk"' ~/git/ui-platform/package.json` then `yarn add @descope/react-sdk@<that version>`
Expected: `package.json` and `yarn.lock` change only for `@descope/react-sdk` and its dependencies.

- [ ] **Step 3: Verify the API this plan relies on**

Run: `grep -n "AuthProvider\|projectId\|baseUrl\|baseStaticUrl\|onSuccess\|onError\|flowId\|tenant" node_modules/@descope/react-sdk/dist/index.d.ts | head -40`
Expected: `AuthProvider` takes `projectId`, `baseUrl`, `baseStaticUrl`; `Descope` takes `flowId`, `tenant`, `onSuccess`, `onError`; the success event's `detail.sessionJwt` exists. If any name differs, fix the code in Task 4 to match before writing it.

- [ ] **Step 4: Build check**

Run: `yarn build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock
git commit -m "BAI-1053 add @descope/react-sdk"
```

---

### Task 3: Session completion and Descope storage cleanup

**Files:**
- Create: `src/utils/bwellDescopeSession.ts`
- Create: `src/utils/bwellDescopeSession.test.ts`
- Create: `src/utils/descopeStorage.ts`
- Create: `src/utils/descopeStorage.test.ts`

**Interfaces:**
- Consumes: `BWELL_DESCOPE_PROVIDER` (Task 1); existing `removeAuthData()` (`src/utils/auth.utils.ts`), `setLocalData` (`src/utils/localData.utils.ts`), `jwtParser()` (`src/utils/jwtParser.ts`), `TUserDetails` (`src/types/baseTypes.ts`).
- Produces: `completeBwellDescopeLogin(sessionJwt: string | undefined): TUserDetails | null`, `clearDescopeStorage(): void`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/descopeStorage.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { clearDescopeStorage } from './descopeStorage';

describe('clearDescopeStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('removes the Descope session and refresh tokens from both storages', () => {
        localStorage.setItem('DS', 'a');
        localStorage.setItem('DSR', 'b');
        sessionStorage.setItem('DS', 'c');
        sessionStorage.setItem('DSR', 'd');
        clearDescopeStorage();
        expect(localStorage.getItem('DS')).toBeNull();
        expect(localStorage.getItem('DSR')).toBeNull();
        expect(sessionStorage.getItem('DS')).toBeNull();
        expect(sessionStorage.getItem('DSR')).toBeNull();
    });

    it('leaves unrelated keys alone', () => {
        localStorage.setItem('other', 'keep');
        clearDescopeStorage();
        expect(localStorage.getItem('other')).toBe('keep');
    });
});
```

```ts
// src/utils/bwellDescopeSession.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockJwtParser } = vi.hoisted(() => ({ mockJwtParser: vi.fn() }));
vi.mock('./jwtParser', () => ({ jwtParser: mockJwtParser }));

import { completeBwellDescopeLogin } from './bwellDescopeSession';

const USER = { username: 'user@example.com', isAdmin: false } as never;

describe('completeBwellDescopeLogin', () => {
    beforeEach(() => {
        localStorage.clear();
        mockJwtParser.mockReset();
    });

    it('stores the jwt and provider, then returns the parsed user', () => {
        mockJwtParser.mockReturnValue(USER);
        expect(completeBwellDescopeLogin('jwt-abc')).toBe(USER);
        expect(localStorage.getItem('jwt')).toBe('jwt-abc');
        expect(localStorage.getItem('identityProvider')).toBe('bwelldescope');
    });

    it('replaces stale auth data from another provider', () => {
        localStorage.setItem('jwt', 'old');
        localStorage.setItem('id_token', 'old-id');
        localStorage.setItem('identityProvider', 'okta');
        mockJwtParser.mockReturnValue(USER);
        completeBwellDescopeLogin('jwt-abc');
        expect(localStorage.getItem('id_token')).toBeNull();
        expect(localStorage.getItem('identityProvider')).toBe('bwelldescope');
    });

    it('clears everything and returns null when the token cannot be parsed into a user', () => {
        mockJwtParser.mockReturnValue(null);
        expect(completeBwellDescopeLogin('jwt-abc')).toBeNull();
        expect(localStorage.getItem('jwt')).toBeNull();
        expect(localStorage.getItem('identityProvider')).toBeNull();
    });

    it.each([undefined, ''])('stores nothing when there is no session jwt (%s)', (value) => {
        expect(completeBwellDescopeLogin(value)).toBeNull();
        expect(localStorage.getItem('jwt')).toBeNull();
        expect(mockJwtParser).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/utils/descopeStorage.test.ts src/utils/bwellDescopeSession.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Write minimal implementations**

```ts
// src/utils/descopeStorage.ts
// Descope's SDK keeps its session (DS) and refresh (DSR) tokens under these keys.
// Kept free of imports from auth.utils so auth.utils can call it without a cycle.
const DESCOPE_STORAGE_KEYS = ['DS', 'DSR'];

export const clearDescopeStorage = (): void => {
    DESCOPE_STORAGE_KEYS.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
};
```

```ts
// src/utils/bwellDescopeSession.ts
import { TUserDetails } from '../types/baseTypes';
import { removeAuthData } from './auth.utils';
import { BWELL_DESCOPE_PROVIDER } from './bwellDescopeConfig';
import { jwtParser } from './jwtParser';
import { setLocalData } from './localData.utils';

export const completeBwellDescopeLogin = (sessionJwt: string | undefined): TUserDetails | null => {
    if (!sessionJwt) {
        return null;
    }
    removeAuthData();
    setLocalData('jwt', sessionJwt);
    setLocalData('identityProvider', BWELL_DESCOPE_PROVIDER);
    const userDetails = jwtParser();
    if (!userDetails) {
        removeAuthData();
        return null;
    }
    return userDetails;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test src/utils/descopeStorage.test.ts src/utils/bwellDescopeSession.test.ts`
Expected: PASS.

- [ ] **Step 5: Pin the stale-provider case (Review Focus 2)**

Append to `src/utils/bwellDescopeSession.test.ts`'s sibling file `src/utils/jwtParser.test.ts` if it exists, otherwise create it with this test, using the real `jwtParser` (no mocks):

```ts
it('clears a stored bwelldescope provider that this environment does not configure', () => {
    localStorage.setItem('identityProvider', 'bwelldescope');
    localStorage.setItem('jwt', 'whatever');
    expect(jwtParser()).toBeNull();
    expect(localStorage.getItem('identityProvider')).toBeNull();
    expect(localStorage.getItem('jwt')).toBeNull();
});
```

Run: `yarn test src/utils/jwtParser.test.ts`
Expected: PASS (existing behavior; the test pins it for the new provider key).

- [ ] **Step 6: Commit**

```bash
git add src/utils/bwellDescopeSession.ts src/utils/bwellDescopeSession.test.ts src/utils/descopeStorage.ts src/utils/descopeStorage.test.ts src/utils/jwtParser.test.ts
git commit -m "BAI-1053 add Descope session completion and storage cleanup"
```

---

### Task 4: The login page

**Files:**
- Create: `src/pages/BwellDescopeLogin.tsx`
- Create: `src/pages/BwellDescopeLogin.test.tsx`

**Interfaces:**
- Consumes: `getBwellDescopeConfig`, `BwellDescopeConfig` (Task 1); `completeBwellDescopeLogin` (Task 3); `UserContext` (`src/context/UserContext`) with `setUserDetails`; `getLocalData` (`src/utils/localData.utils`); `AuthProvider`, `Descope` from `@descope/react-sdk` (Task 2).
- Produces: default export `BwellDescopeLogin` React component.

- [ ] **Step 1: Write the failing test**

```tsx
// src/pages/BwellDescopeLogin.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import UserContext from '../context/UserContext';
import { APP_ENV } from '../runtimeEnv';

const { mockComplete } = vi.hoisted(() => ({ mockComplete: vi.fn() }));
vi.mock('../utils/bwellDescopeSession', () => ({ completeBwellDescopeLogin: mockComplete }));

vi.mock('@descope/react-sdk', () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Descope: ({
        flowId,
        onSuccess,
        onError,
    }: {
        flowId: string;
        onSuccess: (e: { detail: { sessionJwt?: string } }) => void;
        onError: (e: { detail: Record<string, unknown> }) => void;
    }) => (
        <div data-testid="descope" data-flow={flowId}>
            <button onClick={() => onSuccess({ detail: { sessionJwt: 'jwt-abc' } })}>ok</button>
            <button onClick={() => onSuccess({ detail: {} })}>no-jwt</button>
            <button onClick={() => onError({ detail: { errorDescription: 'secret detail' } })}>
                fail
            </button>
        </div>
    ),
}));

import BwellDescopeLogin from './BwellDescopeLogin';

const setUserDetails = vi.fn();

const renderPage = () =>
    render(
        <UserContext.Provider value={{ userDetails: null, setUserDetails } as never}>
            <MemoryRouter initialEntries={['/bwell-descope-login']}>
                <Routes>
                    <Route path="/bwell-descope-login" element={<BwellDescopeLogin />} />
                    <Route path="/" element={<div>home</div>} />
                </Routes>
            </MemoryRouter>
        </UserContext.Provider>
    );

describe('BwellDescopeLogin', () => {
    beforeEach(() => {
        localStorage.clear();
        mockComplete.mockReset();
        setUserDetails.mockReset();
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = 'P-test';
        Reflect.deleteProperty(APP_ENV, 'REACT_APP_AUTH_BWELLDESCOPE_FLOW_ID');
    });

    it('shows a configuration message and no flow when the project id is missing', () => {
        Reflect.deleteProperty(APP_ENV, 'REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID');
        renderPage();
        expect(screen.getByText(/not configured/i)).toBeInTheDocument();
        expect(screen.queryByTestId('descope')).not.toBeInTheDocument();
    });

    it('renders the flow with the default flow id', () => {
        renderPage();
        expect(screen.getByTestId('descope')).toHaveAttribute('data-flow', 'bwell-parent-flow');
    });

    it('sets the user and navigates home after a successful flow', async () => {
        mockComplete.mockReturnValue({ username: 'user@example.com' });
        renderPage();
        await userEvent.click(screen.getByText('ok'));
        expect(mockComplete).toHaveBeenCalledWith('jwt-abc');
        expect(setUserDetails).toHaveBeenCalledWith({ username: 'user@example.com' });
        expect(await screen.findByText('home')).toBeInTheDocument();
    });

    it('shows a session error when the token cannot be turned into a user', async () => {
        mockComplete.mockReturnValue(null);
        renderPage();
        await userEvent.click(screen.getByText('ok'));
        expect(screen.getByText(/session could not be established/i)).toBeInTheDocument();
        expect(setUserDetails).not.toHaveBeenCalled();
    });

    it('shows an error when the flow succeeds without a session jwt', async () => {
        mockComplete.mockReturnValue(null);
        renderPage();
        await userEvent.click(screen.getByText('no-jwt'));
        expect(mockComplete).toHaveBeenCalledWith(undefined);
        expect(screen.getByText(/session could not be established/i)).toBeInTheDocument();
    });

    it('shows a generic message, not raw error detail, when the flow errors', async () => {
        renderPage();
        await userEvent.click(screen.getByText('fail'));
        expect(screen.getByText(/unable to sign in right now/i)).toBeInTheDocument();
        expect(screen.queryByText(/secret detail/)).not.toBeInTheDocument();
    });

    it('redirects without showing the flow when a jwt is already stored', async () => {
        localStorage.setItem('jwt', 'existing');
        renderPage();
        expect(await screen.findByText('home')).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/pages/BwellDescopeLogin.test.tsx`
Expected: FAIL (cannot resolve `./BwellDescopeLogin`).

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/pages/BwellDescopeLogin.tsx
import { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AuthProvider, Descope } from '@descope/react-sdk';
import { Link, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';
import { getLocalData } from '../utils/localData.utils';
import { getBwellDescopeConfig } from '../utils/bwellDescopeConfig';
import { completeBwellDescopeLogin } from '../utils/bwellDescopeSession';

const NOT_CONFIGURED_MESSAGE =
    'b.well App sign-in is not configured (missing REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID).';
const SESSION_ERROR_MESSAGE =
    'Signed in, but the session could not be established. Please contact support.';
const GENERIC_ERROR_MESSAGE = 'Unable to sign in right now. Please try again.';

const BwellDescopeLogin = () => {
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const resourceUrl = location.state?.resourceUrl || '/';
    const config = useMemo(() => getBwellDescopeConfig(), []);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (getLocalData('jwt')) {
            navigate(resourceUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSuccess = (event: CustomEvent<{ sessionJwt?: string }>) => {
        const userDetails = completeBwellDescopeLogin(event.detail?.sessionJwt);
        if (!userDetails) {
            setError(SESSION_ERROR_MESSAGE);
            return;
        }
        if (setUserDetails) {
            setUserDetails(userDetails);
        }
        navigate(resourceUrl);
    };

    const handleError = (event: CustomEvent<Record<string, unknown>>) => {
        // Log only the error type, never the full detail, which can echo user input.
        console.error('b.well Descope login failed', { type: event.detail?.errorType });
        setError(GENERIC_ERROR_MESSAGE);
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
                    minHeight: '85vh',
                    maxWidth: '400px',
                    margin: '0 auto',
                    padding: '0 10px',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Sign In With b.well App
                </Typography>
                {!config ? (
                    <Typography color="error" sx={{ mt: 4 }}>
                        {NOT_CONFIGURED_MESSAGE}
                    </Typography>
                ) : (
                    <AuthProvider
                        projectId={config.projectId}
                        baseUrl={config.baseUrl}
                        baseStaticUrl={config.baseStaticUrl}
                    >
                        <Descope
                            flowId={config.flowId}
                            tenant={config.tenantId}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                        {error && (
                            <Typography color="error" sx={{ mt: 2 }}>
                                {error}
                            </Typography>
                        )}
                    </AuthProvider>
                )}
                <Link
                    component="button"
                    type="button"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/select-idp', { state: { resourceUrl } })}
                >
                    Back
                </Link>
            </div>
            <Footer />
        </div>
    );
};

export default BwellDescopeLogin;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/pages/BwellDescopeLogin.test.tsx`
Expected: PASS (7 tests). If the type of the Descope event props rejects `CustomEvent<...>`, align the handler types with what Task 2 Step 3 found.

- [ ] **Step 5: Commit**

```bash
git add src/pages/BwellDescopeLogin.tsx src/pages/BwellDescopeLogin.test.tsx
git commit -m "BAI-1053 add Descope-based b.well App login page"
```

---

### Task 5: Route, provider picker, and logout wiring

**Files:**
- Modify: `src/App.tsx` (import near line 25; route after line 51)
- Modify: `src/pages/IdentityProviderSelection.tsx` (`PROVIDER_LABELS`, `PROVIDER_ROUTES`)
- Modify: `src/utils/auth.utils.ts` (`CREDENTIALS_BASED_PROVIDERS` line 5; logout credentials branch)
- Modify: `src/utils/auth.utils.test.ts`
- Create: `src/pages/IdentityProviderSelection.test.tsx`

**Interfaces:**
- Consumes: `BwellDescopeLogin` (Task 4), `BWELL_DESCOPE_PROVIDER` (Task 1), `clearDescopeStorage` (Task 3).
- Produces: route `/bwell-descope-login`; picker entry `bwelldescope`.

- [ ] **Step 1: Write the failing tests**

Add to `src/utils/auth.utils.test.ts` inside the existing `describe('auth.utils', ...)` (it already sets up `window.location` and `mockReplace`):

```ts
it('logout for bwelldescope clears auth data and Descope storage without an OIDC logout URL', async () => {
    localStorage.setItem('identityProvider', 'bwelldescope');
    localStorage.setItem('jwt', 'jwt-value');
    localStorage.setItem('DS', 'descope-session');
    sessionStorage.setItem('DSR', 'descope-refresh');
    const setUserDetails = vi.fn();

    await logout(setUserDetails);

    expect(localStorage.getItem('jwt')).toBeNull();
    expect(localStorage.getItem('identityProvider')).toBeNull();
    expect(localStorage.getItem('DS')).toBeNull();
    expect(sessionStorage.getItem('DSR')).toBeNull();
    expect(setUserDetails).toHaveBeenCalledWith(null);
    expect(mockGetAuthService).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(ORIGIN);
});
```

Create `src/pages/IdentityProviderSelection.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import EnvContext from '../context/EnvironmentContext';
import IdentityProviderSelection from './IdentityProviderSelection';

const renderWith = (providers: string) =>
    render(
        <EnvContext.Provider value={{ AUTH_PROVIDERS: providers } as never}>
            <MemoryRouter initialEntries={['/select-idp']}>
                <Routes>
                    <Route path="/select-idp" element={<IdentityProviderSelection />} />
                    <Route path="/bwell-descope-login" element={<div>descope page</div>} />
                    <Route path="/bwell-login" element={<div>legacy page</div>} />
                </Routes>
            </MemoryRouter>
        </EnvContext.Provider>
    );

describe('IdentityProviderSelection b.well App providers', () => {
    it('routes bwelldescope to the Descope login page', async () => {
        renderWith('okta,bwelldescope');
        await userEvent.click(screen.getByRole('button', { name: /b\.well App/i }));
        expect(await screen.findByText('descope page')).toBeInTheDocument();
    });

    it('still routes bwellapp to the legacy page', async () => {
        renderWith('okta,bwellapp');
        await userEvent.click(screen.getByRole('button', { name: /b\.well App/i }));
        expect(await screen.findByText('legacy page')).toBeInTheDocument();
    });

    it('shows only the provider the environment lists', () => {
        renderWith('okta,bwelldescope');
        expect(screen.getAllByRole('button', { name: /b\.well App/i })).toHaveLength(1);
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/utils/auth.utils.test.ts src/pages/IdentityProviderSelection.test.tsx`
Expected: FAIL (logout calls the OIDC path for `bwelldescope`; picker navigates to `/authcallback`).

- [ ] **Step 3: Implement**

`src/pages/IdentityProviderSelection.tsx`:

```tsx
const PROVIDER_LABELS: Record<string, string> = Object.assign(Object.create(null), {
    bwellapp: 'b.well App',
    bwelldescope: 'b.well App',
    clientcredentials: 'Client Credentials',
});

const PROVIDER_ROUTES: Record<string, string> = Object.assign(Object.create(null), {
    bwellapp: '/bwell-login',
    bwelldescope: '/bwell-descope-login',
    clientcredentials: '/client-credentials-login',
});
```

`src/App.tsx`: add `import BwellDescopeLogin from './pages/BwellDescopeLogin';` next to the `BwellAppLogin` import and, after the `bwellLogin` route line:

```tsx
<Route key="bwellDescopeLogin" path="/bwell-descope-login" element={<BwellDescopeLogin />} />
```

`src/utils/auth.utils.ts`:

```ts
import { clearDescopeStorage } from './descopeStorage';

const CREDENTIALS_BASED_PROVIDERS = new Set([
    'bwellapp',
    'bwelldescope',
    'cognitocc',
    'descopecc',
]);
```

and in the credentials branch of `logout`, call `clearDescopeStorage()` immediately after `removeAuthData();`. (Clearing Descope's keys for the other credentials providers is harmless: they never write them.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test src/utils/auth.utils.test.ts src/pages/IdentityProviderSelection.test.tsx && yarn test`
Expected: PASS, and the full suite stays green.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/pages/IdentityProviderSelection.tsx src/pages/IdentityProviderSelection.test.tsx src/utils/auth.utils.ts src/utils/auth.utils.test.ts
git commit -m "BAI-1053 wire bwelldescope into routing, picker and logout"
```

---

### Task 6: Helm config and CSP in `bwell-fhir-server-ui` (separate repo and PR)

**Files (repo `bwell-fhir-server-ui`):**
- Modify: `.helm/fhir-server-ui/dev-use1-eks.values.yaml` (`REACT_APP_AUTH_PROVIDERS`, add `REACT_APP_AUTH_BWELLDESCOPE_*`)
- Modify: `docker-entrypoint.d/security.conf` (CSP `connect-src`)

**Interfaces:**
- Consumes: the env var names from Task 1 and the image built from Tasks 1-5.

Scope: dev only. Do not touch staging, client-sandbox or prod values.

- [ ] **Step 1: Resolve the open values first**

Do not continue until these are known (spec questions 1-3): the Descope project ID and flow ID for this UI; the claim names in the Descope session JWT for username, groups and scope; that `fhir.dev.bwell.zone` accepts Descope session JWTs; that `fhir-ui.dev.bwell.zone` and `fhir-ui.dev-use1.bwell.zone` are allowed origins for the project.

- [ ] **Step 2: Edit the dev values**

In `dev-use1-eks.values.yaml`, change the providers entry and add the block (replace the bracketed values with those from Step 1):

```yaml
  - name: REACT_APP_AUTH_PROVIDERS
    value: "okta,bwelldescope,clientcredentials"
  - name: REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID
    value: "[descope project id]"
  - name: REACT_APP_AUTH_BWELLDESCOPE_FLOW_ID
    value: "[flow id, default bwell-parent-flow]"
  - name: REACT_APP_AUTH_BWELLDESCOPE_BASE_URL
    value: "https://auth.dev.icanbwell.com"
  - name: REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_USERNAME
    value: "[username claim]"
  - name: REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_GROUP
    value: "[groups claim]"
  - name: REACT_APP_AUTH_BWELLDESCOPE_CUSTOM_SCOPE
    value: "[scope claim]"
  - name: REACT_APP_AUTH_BWELLDESCOPE_CLIENT_ID
    value: "bwelldescope"
  - name: REACT_APP_AUTH_BWELLDESCOPE_TOKEN_FOR_USER_DETAILS
    value: "jwt"
```

Leave the existing `REACT_APP_AUTH_BWELLAPP_*` entries in place so dev can switch back with a one-line change.

- [ ] **Step 3: Update the CSP**

The header is `Content-Security-Policy-Report-Only` (reports, does not block). Add the Descope static hosts to `connect-src` in `docker-entrypoint.d/security.conf`: `https://static.descope.com https://static2.descope.com https://descopecdn.com`. `*.icanbwell.com` already covers `auth.dev.icanbwell.com`; `https://api.descope.com` is already listed. Check the report-only violations in Sentry after deploy before the policy is switched to enforcing.

- [ ] **Step 4: Validate and commit**

Run: `python3 -c "import yaml;yaml.safe_load(open('.helm/fhir-server-ui/dev-use1-eks.values.yaml'))"`
Expected: no error.

```bash
git add .helm/fhir-server-ui/dev-use1-eks.values.yaml docker-entrypoint.d/security.conf
git commit -m "BAI-1053 enable bwelldescope sign-in on dev"
```

The PR description states scope (dev only, legacy environments deferred) and links the UI PR.

---

### Task 7: Verify on dev

- [ ] **Step 1:** Deploy the UI image from Tasks 1-5, then the dev values from Task 6.
- [ ] **Step 2:** On `https://fhir-ui.dev.bwell.zone`, open `/select-idp`: one "Login with b.well App" button. Click it: the Descope flow renders at `/bwell-descope-login`.
- [ ] **Step 3:** Sign in with a Descope dev test account (entered by the tester; never in a script or log). Expected: lands on the home page as a signed-in user.
- [ ] **Step 4:** Open a FHIR resource page. Expected: data loads (no 401). A 401 here means the FHIR server does not trust the Descope issuer (spec question 1): stop and escalate to the FHIR server owner.
- [ ] **Step 5:** Log out. Expected: returned to the home page; `localStorage` has no `jwt`, `identityProvider`, `DS` or `DSR`.
- [ ] **Step 6:** On staging, confirm the legacy "b.well App" form still appears and works (regression).
- [ ] **Step 7:** Note results on BAI-1053.

## Self-Review

- **Spec coverage:** new provider (Tasks 3-5), per-environment selection via `REACT_APP_AUTH_PROVIDERS` (Tasks 5-6), legacy untouched (Global Constraints, Task 5 test), logout (Task 5), dependency approval (Task 2), CSP (Task 6), open questions gated (Tasks 2, 6, 7). Session refresh is deliberately out of scope: the first version re-logs in on expiry, as the legacy flow does.
- **Placeholders:** the only bracketed values are in Task 6, which are explicitly unresolved spec questions and Step 1 blocks on them.
- **Type consistency:** `BWELL_DESCOPE_PROVIDER`, `getBwellDescopeConfig`, `completeBwellDescopeLogin`, `clearDescopeStorage` and the route `/bwell-descope-login` are spelled identically everywhere they appear.
- **Review Focus:** items 1-5 map to Tasks 3 and 4 tests.
- **Known risk:** the Descope SDK prop and event names were taken from ui-platform's usage and common SDK usage, not the installed type definitions; Task 2 Step 3 verifies them before Task 4.
