# Open in API Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Open in API Console" button to `Header.tsx` that, for the current page,
opens `/api-console` in a new tab prefilled (not sent) with the method and URL of the most
recent FHIR GET request that page issued.

**Architecture:** `BaseApi`/`FhirApi` gain an optional `onRequest` hook called right before
each network call fires. A new `LastRequestContext`, provided once in `App.tsx`, stores the
most recent `{method, url, pathname}`. The three page components that issue real FHIR GET
traffic (`IndexPage`, `CompositionSummaryPage`, `IPSViewer`) wire that hook to the context's
setter. `Header.tsx` reads the context and only enables the button when the stored
`pathname` matches the current page's pathname — this is what makes stale data from a
previous page impossible without needing any reset-on-navigate effect.

**Tech Stack:** React 19, TypeScript, MUI v9, react-router-dom v7, Vite.

## Global Constraints

- **No automated test framework exists in this repo** (confirmed: no jest/vitest/
  playwright/cucumber in `package.json`, no `*.test.*` files). Every task below replaces
  the "write a failing test" TDD cycle with: make the change, run `yarn lint` and
  `yarn tsc --noEmit` (must be clean — 0 errors; the 6 pre-existing `security/*` warnings
  are baseline noise, unrelated to this feature, and must not increase), then manually
  verify via the dev server (`yarn dev`) per the task's manual-check steps. This matches
  how PR 211/212/213 in this repo were verified.
- **Reuse the existing query-param hand-off, don't invent a new one.** `APIConsolePage.tsx`
  already parses `method`/`urlSuffix` from `useSearchParams()` on the standalone
  `/api-console` route (`APIConsolePage.tsx:57-73`) and — per the free-form-path change in
  PR 213 — sends `urlSuffix` as the literal, complete request path whenever
  `selectedResourceType` is empty. Nothing in `APIConsolePage.tsx` is modified by this
  plan.
