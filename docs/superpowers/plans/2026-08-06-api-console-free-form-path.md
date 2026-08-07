# API Console Free-Form Request Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `APIConsolePage`'s guided resourceType/operation/id/params/smartMerge
controls with a single free-text "Request Path" field that is always the literal, complete
request path — no composition, no gating on other fields.

**Architecture:** All changes are confined to `src/pages/APIConsolePage.tsx`. The state,
the `requestUrl` memo, and the search-param sync effect all collapse to the branch that
already exists today for "no resource type selected" (from the PR 213 free-form-path
work) — that branch's logic becomes the *only* logic, not an alternate path. The Controls
bar JSX loses everything except the Method dropdown, one TextField, and the Send button.

**Tech Stack:** React 19, TypeScript, MUI v9, react-router-dom v7, Vite.

## Global Constraints

- **No automated test framework exists in this repo** (confirmed: no jest/vitest/
  playwright/cucumber in `package.json`, no `*.test.*` files). Every task below replaces
  the "write a failing test" TDD cycle with: make the change, run `yarn lint` and
  `yarn tsc --noEmit` (must be clean — 0 errors; the 6 pre-existing `security/*` warnings
  are baseline noise and must not increase), then manually verify via the dev server
  (`yarn dev`) per the task's manual-check steps.
- **Keep the `urlSuffix` state/query-param name unchanged.** `Header.tsx`'s "Open in API
  Console" button (from the already-merged `feature/open-in-api-console`) builds
  `?method=&urlSuffix=` links against this exact contract. Renaming it would require also
  changing `Header.tsx`; keeping it means that file needs zero changes.
- **No migration for the old `?resourceType=&operation=&id=&params=&smartMerge=` query
  scheme.** Confirmed via `grep -rn "api-console?" src` that nothing else in the codebase
  builds links in that scheme, so there's nothing else to update and no shim to write.
- **No changes to:** the request-body editor, custom headers editor, response viewer,
  streaming logic, `handleSend`, `ResourceCard`, or `IndexPage.tsx`'s `$merge` redirect
  routing. Only the guided input controls and the state/logic that feeds them change.

---

### Task 1: Replace the guided builder with a single Request Path field

**Files:**
- Modify: `src/pages/APIConsolePage.tsx`

**Interfaces:**
- Consumes: nothing new — this task only removes state/UI and simplifies existing logic
  within this one file.
- Produces: after this task, `urlSuffix` (state) and the `?urlSuffix=` query param are the
  sole representation of the request path, for both the standalone route and the
  `ResourceCard` redirect flow. `requestUrl` (the memo `handleSend` reads) is a pure
  function of `urlSuffix` alone. Task 2 depends on this task's JSX restructuring (it edits
  the Method `<Select>` this task leaves in place).

- [ ] **Step 1: Remove now-unused imports and constants**

In `src/pages/APIConsolePage.tsx`, change the imports (currently lines 1-31) from:

```tsx
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PreJson from '../components/PreJson';
import KeyValueRows, { KeyValueRow } from '../components/KeyValueRows';
import FhirApi from '../api/fhirApi';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { getLocalData } from '../utils/localData.utils';
import { resourceDefinitions } from '../utils/resourceDefinitions';
```

to:

```tsx
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PreJson from '../components/PreJson';
import KeyValueRows, { KeyValueRow } from '../components/KeyValueRows';
import FhirApi from '../api/fhirApi';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { getLocalData } from '../utils/localData.utils';
```

(Removed `Autocomplete`, `Checkbox`, `FormControlLabel`, `Tooltip` from the MUI import, and
the `resourceDefinitions` import entirely — none of these are used anywhere else in this
file.)

Change the type/constant declarations (currently lines 35-44) from:

```tsx
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Operation = '' | '$merge' | '$graph' | '$everything';

const RESOURCE_NAMES = resourceDefinitions.map((r) => r.name);
const OPERATIONS: { value: Operation; label: string }[] = [
    { value: '', label: 'None' },
    { value: '$merge', label: '$merge' },
    { value: '$graph', label: '$graph' },
    { value: '$everything', label: '$everything' },
];
```

to:

```tsx
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
```

- [ ] **Step 2: Simplify state — remove the guided-builder fields, make `urlSuffix` redirect-aware**

Change the state block (currently lines 56-73) from:

