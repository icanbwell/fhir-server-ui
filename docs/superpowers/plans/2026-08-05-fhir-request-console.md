# FHIR Request Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `/api-console` page so a signed-in user can send a request to any path on the FHIR server (not just through the guided resource-type builder), using GET/POST/PUT/PATCH/DELETE, custom headers, and see the response status/headers/body stream in progressively as it arrives — all using the session's existing credentials.

**Architecture:** `FhirApi.sendRequest` (currently a thin wrapper around axios calls that buffer the whole response) is rewritten on top of the browser `fetch()` API so status/headers resolve before the body finishes, and the body can be read chunk-by-chunk via a `ReadableStream` reader. `BaseApi` gains two small protected helpers (`buildHeaders`, `handleUnauthorized`) shared between the existing axios interceptor and the new fetch path, so the auth-header and 401-logout logic isn't duplicated. `APIConsolePage.tsx` gains: a free-form request path (bypassing the resourceType requirement), PATCH support, an editable custom-headers row list, and a Body/Headers tab switcher on the response pane where the Body tab shows raw growing text while streaming and swaps to the existing `PreJson` tree viewer once the response completes and parses as JSON.

**Tech Stack:** React 19 + TypeScript (Vite), MUI components, native `fetch`/`ReadableStream`/`AbortController` (no new npm dependencies).

## Global Constraints