- **Only wire `onRequest` where a real network call happens.** Do not wire
  `SpreadsheetViewer.tsx` or `FileDownload.tsx` (both only ever call
  `BaseApi.downloadFile`, out of scope per the design's non-goals) or `IndexPage.tsx`'s
  `handleSearch` instantiation (calls `getUrl()` only, no network call — the real fetch
  happens when the resulting navigation re-runs the `callApi` effect, which is wired).
- **New browser tab, not same-tab navigation** — use `window.open(url, '_blank', 'noopener,noreferrer')`, matching the pattern already used by `ResourceCard.tsx`'s IPS/Composition/Excel links (`target="_blank" rel="noopener noreferrer"`).
- **Method + URL only** — no request body or custom headers are captured or passed through (see design doc non-goals).

---

### Task 1: `LastRequestContext`

**Files:**
- Create: `src/context/LastRequestContext.ts`

**Interfaces:**
- Produces: `TLastRequest` type (`{ method: string; url: string; pathname: string } | null`); default-exported `LastRequestContext` — a React context whose value shape is `{ lastRequest: TLastRequest; recordRequest: (info: { method: string; url: string }) => void }`.

This follows the exact pattern of `src/context/EnvironmentContext.ts` / `src/context/UserContext.ts` — a plain `createContext` call, no separate Provider component file, consumed elsewhere via `useContext(LastRequestContext)`.

- [ ] **Step 1: Create the context file**

```ts
import { createContext } from 'react';

export type TLastRequest = {
    method: string;
    url: string;
    pathname: string;
} | null;

const LastRequestContext = createContext<{
    lastRequest: TLastRequest;
    recordRequest: (info: { method: string; url: string }) => void;
}>({
    lastRequest: null,
    recordRequest: () => {},
});

export default LastRequestContext;
```

- [ ] **Step 2: Verify it compiles**

Run: `yarn tsc --noEmit`
Expected: no new errors (the file isn't imported anywhere yet, so this just confirms the
file itself is syntactically/type valid).

- [ ] **Step 3: Commit**

```bash
git add src/context/LastRequestContext.ts
git commit -m "Add LastRequestContext for Open in API Console feature"
```

---

### Task 2: Provide `LastRequestContext` in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `LastRequestContext`, `TLastRequest` from Task 1.
- Produces: `LastRequestContext` is now available via `useContext` to every component
  rendered inside `<App>` (all routes, since it wraps `RouterProvider`).

- [ ] **Step 1: Add the imports**

At the top of `src/App.tsx`, alongside the existing context imports (currently lines 18-19):

```tsx
import EnvContext from './context/EnvironmentContext';
import UserContext from './context/UserContext';
import LastRequestContext, { TLastRequest } from './context/LastRequestContext';
```

Also add `useCallback` to the existing React import on line 2:

```tsx
import React, { Suspense, useCallback, useContext, useState } from 'react';
```

- [ ] **Step 2: Add state and the stamping callback**

Inside `function App()`, right after the existing `userDetails` state (currently line 30):

```tsx
const [userDetails, setUserDetails] = useState<TUserDetails | null>(jwtParser());
const [lastRequest, setLastRequest] = useState<TLastRequest>(null);
const recordRequest = useCallback((info: { method: string; url: string }) => {
    setLastRequest({ ...info, pathname: window.location.pathname });
}, []);
```

- [ ] **Step 3: Wrap `RouterProvider` with the new Provider**

Change the `return` block (currently lines 83-89) from:

```tsx
return (
    <ThemeContextProvider>
        <UserContext.Provider value={{ userDetails, setUserDetails }}>
            <RouterProvider router={router} />
        </UserContext.Provider>
    </ThemeContextProvider>
);
```

to:

```tsx
return (
    <ThemeContextProvider>
        <UserContext.Provider value={{ userDetails, setUserDetails }}>
            <LastRequestContext.Provider value={{ lastRequest, recordRequest }}>
                <RouterProvider router={router} />
            </LastRequestContext.Provider>
        </UserContext.Provider>
    </ThemeContextProvider>
);
```

- [ ] **Step 4: Verify**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, warning count unchanged (still 6).

Run: `yarn dev`, load the app in a browser, confirm it still loads and you can log in —
this task has no visible behavior change yet, so the check is just "nothing broke."

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "Provide LastRequestContext at the app root"
```

---

### Task 3: Capture requests in `BaseApi`

**Files:**
- Modify: `src/api/baseApi.ts`

**Interfaces:**
- Consumes: nothing new from other tasks (this is the capture chokepoint itself).
- Produces: `BaseApi`'s constructor now accepts an optional third field `onRequest?: (info: { method: string; url: string }) => void`. Later tasks pass `LastRequestContext`'s `recordRequest` here. `url` passed to `onRequest` is always a **relative path** (`pathname + search`, no origin) — this is the exact string `Task 6/7/8` callers, and eventually `Header.tsx` (Task 5), rely on to build the console link.

- [ ] **Step 1: Add the field and constructor parameter**

In `src/api/baseApi.ts`, change the class fields (currently lines 22-26):

```ts
class BaseApi {
    private readonly fhirUrl: string | undefined;
    private readonly setUserDetails:
        | React.Dispatch<React.SetStateAction<TUserDetails | null>>
        | undefined;
    private readonly axiosInstance: AxiosInstance;
    protected readonly onRequest?: (info: { method: string; url: string }) => void;
```

Change the constructor signature and body (currently lines 28-41):

```ts
    constructor({
        fhirUrl,
        setUserDetails,
        onRequest,
    }: {
        fhirUrl: string | undefined;
        setUserDetails: React.Dispatch<React.SetStateAction<TUserDetails | null>> | undefined;
        onRequest?: (info: { method: string; url: string }) => void;
    }) {
        this.fhirUrl = fhirUrl;
        this.setUserDetails = setUserDetails;
        this.onRequest = onRequest;

        // Create a dedicated axios instance for this BaseApi instance
        this.axiosInstance = axios.create();
        this.axiosInstance.interceptors.request.use(this.requestInterceptor.bind(this));
    }
```

- [ ] **Step 2: Call the hook in `getData`**

Change `getData` (currently lines 103-119) to record right after the final URL is built,
before the axios call:

```ts
    async getData({ urlString, params }: GetDataParams): Promise<any> {
        if (urlString.includes(window.location.origin)) {
            urlString = urlString.replace(window.location.origin, '');
        }
        const url = new URL(urlString, this.getBaseUrl());
        if (params && Object.keys(params).length > 0) {
            url.search = new URLSearchParams(params).toString();
        }

        this.onRequest?.({ method: 'GET', url: url.pathname + url.search });

        try {
            const response = await this.axiosInstance.get(url.toString());
            return { status: response.status, json: response.data };
        } catch (err: any) {
            await this.handleUnauthorized(err.response?.status);
            return { status: err.response?.status, json: err.response?.data };
        }
    }
```

- [ ] **Step 3: Call the hook in `request`**

Change `request` (currently lines 121-138) to record right at the top, before the axios
call:

```ts
    async request({ urlString, params, method, data }: RequestParams): Promise<any> {
        this.onRequest?.({ method, url: urlString });

        try {
            const response = await this.axiosInstance.request({
                baseURL: this.getBaseUrl(),
                url: urlString,
                method,
                params,
                data,
                headers: {
                    'Content-Type': 'application/fhir+json'
                }
            });
            return { status: response.status, json: response.data };
        } catch (err: any) {
            await this.handleUnauthorized(err.response?.status);
            return { status: err.response?.status, json: err.response?.data };
        }
    }
```

- [ ] **Step 4: Verify**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, warning count unchanged (still 6 — this file already carries one of
the 6 baseline `security/detect-object-injection` warnings at what is now a shifted line
number; confirm the count is still 6, not that the exact line number is unchanged).

- [ ] **Step 5: Commit**

```bash
git add src/api/baseApi.ts
git commit -m "Add onRequest capture hook to BaseApi.getData/request"
```

---

### Task 4: Capture requests in `FhirApi.sendRequest`

**Files:**
- Modify: `src/api/fhirApi.ts`

**Interfaces:**
- Consumes: `this.onRequest` (protected field from `BaseApi`, Task 3 — `FhirApi extends BaseApi` so it's already inherited, no import needed).
- Produces: `sendRequest`'s captured `url` is `url.pathname + url.search`, same shape as `BaseApi.getData`'s capture in Task 3.

- [ ] **Step 1: Add the capture call**

In `src/api/fhirApi.ts`'s `sendRequest`, immediately after the origin-check block (currently
around lines 153-160) and before `buildHeaders` is called:

```ts
        if (url.origin !== new URL(this.getBaseUrl()).origin) {
            return {
                status: undefined,
                json: { error: 'Request path must stay on the configured FHIR server' },
                headers: {},
                rawText: '',
            };
        }

        this.onRequest?.({ method, url: url.pathname + url.search });

        const requestHeaders = this.buildHeaders({
            'Content-Type': 'application/fhir+json',
            ...headers,
        });
```

Recording after the origin check (not before) means a blocked cross-origin attempt never
gets surfaced as "the last request" — only requests that are actually about to be sent.

- [ ] **Step 2: Verify**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged).

Run: `yarn dev`, open `/api-console`, send any request (e.g. GET `/version`), confirm it
still works exactly as before — this task has no visible UI change yet, so the check is
"the console's own send path still works."

- [ ] **Step 3: Commit**

```bash
git add src/api/fhirApi.ts
git commit -m "Add onRequest capture hook to FhirApi.sendRequest"
```

---

### Task 5: "Open in API Console" button in `Header.tsx`

**Files:**
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: `LastRequestContext` (Task 1) — `{ lastRequest, recordRequest }`, though only
  `lastRequest` is read here.
- Produces: nothing new consumed by later tasks — this is the UI leaf.

- [ ] **Step 1: Add imports**

Add to the top of `src/components/Header.tsx`, alongside the existing icon/context imports:

```tsx
import TerminalIcon from '@mui/icons-material/Terminal';
import LastRequestContext from '../context/LastRequestContext';
```

Change the existing `react-router-dom` import (currently line 8) from:

```tsx
import { Link } from 'react-router-dom';
```

to:

```tsx
import { Link, useLocation } from 'react-router-dom';
```

- [ ] **Step 2: Read context and compute button state**

Inside the `Header` component, alongside the existing `useContext` calls (currently lines
16-18):

```tsx
const env = useContext(EnvContext);
const { userDetails, setUserDetails } = useContext(UserContext);
const { lastRequest } = useContext(LastRequestContext);
const { isDarkMode, toggleDarkMode } = useTheme();
const location = useLocation();
const [anchorEl, setAnchorEl] = useState(null);

const canOpenInConsole = Boolean(lastRequest && lastRequest.pathname === location.pathname);

const handleOpenInConsole = () => {
    if (!lastRequest || !canOpenInConsole) {
        return;
    }
    const params = new URLSearchParams({ urlSuffix: lastRequest.url });
    if (lastRequest.method !== 'GET') {
        params.set('method', lastRequest.method);
    }
    window.open(`/api-console?${params.toString()}`, '_blank', 'noopener,noreferrer');
};
```

- [ ] **Step 3: Add the button to the toolbar**

In the `<Toolbar>` JSX, add the new `IconButton` right before the existing dark-mode
toggle `IconButton` (currently starting at line 50), so it reads:

```tsx
<div style={{ flexGrow: 1 }} />
<Tooltip
    title={
        canOpenInConsole
            ? 'Open in API Console'
            : 'No FHIR request captured on this page yet'
    }
>
    <span>
        <IconButton
            color="inherit"
            aria-label="open in api console"
            id="btnOpenInApiConsole"
            onClick={handleOpenInConsole}
            disabled={!canOpenInConsole}
            sx={{ ml: 1 }}
        >
            <TerminalIcon />
        </IconButton>
    </span>
</Tooltip>
<IconButton
    color="inherit"
    aria-label="toggle dark mode"
    ...
```

(The `<span>` wrapping the `IconButton` inside `Tooltip` is required by MUI — a disabled
element doesn't fire the mouse events `Tooltip` listens for, so it needs a non-disabled
wrapper to attach to.)

`Tooltip` is not yet imported in this file — add it to the existing MUI import (currently
line 2):

```tsx
import { AppBar, Toolbar, Typography, IconButton, Button, Popover, Tooltip } from '@mui/material';
```

- [ ] **Step 4: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged).

- [ ] **Step 5: Verify — manual check (button disabled everywhere, since nothing is wired to `recordRequest` yet)**

Run: `yarn dev`, log in, visit any page. Confirm the new terminal icon appears in the
header, is disabled, and shows the "No FHIR request captured on this page yet" tooltip on
hover. This confirms the button renders correctly before any page actually feeds it data
(Tasks 6-8 do that).

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx
git commit -m "Add disabled Open in API Console button to Header"
```

---

### Task 6: Wire `IndexPage.tsx`

**Files:**
- Modify: `src/pages/IndexPage.tsx`

**Interfaces:**
- Consumes: `LastRequestContext` (Task 1), `recordRequest`.

`IndexPage` covers resource search, resource show, and `_history` — the highest-traffic
page in the app, and the first place this feature becomes end-to-end testable.

- [ ] **Step 1: Add the import and read the context**

Add to the imports (alongside the existing `UserContext` import, currently line 17):

```tsx
import UserContext from '../context/UserContext';
import LastRequestContext from '../context/LastRequestContext';
```

Inside the component, alongside the existing `useContext` calls (currently lines 28-29):

```tsx
const { fhirUrl } = useContext(EnvironmentContext);
const { setUserDetails } = useContext(UserContext);
const { recordRequest } = useContext(LastRequestContext);
```

- [ ] **Step 2: Pass `onRequest` into the `callApi` effect's `FhirApi` instantiation**

In the `callApi` function inside the main `useEffect` (currently around line 172), change:

```tsx
                    const fhirApi = new FhirApi({
                        fhirUrl,
                        setUserDetails,
                    });
```

to:

```tsx
                    const fhirApi = new FhirApi({
                        fhirUrl,
                        setUserDetails,
                        onRequest: recordRequest,
                    });
```

Do **not** make the same change to the `FhirApi` instantiation inside `handleSearch`
(currently around line 243) — it only calls `getUrl()`, never issues a network request, so
there's nothing there for `onRequest` to capture.

- [ ] **Step 3: Add `recordRequest` to the effect's dependency array**

The `useEffect`'s dependency array (currently lines 217-228) already lists `fhirUrl`,
`setUserDetails`, etc. Add `recordRequest`:

```tsx
    }, [
        id,
        queryString,
        resourceType,
        search,
        operation,
        vid,
        fhirUrl,
        setUserDetails,
        recordRequest,
        location.search,
        shouldBeJsonFormat,
    ]);
```

`recordRequest` has a stable identity (wrapped in `useCallback` with an empty dependency
array in `App.tsx`, Task 2), so adding it here doesn't cause the effect to re-run any more
than it already does.

- [ ] **Step 4: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged).

- [ ] **Step 5: Verify — manual, end-to-end**

Run: `yarn dev`, log in, navigate to a resource search page (e.g. search Patients) or a
single resource show page (e.g. `/4_0_0/Patient/<id>`). Confirm:
- The header's terminal icon is now enabled with tooltip "Open in API Console".
- Clicking it opens a new tab at `/api-console?...` with the Method dropdown and request
  path matching exactly what `IndexPage` fetched (compare against the Network tab).
- The request is prefilled but **not** sent (Send button hasn't been clicked
  automatically).
- Navigate to `HomePage` (`/`, which renders `Header` but never fetches FHIR data):
  confirm the button goes back to disabled.

- [ ] **Step 6: Commit**

```bash
git add src/pages/IndexPage.tsx
git commit -m "Wire IndexPage's FHIR fetch into LastRequestContext"
```

---

### Task 7: Wire `CompositionSummaryPage.tsx`

**Files:**
- Modify: `src/pages/CompositionSummaryPage.tsx`

**Interfaces:**
- Consumes: `LastRequestContext` (Task 1), `recordRequest`.

- [ ] **Step 1: Add the import and read the context**

Add to the imports (alongside the existing `UserContext` import, currently line 9):

```tsx
import UserContext from '../context/UserContext';
import LastRequestContext from '../context/LastRequestContext';
```

Inside the component, alongside the existing `useContext` calls (currently lines 26-27):

```tsx
const { fhirUrl } = useContext(EnvironmentContext);
const { setUserDetails } = useContext(UserContext);
const { recordRequest } = useContext(LastRequestContext);
```

- [ ] **Step 2: Pass `onRequest` into the `baseApi` memo**

Change (currently lines 29-32):

```tsx
const baseApi = useMemo(
    () => new BaseApi({ fhirUrl, setUserDetails }),
    [fhirUrl, setUserDetails]
);
```

to:

```tsx
const baseApi = useMemo(
    () => new BaseApi({ fhirUrl, setUserDetails, onRequest: recordRequest }),
    [fhirUrl, setUserDetails, recordRequest]
);
```

- [ ] **Step 3: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged).