```tsx
    // Initialize state from route params (redirect) or search params (standalone)
    const [method, setMethod] = useState<HttpMethod>(
        (searchParams.get('method') as HttpMethod) || (isFromRedirect ? 'POST' : 'GET')
    );
    const [selectedResourceType, setSelectedResourceType] = useState<string>(
        routeResourceType || searchParams.get('resourceType') || ''
    );
    const [operation, setOperation] = useState<Operation>(
        (isFromRedirect ? routeOperation as Operation : searchParams.get('operation') as Operation) || ''
    );
    const [resourceId, setResourceId] = useState<string>(
        routeId || searchParams.get('id') || ''
    );
    const [params, setParams] = useState<string>(searchParams.get('params') || '');
    const [smartMerge, setSmartMerge] = useState<boolean>(
        searchParams.get('smartMerge') !== 'false'
    );
    const [urlSuffix, setUrlSuffix] = useState<string>(searchParams.get('urlSuffix') || '');
```

to:

```tsx
    // Initialize state from route params (redirect) or search params (standalone)
    const [method, setMethod] = useState<HttpMethod>(
        (searchParams.get('method') as HttpMethod) || (isFromRedirect ? 'POST' : 'GET')
    );
    // When arriving via a ResourceCard redirect, there's no separate resourceType/id/
    // operation state anymore — compose the one field's initial value directly from the
    // route params so it starts pre-filled correctly.
    const [urlSuffix, setUrlSuffix] = useState<string>(
        isFromRedirect && routeResourceType && routeId && routeOperation
            ? `/4_0_0/${routeResourceType}/${routeId}/${routeOperation}`
            : searchParams.get('urlSuffix') || ''
    );
```

Do not change anything else in this block (`resourceJson`, `customHeaders`,
`responseJson`, etc. below it are untouched).

- [ ] **Step 3: Simplify the search-param sync effect**

Change the effect (currently lines 92-120) from:

```tsx
    // Sync state to search params (only for standalone /api-console route)
    useEffect(() => {
        if (isFromRedirect) {
            return;
        }
        const newParams: Record<string, string> = {};
        if (method && method !== 'GET') {
            newParams.method = method;
        }
        if (selectedResourceType) {
            newParams.resourceType = selectedResourceType;
        }
        if (operation) {
            newParams.operation = operation;
        }
        if (resourceId) {
            newParams.id = resourceId;
        }
        if (params) {
            newParams.params = params;
        }
        if (operation === '$merge' && !smartMerge) {
            newParams.smartMerge = 'false';
        }
        if (!operation && urlSuffix) {
            newParams.urlSuffix = urlSuffix;
        }
        setSearchParams(newParams, { replace: true });
    }, [method, selectedResourceType, operation, resourceId, params, smartMerge, urlSuffix, isFromRedirect, setSearchParams]);
```

to:

```tsx
    // Sync state to search params (only for standalone /api-console route)
    useEffect(() => {
        if (isFromRedirect) {
            return;
        }
        const newParams: Record<string, string> = {};
        if (method && method !== 'GET') {
            newParams.method = method;
        }
        if (urlSuffix) {
            newParams.urlSuffix = urlSuffix;
        }
        setSearchParams(newParams, { replace: true });
    }, [method, urlSuffix, isFromRedirect, setSearchParams]);
```

- [ ] **Step 4: Simplify the `requestUrl` memo**

Change the memo (currently lines 122-151) from:

```tsx
    // Build the request URL preview
    const requestUrl = useMemo(() => {
        if (!selectedResourceType) {
            if (!urlSuffix) {
                return '';
            }
            return urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`;
        }
        let url = `/4_0_0/${selectedResourceType}`;
        if (operation) {
            if (resourceId) {
                url += `/${resourceId}`;
            }
            url += `/${operation}`;
            const queryParts: string[] = [];
            if (operation === '$merge') {
                queryParts.push(`smartMerge=${smartMerge}`);
            }
            if (params) {
                queryParts.push(params);
            }
            if (queryParts.length) {
                url += `?${queryParts.join('&')}`;
            }
        } else if (urlSuffix) {
            const separator = urlSuffix.startsWith('/') || urlSuffix.startsWith('?') ? '' : '/';
            url += `${separator}${urlSuffix}`;
        }
        return url;
    }, [selectedResourceType, operation, resourceId, params, smartMerge, urlSuffix]);