- No new auth code — the session's bearer token keeps being attached automatically; a custom header row can never override or blank `Authorization`.
- The FHIR base URL stays fixed to `EnvironmentContext.fhirUrl` (`REACT_APP_FHIR_SERVER_URL`) — the user types a request *path*, not an arbitrary host.
- No new access control — `/api-console` stays reachable by any authenticated user, exactly as today.
- No request history/persistence — all new state is in-memory `useState`, not synced to `useSearchParams`, and resets on refresh (matches how `resourceJson` already behaves).
- No automated tests — the repo has no test framework today; every task's verification step is manual (`yarn dev` + browser), plus `yarn lint` to catch type/lint errors. Do not introduce a test framework as part of this plan.
- Every task must leave `yarn lint` passing with no new errors (pre-existing warnings in unrelated files, e.g. `CompositionSummary.tsx`, are not this plan's concern).

---

## File Structure

**Modify:**
- `src/api/baseApi.ts` — extract `buildHeaders()`/`handleUnauthorized()` helpers, widen the `RequestParams` method union, widen `getBaseUrl()` visibility to `protected`.
- `src/api/fhirApi.ts` — rewrite `sendRequest` on top of `fetch()` with streaming, custom headers, abort support, and 401 handling.
- `src/pages/APIConsolePage.tsx` — free-form request path, PATCH support, custom-headers editor, response Body/Headers tabs, streaming render, abort-on-resend.

**Create:**
- `src/components/KeyValueRows.tsx` — small presentational key/value row-list component, used both for the editable custom-headers list and the read-only response-headers list.

---

### Task 1: `BaseApi` helper extraction (`buildHeaders`, `handleUnauthorized`)

**Files:**
- Modify: `src/api/baseApi.ts`

**Interfaces:**
- Produces: `protected buildHeaders(extra?: Record<string, string>): Record<string, string>` — returns the same headers the axios interceptor sets today (`Accept`, `Cache-Control`, `Pragma`, `Expires`, `Origin-Service`, `Authorization`), merging in `extra` first so `Authorization` from the session token always wins over anything in `extra`.
- Produces: `protected async handleUnauthorized(status: number | undefined): Promise<void>` — calls `logout(this.setUserDetails)` when `status === 401` and `setUserDetails` is set; no-op otherwise.
- Produces: `protected getBaseUrl(): string` (visibility widened from `private`).
- Produces: `RequestParams['method']` widened to `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'`.
- Consumes: nothing new (pure refactor of existing logic already in the file).

- [ ] **Step 1: Widen `RequestParams['method']` and `getBaseUrl()` visibility**

In `src/api/baseApi.ts`, change:

```typescript
interface RequestParams {
    urlString: string;
    params?: any;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
}
```

to:

```typescript
interface RequestParams {
    urlString: string;
    params?: any;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
}
```

and change:

```typescript
    private getBaseUrl(): string {
        return this.fhirUrl || '';
    }
```

to:

```typescript
    protected getBaseUrl(): string {
        return this.fhirUrl || '';
    }
```

- [ ] **Step 2: Add `buildHeaders` and refactor `requestInterceptor` to use it**

Replace:

```typescript
    requestInterceptor(req: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> {
        let tokenToSendToFhirServer = 'jwt';
        const identityProvider = getLocalData('identityProvider');
        if (identityProvider) {
            const authInfo = new AuthUrlProvider().getAuthInfo(identityProvider);
            tokenToSendToFhirServer = authInfo.tokenToSendToFhirServer || tokenToSendToFhirServer;
        }
        const token = getLocalData(tokenToSendToFhirServer);
        if (typeof token === 'string') {
            req.headers.Authorization = `Bearer ${token}`;
        }
        req.headers.Accept = 'application/json';
        req.headers['Cache-Control'] = 'no-cache';
        req.headers['Pragma'] = 'no-cache';
        req.headers['Expires'] = '0';
        req.headers['Origin-Service'] = 'fhir-ui';
        return req;
    }
```

with:

```typescript
    protected buildHeaders(extra?: Record<string, string>): Record<string, string> {
        let tokenToSendToFhirServer = 'jwt';
        const identityProvider = getLocalData('identityProvider');
        if (identityProvider) {
            const authInfo = new AuthUrlProvider().getAuthInfo(identityProvider);
            tokenToSendToFhirServer = authInfo.tokenToSendToFhirServer || tokenToSendToFhirServer;
        }
        const token = getLocalData(tokenToSendToFhirServer);

        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
            'Origin-Service': 'fhir-ui',
            ...extra,
        };
        if (typeof token === 'string') {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    }

    requestInterceptor(req: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> {
        const headers = this.buildHeaders();
        Object.entries(headers).forEach(([key, value]) => {
            req.headers[key] = value;
        });
        return req;
    }
```

`requestInterceptor` reads `this.buildHeaders()`, so it must be bound to the instance. In the constructor, change:

```typescript
        this.axiosInstance.interceptors.request.use(this.requestInterceptor);
```

to:

```typescript
        this.axiosInstance.interceptors.request.use(this.requestInterceptor.bind(this));
```

- [ ] **Step 3: Add `handleUnauthorized` and use it in `getData`/`request`**

Add this method (anywhere in the class, e.g. right after `buildHeaders`):

```typescript
    protected async handleUnauthorized(status: number | undefined): Promise<void> {
        if (status === 401 && this.setUserDetails) {
            await logout(this.setUserDetails);
        }
    }
```

In `getData`, replace:

```typescript
        } catch (err: any) {
            if (err.response?.status === 401 && this.setUserDetails) {
                await logout(this.setUserDetails);
            }
            return { status: err.response?.status, json: err.response?.data };
        }
```

with:

```typescript
        } catch (err: any) {
            await this.handleUnauthorized(err.response?.status);
            return { status: err.response?.status, json: err.response?.data };
        }
```

In `request`, replace:

```typescript
        } catch (err: any) {
            if (err.response?.status === 401 && this.setUserDetails) {
                await logout(this.setUserDetails);
            }
            return { status: err.response?.status, json: err.response?.data };
        }
```

with:

```typescript
        } catch (err: any) {
            await this.handleUnauthorized(err.response?.status);
            return { status: err.response?.status, json: err.response?.data };
        }
```

- [ ] **Step 4: Verify no regressions**

Run: `yarn lint`
Expected: no new errors (pre-existing warnings in other files are fine).

Run: `yarn dev`, log in, open any FHIR resource list, confirm resources still load (exercises `getData`), and use the existing `/api-console` guided builder to GET/POST a resource (exercises `request`). Both should behave exactly as before this task — this is a pure refactor.

- [ ] **Step 5: Commit**

```bash
git add src/api/baseApi.ts
git commit -m "refactor: extract buildHeaders/handleUnauthorized helpers in BaseApi"
```

---

### Task 2: Rewrite `FhirApi.sendRequest` on `fetch()` with streaming

**Files:**
- Modify: `src/api/fhirApi.ts`

**Interfaces:**
- Consumes: `this.buildHeaders(extra?)`, `this.handleUnauthorized(status)`, `this.getBaseUrl()` (all from Task 1).
- Produces: `sendRequest({ method, urlPath, data, headers?, onChunk?, signal? }): Promise<{ status: number | undefined; json: any; headers: Record<string, string>; rawText: string }>` — later tasks (3–7) call this with additional optional params; none of Task 2's callers need to change, since `headers`/`onChunk`/`signal` are optional and the return object's extra fields (`headers`, `rawText`) can be ignored by existing destructuring.

- [ ] **Step 1: Rewrite `sendRequest`**

In `src/api/fhirApi.ts`, replace:

```typescript
    async sendRequest({
        method,
        urlPath,
        data,
    }: {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        urlPath: string;
        data?: object;
    }) {
        if (method === 'GET') {
            return await this.getData({ urlString: urlPath });
        }
        return await this.request({ urlString: urlPath, method, data });
    }
```

with:

```typescript
    async sendRequest({
        method,
        urlPath,
        data,
        headers,
        onChunk,
        signal,
    }: {
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        urlPath: string;
        data?: object;
        headers?: Record<string, string>;
        onChunk?: (text: string) => void;
        signal?: AbortSignal;
    }): Promise<{ status: number | undefined; json: any; headers: Record<string, string>; rawText: string }> {
        let path = urlPath;
        if (path.includes(window.location.origin)) {
            path = path.replace(window.location.origin, '');
        }
        const url = new URL(path, this.getBaseUrl());
        const requestHeaders = this.buildHeaders({
            'Content-Type': 'application/fhir+json',
            ...headers,
        });

        let response: Response;
        try {
            response = await fetch(url.toString(), {
                method,
                headers: requestHeaders,
                body: data !== undefined ? JSON.stringify(data) : undefined,
                signal,
            });
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                throw err;
            }
            return { status: undefined, json: { error: err.message || 'Request failed' }, headers: {}, rawText: '' };
        }

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        await this.handleUnauthorized(response.status);

        let rawText = '';
        if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            while (!done) {
                const result = await reader.read();
                done = result.done;
                if (result.value) {
                    const chunkText = decoder.decode(result.value, { stream: true });
                    rawText += chunkText;
                    onChunk?.(chunkText);
                }
            }
        } else {
            rawText = await response.text();
            onChunk?.(rawText);
        }

        let json: any;
        try {
            json = rawText ? JSON.parse(rawText) : undefined;
        } catch {
            json = undefined;
        }

        return { status: response.status, json, headers: responseHeaders, rawText };
    }
```

- [ ] **Step 2: Verify no regressions**

Run: `yarn lint`
Expected: no new errors.

Run: `yarn dev`, log in, open `/api-console`. Using the guided builder (pick a resource type):
- Send a GET (e.g. a `_search`), confirm the response renders in the JSON viewer exactly as before.
- Send a POST with a body (e.g. `$merge`), confirm it succeeds.
- Send a PUT and a DELETE against a test resource, confirm both still work.

`APIConsolePage.tsx` needs no changes for this task — `sendRequest`'s new params (`headers`, `onChunk`, `signal`) are all optional, and the existing `const { json, status } = await fhirApi.sendRequest(...)` destructure in `handleSend` still works with the new return shape (it just ignores the extra `headers`/`rawText` fields).

- [ ] **Step 3: Commit**

```bash
git add src/api/fhirApi.ts
git commit -m "feat: rewrite FhirApi.sendRequest on fetch() with streaming support"
```

---

### Task 3: Free-form request path

**Files:**
- Modify: `src/pages/APIConsolePage.tsx`

**Interfaces:**
- Consumes: existing `urlSuffix`/`selectedResourceType` state (`APIConsolePage.tsx:57-70`).
- Produces: `requestUrl` now non-empty whenever `urlSuffix` is set, even with no `selectedResourceType` — later tasks' Send-button logic keys off `requestUrl` being non-empty, not `selectedResourceType`.

- [ ] **Step 1: Let `requestUrl` fall back to a literal path when no resource type is selected**

Replace:

```typescript
    const requestUrl = useMemo(() => {
        if (!selectedResourceType) {
            return '';
        }
        let url = `/4_0_0/${selectedResourceType}`;
```

with:

```typescript
    const requestUrl = useMemo(() => {
        if (!selectedResourceType) {
            if (!urlSuffix) {
                return '';
            }
            return urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`;
        }
        let url = `/4_0_0/${selectedResourceType}`;