- [ ] **Step 4: Verify — manual**

Run: `yarn dev`, navigate to a Composition summary page
(`/composition-summary/4_0_0/Composition/<id>`). Confirm the header's terminal icon is
enabled and opens the console prefilled with the exact GET this page issued.

- [ ] **Step 5: Commit**

```bash
git add src/pages/CompositionSummaryPage.tsx
git commit -m "Wire CompositionSummaryPage's FHIR fetch into LastRequestContext"
```

---

### Task 8: Wire `IPSViewer.tsx`

**Files:**
- Modify: `src/components/IPSViewer.tsx`

**Interfaces:**
- Consumes: `LastRequestContext` (Task 1), `recordRequest`.

`IPSViewer` is a component (not a page) rendered inside `IPSViewerPage.tsx`, which already
renders `Header` itself — no change needed outside `IPSViewer.tsx`.

- [ ] **Step 1: Add the import and read the context**

Add to the imports (alongside the existing `UserContext` import, currently line 18):

```tsx
import UserContext from '../context/UserContext';
import LastRequestContext from '../context/LastRequestContext';
```

Inside the component, alongside the existing `useContext` calls (currently lines 77-78):

```tsx
const { fhirUrl } = useContext(EnvironmentContext);
const { setUserDetails } = useContext(UserContext);
const { recordRequest } = useContext(LastRequestContext);
```