```

to:

```tsx
    // Build the request URL preview
    const requestUrl = useMemo(() => {
        if (!urlSuffix) {
            return '';
        }
        return urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`;
    }, [urlSuffix]);
```

Do not change `handleMouseMove`/`handleMouseUp`/the auto-fetch effect/`handleSend`/
`getStatusColor`/`getMethodColor` — none of them reference the removed state.

- [ ] **Step 5: Replace the Controls bar JSX**

Change the Controls bar (currently lines 319-472, i.e. everything from the opening
`{/* Controls bar */}` comment through the closing `</Box>` right before
`{/* Custom request headers */}`) from:

```tsx
                    {/* Controls bar */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* HTTP Method */}
                        <FormControl size="small" sx={{ minWidth: 110 }}>
                            <InputLabel>Method</InputLabel>
                            <Select
                                value={method}
                                label="Method"
                                disabled={isFromRedirect}
                                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                                sx={{
                                    fontWeight: 'bold',
                                    color: getMethodColor(method),
                                }}
                            >
                                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                                    <MenuItem key={m} value={m} sx={{ fontWeight: 'bold', color: getMethodColor(m) }}>
                                        {m}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Resource Type */}
                        <Autocomplete
                            size="small"
                            sx={{ width: 220 }}
                            disabled={isFromRedirect}
                            options={RESOURCE_NAMES}
                            value={selectedResourceType || null}
                            onChange={(_, val) => setSelectedResourceType(val || '')}
                            renderInput={(inputProps) => (
                                <TextField {...inputProps} label="Resource Type" />
                            )}
                        />

                        <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>/</Typography>

                        {operation ? (
                            <>
                                {/* ID input */}
                                <TextField
                                    size="small"
                                    label="ID (optional)"
                                    disabled={isFromRedirect}
                                    value={resourceId}
                                    onChange={(e) => setResourceId(e.target.value)}
                                    sx={{ width: 160 }}
                                />

                                <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>/</Typography>

                                {/* Operation */}
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Operation</InputLabel>
                                    <Select
                                        value={operation}
                                        label="Operation"
                                        disabled={isFromRedirect}
                                        onChange={(e) => setOperation(e.target.value as Operation)}
                                    >
                                        {OPERATIONS.map((op) => (
                                            <MenuItem key={op.value} value={op.value}>
                                                {op.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>/</Typography>

                                {/* Params input */}
                                <TextField
                                    size="small"
                                    label="Query params (optional)"
                                    placeholder="key=value&key2=value2"
                                    value={params}
                                    onChange={(e) => setParams(e.target.value)}
                                    sx={{ minWidth: 200, flex: 1 }}
                                />

                                {/* smartMerge checkbox */}
                                {operation === '$merge' && (
                                    <Tooltip
                                        title="smartMerge true will merge the resource with existing data. false will replace the whole existing resource."
                                        arrow
                                    >
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={smartMerge}
                                                    onChange={(e) => setSmartMerge(e.target.checked)}
                                                    size="small"
                                                />
                                            }
                                            label="smartMerge"
                                        />
                                    </Tooltip>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Operation selector (shows None selected) */}
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Operation</InputLabel>
                                    <Select
                                        value={operation}
                                        label="Operation"
                                        disabled={isFromRedirect}
                                        onChange={(e) => setOperation(e.target.value as Operation)}
                                    >
                                        {OPERATIONS.map((op) => (
                                            <MenuItem key={op.value} value={op.value}>
                                                {op.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Typography sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>/</Typography>

                                {/* Free-text URL suffix / full request path */}
                                <TextField
                                    size="small"
                                    label={selectedResourceType ? 'URL path' : 'Request Path'}
                                    placeholder={
                                        selectedResourceType
                                            ? 'e.g. 123/$graph?contained=true or _search?name=John'
                                            : 'Full path, e.g. /4_0_0/Patient/123 or /version'
                                    }
                                    value={urlSuffix}
                                    onChange={(e) => setUrlSuffix(e.target.value)}
                                    sx={{ flex: 1, minWidth: 250 }}
                                />
                            </>
                        )}

                        <Button
                            variant="contained"
                            onClick={handleSend}
                            disabled={loading || fetching || !requestUrl}
                            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </Button>
                    </Box>
```

to:

```tsx
                    {/* Controls bar */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* HTTP Method */}
                        <FormControl size="small" sx={{ minWidth: 110 }}>
                            <InputLabel>Method</InputLabel>
                            <Select
                                value={method}
                                label="Method"
                                disabled={isFromRedirect}
                                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                                sx={{
                                    fontWeight: 'bold',
                                    color: getMethodColor(method),
                                }}
                            >
                                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                                    <MenuItem key={m} value={m} sx={{ fontWeight: 'bold', color: getMethodColor(m) }}>
                                        {m}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Request path — the literal, complete path sent, unmodified */}
                        <TextField
                            size="small"
                            label="Request Path"
                            placeholder="Full path, e.g. /4_0_0/Patient/123 or /version"
                            value={urlSuffix}
                            onChange={(e) => setUrlSuffix(e.target.value)}
                            sx={{ flex: 1, minWidth: 250 }}
                        />

                        <Button
                            variant="contained"
                            onClick={handleSend}
                            disabled={loading || fetching || !requestUrl}
                            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </Button>
                    </Box>
```

(The Method `<Select>` keeps `disabled={isFromRedirect}` for now — Task 2 removes that.)

- [ ] **Step 6: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged baseline).

- [ ] **Step 7: Verify — manual**

Run: `yarn dev`, log in, open `/api-console`.
- Type a path (e.g. `/version`), confirm Send works and returns the version response.
- Type a path with Method switched to `POST` and a body in the Request Body editor
  (e.g. path `/4_0_0/Patient/123/$merge?smartMerge=false`), confirm it sends correctly.
- Refresh the page after typing a path: confirm `method`/`urlSuffix` restore from the URL
  bar.
- Navigate via `ResourceCard` → "Edit Resource" on any resource: confirm the Request Path
  field arrives pre-filled with `/4_0_0/<resourceType>/<id>/$merge`, Method arrives as
  `POST` (still locked at this point — Task 2 unlocks it), and the Request Body editor
  auto-fills with the current resource's JSON exactly as before.
- Click `Header.tsx`'s "Open in API Console" button (from `feature/open-in-api-console`)
  on any page that has fetched data: confirm it still opens the console correctly
  prefilled — this exercises the `?method=&urlSuffix=` contract this task preserves.

- [ ] **Step 8: Commit**

```bash
git add src/pages/APIConsolePage.tsx
git commit -m "Replace API console's guided builder with a single free-form request path field"
```

---

### Task 2: Unlock the Method dropdown during the redirect flow

**Files:**
- Modify: `src/pages/APIConsolePage.tsx`

**Interfaces:**
- Consumes: Task 1's simplified Controls bar JSX (the Method `<Select>` this task edits).
- Produces: nothing consumed by anything else — this is the final task.

Today, arriving via the `ResourceCard` → "Edit Resource" redirect locks the Method
dropdown at `POST` (`disabled={isFromRedirect}`). With the Resource Type/ID/Operation
controls gone (Task 1) and the Request Path field never having had a lock in the first
place, Method is the only remaining artificially-locked control — this task removes that,
so the redirect flow starts pre-filled with a sensible default (`POST` + the composed
`$merge` path) but nothing is fixed in place.

- [ ] **Step 1: Remove the `disabled` prop from the Method `<Select>`**

In the Controls bar (produced by Task 1, Step 5), change:

```tsx
                            <Select
                                value={method}
                                label="Method"
                                disabled={isFromRedirect}
                                onChange={(e) => setMethod(e.target.value as HttpMethod)}
```

to:

```tsx
                            <Select
                                value={method}
                                label="Method"
                                onChange={(e) => setMethod(e.target.value as HttpMethod)}
```

- [ ] **Step 2: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged baseline). (`isFromRedirect` is still read
elsewhere in this file — the search-param sync effect's early return, and `urlSuffix`'s
initial-value computation — so removing this one usage doesn't make it an unused
variable.)