```

(The rest of the `useMemo` body — the `operation`/`urlSuffix` branches for when a resource type *is* selected — is unchanged.)

- [ ] **Step 2: Relabel the free-text field when it's acting as a full path**

Replace:

```typescript
                                {/* Free-text URL suffix */}
                                <TextField
                                    size="small"
                                    label="URL path"
                                    placeholder="e.g. 123/$graph?contained=true or _search?name=John"
                                    value={urlSuffix}
                                    onChange={(e) => setUrlSuffix(e.target.value)}
                                    sx={{ flex: 1, minWidth: 250 }}
                                />
```

with:

```typescript
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
```

- [ ] **Step 3: Enable Send based on `requestUrl`, not `selectedResourceType`**

Replace:

```typescript
                            disabled={loading || fetching || !selectedResourceType}
```

with:

```typescript
                            disabled={loading || fetching || !requestUrl}
```

- [ ] **Step 4: Verify**

Run: `yarn lint`
Expected: no new errors.

Run: `yarn dev`, open `/api-console`. Without touching Resource Type or Operation, type `/version` into the "Request Path" field. Confirm the Send button is enabled and the URL preview shows `GET /version`. Click Send, confirm the response renders. Then pick a resource type as before and confirm the guided builder still works unchanged (this is the pre-existing behavior, untouched by this task).

- [ ] **Step 5: Commit**

```bash
git add src/pages/APIConsolePage.tsx
git commit -m "feat: allow a free-form request path in the API console, no resource type required"
```

---

### Task 4: PATCH method support

**Files:**
- Modify: `src/pages/APIConsolePage.tsx`

**Interfaces:**
- Consumes: `FhirApi.sendRequest`'s method union already includes `'PATCH'` (Task 2).
- Produces: `HttpMethod` widened to include `'PATCH'`; later tasks (5–7) can assume `method` may be `'PATCH'`.

- [ ] **Step 1: Widen the `HttpMethod` type**

Replace:

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
```