- [ ] **Step 2: Pass `onRequest` into the `baseApi` memo**

Change (currently lines 80-83):

```tsx
const baseApi = React.useMemo(
    () => new BaseApi({ fhirUrl, setUserDetails }),
    [fhirUrl, setUserDetails]
);
```

to:

```tsx
const baseApi = React.useMemo(
    () => new BaseApi({ fhirUrl, setUserDetails, onRequest: recordRequest }),
    [fhirUrl, setUserDetails, recordRequest]
);
```

- [ ] **Step 3: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged).

- [ ] **Step 4: Verify — manual**

Run: `yarn dev`, navigate to an IPS viewer page (`/ips/4_0_0/Patient/<id>/$summary?...`,
reachable via `ResourceCard`'s "IPS" link on a Patient/Person resource). Confirm the
header's terminal icon is enabled and opens the console prefilled with the exact GET this
page issued.

- [ ] **Step 5: Commit**

```bash
git add src/components/IPSViewer.tsx
git commit -m "Wire IPSViewer's FHIR fetch into LastRequestContext"
```

---

## Final full-branch manual pass

After all 8 tasks, run through the design doc's full testing checklist once more in one
sitting (catches cross-task issues the same way PR 213's final review did):

- [ ] Resource search page → button opens console prefilled, unsent, matching the exact
      search GET (compare full query string against the Network tab).
- [ ] Resource show page → same.
- [ ] Composition summary page → same.
- [ ] IPS viewer page → same.
- [ ] `HomePage` right after login (never fetches FHIR data) → button stays disabled.
- [ ] Navigate from a fetching page to `HomePage` → button goes from enabled back to
      disabled (not stuck showing the previous page's request).
- [ ] Navigate between two different resource show pages without a full reload (e.g.
      Patient/123 → Patient/456 via a link) → button's target URL updates to the new
      resource's GET, not stale.
- [ ] `ResourceCard` → "Edit Resource" → `/4_0_0/:resourceType/:id/$merge` redirect flow
      into the console still works exactly as before (unrelated mechanism, untouched).
- [ ] `yarn lint` and `yarn tsc --noEmit` both clean across the whole branch (0 errors, 6
      pre-existing warnings).