- [ ] **Step 3: Verify — manual**

Run: `yarn dev`, navigate via `ResourceCard` → "Edit Resource" on any resource. Confirm:
- Method arrives pre-filled as `POST` and the Request Path field arrives pre-filled with
  `/4_0_0/<resourceType>/<id>/$merge`, same as before.
- Method is now changeable (click it, confirm the dropdown opens and a different value can
  be selected) — previously this was disabled.
- Changing Method and/or the Request Path, then clicking Send, sends exactly what's
  currently in the fields (not the original pre-filled values).

- [ ] **Step 4: Commit**

```bash
git add src/pages/APIConsolePage.tsx
git commit -m "Allow editing the Method dropdown in the API console's edit-resource redirect flow"
```

---

## Final manual pass

After both tasks, run through this once more in one sitting:

- [ ] Standalone `/api-console`: guided controls (Resource Type, Operation, ID, params,
      smartMerge) are gone; only Method + Request Path + Send remain.
- [ ] A full GET path with no method override, a POST/PUT/PATCH with a body, and a request
      with query params typed directly into the path (e.g. `/4_0_0/Patient/_search?name=John`)
      all send correctly.
- [ ] `ResourceCard` → "Edit Resource" → `$merge`: pre-filled correctly, both Method and
      the path are now editable, the Request Body editor still auto-fills.
- [ ] `Header.tsx`'s "Open in API Console" button still opens the console correctly
      prefilled from any page that has fetched data.
- [ ] `yarn lint` and `yarn tsc --noEmit` both clean across the whole branch (0 errors, 6
      pre-existing warnings).