with:

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
```

- [ ] **Step 2: Add PATCH to the method selector and its color**

Replace:

```typescript
                                {(['GET', 'POST', 'PUT', 'DELETE'] as HttpMethod[]).map((m) => (
```

with:

```typescript
                                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
```

Replace:

```typescript
    const getMethodColor = (m: HttpMethod): string => {
        switch (m) {
            case 'GET': return '#4caf50';
            case 'POST': return '#ff9800';
            case 'PUT': return '#2196f3';
            case 'DELETE': return '#f44336';
        }
    };
```

with:

```typescript
    const getMethodColor = (m: HttpMethod): string => {
        switch (m) {
            case 'GET': return '#4caf50';
            case 'POST': return '#ff9800';
            case 'PUT': return '#2196f3';
            case 'PATCH': return '#9c27b0';
            case 'DELETE': return '#f44336';
        }
    };
```

- [ ] **Step 3: Show the body editor for PATCH too**

Replace:

```typescript
            if (resourceJson.trim() && (method === 'POST' || method === 'PUT')) {
```

with:

```typescript
            if (resourceJson.trim() && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
```

- [ ] **Step 4: Verify**

Run: `yarn lint`
Expected: no new errors (a missing `case 'PATCH'` in `getMethodColor` would be a TypeScript error, not just a lint warning — confirm the build has no type errors).

Run: `yarn dev`, open `/api-console`, select PATCH from the method dropdown. Confirm it shows in purple, the request-body editor appears, and (against a resource/path that supports PATCH) sending succeeds. Confirm GET still hides the body editor.

- [ ] **Step 5: Commit**

```bash
git add src/pages/APIConsolePage.tsx
git commit -m "feat: add PATCH method support to the API console"
```

---

### Task 5: `KeyValueRows` component + custom request headers editor

**Files:**
- Create: `src/components/KeyValueRows.tsx`
- Modify: `src/pages/APIConsolePage.tsx`

**Interfaces:**
- Produces: `KeyValueRow` type (`{ key: string; value: string }`) and `KeyValueRows` component with props `{ rows: KeyValueRow[]; onChange?: (rows: KeyValueRow[]) => void; readOnly?: boolean; keyLabel?: string; valueLabel?: string }` — Task 6 reuses this in read-only mode for response headers.
- Consumes (in `APIConsolePage.tsx`): nothing new from other tasks.

- [ ] **Step 1: Create `KeyValueRows`**

Create `src/components/KeyValueRows.tsx`:

```tsx
import { Box, Button, IconButton, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export interface KeyValueRow {
    key: string;
    value: string;
}

interface KeyValueRowsProps {
    rows: KeyValueRow[];
    onChange?: (rows: KeyValueRow[]) => void;
    readOnly?: boolean;
    keyLabel?: string;
    valueLabel?: string;
}

const KeyValueRows = ({
    rows,
    onChange,
    readOnly = false,
    keyLabel = 'Key',
    valueLabel = 'Value',
}: KeyValueRowsProps) => {
    const updateRow = (index: number, field: 'key' | 'value', newValue: string) => {
        if (!onChange) {
            return;
        }
        const next = rows.map((row, i) => (i === index ? { ...row, [field]: newValue } : row));
        onChange(next);
    };

    const removeRow = (index: number) => {
        if (!onChange) {
            return;
        }
        onChange(rows.filter((_, i) => i !== index));
    };

    const addRow = () => {
        if (!onChange) {
            return;
        }
        onChange([...rows, { key: '', value: '' }]);
    };

    return (
        <Box>
            {rows.map((row, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        label={keyLabel}
                        value={row.key}
                        disabled={readOnly}
                        onChange={(e) => updateRow(index, 'key', e.target.value)}
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        size="small"
                        label={valueLabel}
                        value={row.value}
                        disabled={readOnly}
                        onChange={(e) => updateRow(index, 'value', e.target.value)}
                        sx={{ flex: 1 }}
                    />
                    {!readOnly && (
                        <IconButton size="small" onClick={() => removeRow(index)} aria-label="Remove row">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            ))}
            {!readOnly && (
                <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
                    Add header
                </Button>
            )}
        </Box>
    );
};

export default KeyValueRows;
```

- [ ] **Step 2: Add custom-headers state and editor to `APIConsolePage`**

Add the import near the other component imports:

```typescript
import KeyValueRows, { KeyValueRow } from '../components/KeyValueRows';
```

Add state next to the other `useState` declarations (near `resourceJson`):

```typescript
    const [customHeaders, setCustomHeaders] = useState<KeyValueRow[]>([{ key: '', value: '' }]);
```

Render the editor right after the controls `Box` (the one containing Method/Resource Type/.../Send button) and before the "URL preview" `Typography`:

```tsx
                    {/* Custom request headers */}
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        Request Headers
                    </Typography>
                    <KeyValueRows
                        rows={customHeaders}
                        onChange={setCustomHeaders}
                        keyLabel="Header name"
                        valueLabel="Value"
                    />
```

- [ ] **Step 3: Thread the headers into `handleSend`**

In `handleSend`, before the `fhirApi.sendRequest(...)` call, build the headers map and pass it:

```typescript
            const headersToSend = customHeaders.reduce<Record<string, string>>((acc, row) => {
                if (row.key.trim()) {
                    acc[row.key.trim()] = row.value;
                }
                return acc;
            }, {});
            const { json, status } = await fhirApi.sendRequest({
                method,
                urlPath: requestUrl,
                data,
                headers: headersToSend,
            });
```

- [ ] **Step 4: Verify**

Run: `yarn lint`
Expected: no new errors.

Run: `yarn dev`, open `/api-console`. Confirm a "Request Headers" section with one empty row appears, with an "Add header" button. Add a row with name `X-Test-Header` and value `hello`, send a request, open the browser DevTools Network tab, inspect the outgoing request, and confirm `x-test-header: hello` is present. Remove the row and confirm sending still works with no custom headers.

- [ ] **Step 5: Commit**

```bash
git add src/components/KeyValueRows.tsx src/pages/APIConsolePage.tsx
git commit -m "feat: add custom request headers editor to the API console"
```

---

### Task 6: Response headers tab

**Files:**
- Modify: `src/pages/APIConsolePage.tsx`

**Interfaces:**
- Consumes: `KeyValueRows` (Task 5, used here in read-only mode), `sendRequest`'s `headers` return field (Task 2).
- Produces: `responseHeaders` state and `activeResponseTab` state — Task 7 resets both at the start of every send.

- [ ] **Step 1: Add response-headers and active-tab state**

Add near the other response state (`responseJson`, `responseStatus`):

```typescript
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
    const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
```

- [ ] **Step 2: Capture headers in `handleSend`**

Where response state is reset (alongside `setResponseJson(null); setResponseStatus(null);`), add:

```typescript
            setResponseHeaders({});
```

Where the response is set after a successful send, change:

```typescript
            const { json, status } = await fhirApi.sendRequest({
                method,
                urlPath: requestUrl,
                data,
                headers: headersToSend,
            });
            setResponseStatus(status);
            setResponseJson(json);
```

to:

```typescript
            const { json, status, headers } = await fhirApi.sendRequest({
                method,
                urlPath: requestUrl,
                data,
                headers: headersToSend,
            });
            setResponseStatus(status);
            setResponseJson(json);
            setResponseHeaders(headers || {});
```

- [ ] **Step 3: Add the Body/Headers tab switcher and render the Headers tab**

Add `Tabs`/`Tab` to the MUI import list at the top of the file:

```typescript
    Tab,
    Tabs,
```

Replace the response pane's header `Box`:

```tsx
                            <Box
                                sx={{
                                    p: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Typography variant="subtitle2">Response</Typography>
                                {responseStatus !== null && (
                                    <Chip
                                        label={responseStatus}
                                        size="small"
                                        color={getStatusColor(responseStatus)}
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                                {responseJson ? (
                                    <PreJson data={responseJson} collapsed={2} />
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                    >
                                        Response will appear here after sending...
                                    </Typography>
                                )}
                            </Box>
```

with:

```tsx
                            <Box
                                sx={{
                                    p: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <Typography variant="subtitle2">Response</Typography>
                                {responseStatus !== null && (
                                    <Chip
                                        label={responseStatus}
                                        size="small"
                                        color={getStatusColor(responseStatus)}
                                        variant="outlined"
                                    />
                                )}
                                <Tabs
                                    value={activeResponseTab}
                                    onChange={(_, val) => setActiveResponseTab(val)}
                                    sx={{ minHeight: 0, ml: 'auto' }}
                                >
                                    <Tab label="Body" value="body" sx={{ minHeight: 0, py: 0.5 }} />
                                    <Tab label="Headers" value="headers" sx={{ minHeight: 0, py: 0.5 }} />
                                </Tabs>
                            </Box>
                            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                                {activeResponseTab === 'headers' ? (
                                    Object.keys(responseHeaders).length > 0 ? (
                                        <KeyValueRows
                                            rows={Object.entries(responseHeaders).map(([key, value]) => ({
                                                key,
                                                value,
                                            }))}
                                            readOnly
                                        />
                                    ) : (
                                        <Typography
                                            variant="body2"
                                            sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                        >
                                            No response headers yet.
                                        </Typography>
                                    )
                                ) : responseJson ? (
                                    <PreJson data={responseJson} collapsed={2} />
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                    >
                                        Response will appear here after sending...
                                    </Typography>
                                )}
                            </Box>
```

- [ ] **Step 4: Verify**

Run: `yarn lint`
Expected: no new errors.

Run: `yarn dev`, open `/api-console`, send any request. Confirm the response pane now shows "Body"/"Headers" tabs. Click "Headers", confirm a list of real response headers (e.g. `content-type`) appears. Click back to "Body", confirm the JSON viewer still renders as before.

- [ ] **Step 5: Commit**

```bash
git add src/pages/APIConsolePage.tsx
git commit -m "feat: show response headers in a Headers tab on the API console"
```

---

### Task 7: Streaming body rendering + request cancellation

**Files:**
- Modify: `src/pages/APIConsolePage.tsx`

**Interfaces:**
- Consumes: `sendRequest`'s `onChunk`/`signal` params (Task 2), `activeResponseTab`/`responseHeaders` (Task 6).
- Produces: final `handleSend` implementation; no further tasks depend on this one.

- [ ] **Step 1: Add streaming and abort state**

Add near the other state declarations:

```typescript
    const [streamedText, setStreamedText] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);
```

Add a cleanup effect (near the other `useEffect`s) so navigating away or unmounting aborts any in-flight request:

```typescript
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);
```

- [ ] **Step 2: Rewrite `handleSend` to stream and support cancellation**

Replace the whole `handleSend` function:

```typescript
    const handleSend = async () => {
        if (!fhirUrl || !requestUrl) {
            return;
        }
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setLoading(true);
            setIsStreaming(true);
            setResponseJson(null);
            setResponseStatus(null);
            setResponseHeaders({});
            setStreamedText('');
            const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
            let data: object | undefined;
            if (resourceJson.trim() && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                data = JSON.parse(resourceJson);
            }
            const headersToSend = customHeaders.reduce<Record<string, string>>((acc, row) => {
                if (row.key.trim()) {
                    acc[row.key.trim()] = row.value;
                }
                return acc;
            }, {});
            const { json, status, headers } = await fhirApi.sendRequest({
                method,
                urlPath: requestUrl,
                data,
                headers: headersToSend,
                signal: controller.signal,
                onChunk: (chunk) => setStreamedText((prev) => prev + chunk),
            });
            setResponseStatus(status);
            setResponseJson(json);
            setResponseHeaders(headers || {});
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                return;
            }
            if (error instanceof SyntaxError) {
                setResponseStatus(null);
                setResponseJson({ error: 'Invalid JSON in editor' });
            } else {
                setResponseStatus(null);
                setResponseJson({ error: error.message || 'Request failed' });
            }
        } finally {
            setIsStreaming(false);
            setLoading(false);
        }
    };
```

- [ ] **Step 3: Render growing raw text while streaming, and update the Body tab label**

Replace the Body-tab `<Tab>`:

```tsx
                                    <Tab label="Body" value="body" sx={{ minHeight: 0, py: 0.5 }} />
```

with:

```tsx
                                    <Tab
                                        label={isStreaming ? 'Body (Receiving…)' : 'Body'}
                                        value="body"
                                        sx={{ minHeight: 0, py: 0.5 }}
                                    />
```

Replace the Body-tab content branch:

```tsx
                                ) : responseJson ? (
                                    <PreJson data={responseJson} collapsed={2} />
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                    >
                                        Response will appear here after sending...
                                    </Typography>
                                )}
```

with:

```tsx
                                ) : isStreaming ? (
                                    <Typography
                                        component="pre"
                                        sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', m: 0 }}
                                    >
                                        {streamedText}
                                    </Typography>
                                ) : responseJson ? (
                                    <PreJson data={responseJson} collapsed={2} />
                                ) : streamedText ? (
                                    <Typography
                                        component="pre"
                                        sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', m: 0 }}
                                    >
                                        {streamedText}
                                    </Typography>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                                    >
                                        Response will appear here after sending...
                                    </Typography>
                                )}
```

- [ ] **Step 4: Verify**

Run: `yarn lint`
Expected: no new errors.

Run: `yarn dev`, open `/api-console`, and check each of these manually:
- Send a request that returns a large bundle (e.g. an unbounded `_search` on a resource type with many records). Confirm the Body tab's raw text visibly grows over time (watch it fill in) rather than appearing all at once, the tab label shows "Body (Receiving…)" while it's in progress, and once it finishes the view swaps to the pretty `PreJson` tree.
- While a large request is still streaming, click Send again on a different (fast) request. Confirm the first request's late-arriving chunks never show up mixed into the second response (i.e. `streamedText` doesn't contain a jumble of both responses).
- Send a request to a path that returns an empty or non-JSON body (e.g. a `HEAD`-like empty 204, or any path returning plain text). Confirm the Body tab falls back to showing the raw text (possibly empty) instead of erroring.
- Click into `/api-console` via a resource's "API Console" redirect link (the `ResourceCard`-driven flow, if you have a resource with such a link) and confirm it still auto-fetches and disables fields exactly as before — this flow doesn't touch any of the new streaming logic.

- [ ] **Step 5: Commit**

```bash
git add src/pages/APIConsolePage.tsx
git commit -m "feat: stream the API console response body as it arrives, with request cancellation"
```
