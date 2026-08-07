# Connections Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/connections` list page and a `/connections/:serviceSlug/console` page
that let a logged-in user browse their Aperture Token Service (ATS) connections and run
free-form FHIR requests against a chosen connection's own FHIR server, using that
connection's own token.

**Architecture:** A new `TokenServiceApi` (extends the existing `BaseApi`) talks to ATS
using the session's existing bearer token, unchanged auth plumbing. A new
`ConnectionFhirApi` (standalone, not `BaseApi`-based) talks to a connection's own FHIR
server using that connection's token instead. Both the existing `FhirApi.sendRequest` and
the new `ConnectionFhirApi.sendRequest` delegate their actual fetch/streaming/parsing
mechanics to a newly extracted `src/utils/streamingFetch.ts`, so that logic exists once.
Two new page components (`ConnectionsListPage`, `ConnectionConsolePage`) provide the UI;
`Header.tsx` gets one new nav icon to reach the list page.

**Tech Stack:** React 19, TypeScript, MUI v9, react-router-dom v7, Vite, axios (via the
existing `BaseApi`).

## Global Constraints

- **No automated test framework exists in this repo** (no jest/vitest/playwright/cucumber
  in `package.json`, no `*.test.*` files). Every task below replaces the "write a failing
  test" TDD cycle with: make the change, run `yarn lint` and `yarn tsc --noEmit` (must
  stay at 0 errors; baseline is 6 pre-existing `security/*` warnings — that count must not
  increase), then manually verify via `yarn dev` per the task's manual-check steps.
- **`FhirApi.sendRequest`'s observable behavior must not change.** Task 1 extracts its
  streaming mechanics into a shared utility; the extraction must be behavior-preserving
  (same return shape, same abort semantics, same streaming/partial-body-on-drop handling).
- **`ConnectionFhirApi` must never call `handleUnauthorized`.** A 401 from a connection's
  own FHIR server means that connection's token is stale — it must not log the user out of
  this app. Only `TokenServiceApi` (talking to ATS itself, using the session token) uses
  the inherited `handleUnauthorized`.
- **`ConnectionFhirApi`/`ConnectionConsolePage` must never call `LastRequestContext`'s
  `recordRequest`.** Doing so would make `Header.tsx`'s "Open in API Console" button
  offer to replay a third-party FHIR server's request against this app's own FHIR server.
  Simply never wiring it up is the entire fix — no conditional logic needed.
- **New env var `REACT_APP_TOKEN_SERVICE_URL`.** Confirmed hosts: dev
  `https://aperture-token-service.dev-ue1.icanbwell.com/api/v1.0` (from
  `aperture_token_service/.helm/dev-ue1.values.yaml`'s ingress host config + the
  `/api/v1.0` prefix in `aperture_token_service/main.py`), staging
  `https://aperture-token-service.staging-ue1.icanbwell.com/api/v1.0`, prod
  `https://aperture-token-service-pipelines.prod.bwell.zone/api/v1.0`. Both new pages must
  still show a clear config-error message (not crash) if this env var is ever unset,
  mirroring `BwellAppLogin.tsx`'s `configError` pattern.
- **This feature only works with b.well App (`bwellapp`) logins.** `ConnectionsListPage`
  must show an informational banner (not a hard block) when
  `getLocalData('identityProvider') !== 'bwellapp'`.
- **Trailing slash is required** on the token-fetch URL:
  `/all-tokens/{serviceSlug}/?member_id=...` — ATS 302-redirects a request missing it, and
  `Authorization` doesn't survive that redirect.

---

### Task 1: Extract shared streaming-fetch utility from `FhirApi.sendRequest`

**Files:**
- Create: `src/utils/streamingFetch.ts`
- Modify: `src/api/fhirApi.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `sendStreamingRequest(params): Promise<StreamingFetchResult>` and the
  `StreamingFetchResult` type, both exported from `src/utils/streamingFetch.ts`. Task 4
  (`ConnectionFhirApi`) imports both. `FhirApi.sendRequest`'s own exported signature and
  return shape are unchanged — this task is a pure internal refactor of that method.

- [ ] **Step 1: Create the shared utility**

Create `src/utils/streamingFetch.ts`:

```ts
export interface StreamingFetchResult {
    status: number | undefined;
    json: any;
    headers: Record<string, string>;
    rawText: string;
    incomplete?: boolean;
}

export interface StreamingFetchParams {
    url: string;
    method: string;
    data?: object;
    headers: Record<string, string>;
    signal?: AbortSignal;
    onChunk?: (text: string) => void;
    onHeaders?: (status: number, headers: Record<string, string>) => void;
}

// Pure fetch/streaming/parsing mechanics, extracted from FhirApi.sendRequest so
// ConnectionFhirApi (a different trust boundary — a connection's own FHIR server, not
// this app's configured one) can reuse the same streaming/abort/partial-body handling
// without duplicating it. Deliberately has no knowledge of sessions, origins, or auth —
// callers build `headers` (including Authorization) and validate `url` themselves.
export async function sendStreamingRequest({
    url,
    method,
    data,
    headers,
    signal,
    onChunk,
    onHeaders,
}: StreamingFetchParams): Promise<StreamingFetchResult> {
    let response: Response;
    try {
        response = await fetch(url, {
            method,
            headers,
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

    // Surface status/headers to the caller as soon as fetch() resolves — i.e. before the
    // body streaming loop below starts — so the UI can populate them without waiting for
    // the whole body to arrive.
    onHeaders?.(response.status, responseHeaders);

    let rawText = '';
    try {
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
    } catch (err: any) {
        if (err?.name === 'AbortError') {
            throw err;
        }
        // A mid-stream connection drop rejects here. The status/headers were already
        // surfaced via onHeaders and the partial body via onChunk, so resolve with what
        // arrived instead of throwing — the caller's catch-all would otherwise discard
        // both in favor of a generic error.
        let partialJson: any;
        try {
            partialJson = rawText ? JSON.parse(rawText) : undefined;
        } catch {
            partialJson = undefined;
        }
        return {
            status: response.status,
            json: partialJson,
            headers: responseHeaders,
            rawText,
            incomplete: true,
        };
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

- [ ] **Step 2: Rewrite `FhirApi.sendRequest` to delegate to it**

In `src/api/fhirApi.ts`, add the import at the top:

```ts
import { sendStreamingRequest, StreamingFetchResult } from '../utils/streamingFetch';
```

Replace the entire `sendRequest` method (currently the block starting
`async sendRequest({` through its closing `}` right before the final closing `}` of the
class) with:

```ts
    async sendRequest({
        method,
        urlPath,
        data,
        headers,
        onChunk,
        onHeaders,
        signal,
    }: {
        method: HttpMethod;
        urlPath: string;
        data?: object;
        headers?: Record<string, string>;
        onChunk?: (text: string) => void;
        onHeaders?: (status: number, headers: Record<string, string>) => void;
        signal?: AbortSignal;
    }): Promise<StreamingFetchResult> {
        let path = urlPath;
        if (path.startsWith(window.location.origin)) {
            path = path.slice(window.location.origin.length);
        }
        const url = new URL(path, this.getBaseUrl());

        // The session's bearer token must never leave the configured FHIR server. A
        // scheme-relative path (e.g. "//evil.com/collect") resolves to a different origin via
        // new URL(), so compare the resolved origin against the base URL's origin and refuse
        // before any fetch happens. This is the single chokepoint every URL mode goes through
        // (guided builder and free-form path alike), so the invariant can't be re-broken in the UI.
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

        const result = await sendStreamingRequest({
            url: url.toString(),
            method,
            data,
            headers: requestHeaders,
            signal,
            onChunk,
            onHeaders,
        });

        // Moved from "before reading the body" to "after the full result is known" — this
        // check only depends on the response status, not the body, so the timing change is
        // not observable by a user; it just lets the fetch/stream mechanics live in one
        // shared, auth-agnostic place (see streamingFetch.ts).
        await this.handleUnauthorized(result.status);

        return result;
    }
```

Do not change any other method in this file (`getResource`, `getBundleAsync`,
`addMissingRequiredParams`, `getUrl`, `mergeResource` are untouched).

- [ ] **Step 3: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged baseline).

- [ ] **Step 4: Verify — manual, confirms no behavior change**

Run `yarn dev`, log in, open `/api-console`:
- Send a plain GET (e.g. `/version`) — confirms basic request/response still works.
- Send a request that returns a large-ish bundle and watch the Response panel — confirms
  streaming (the "Body (Receiving…)" tab label appears while in flight) still works.
- Send a request with an intentionally bad path that 401s (or manually corrupt the stored
  token in dev tools) — confirms the app still logs out on a 401 exactly as before.

- [ ] **Step 5: Commit**

```bash
git add src/utils/streamingFetch.ts src/api/fhirApi.ts
git commit -m "Extract shared streaming-fetch utility from FhirApi.sendRequest"
```

---

### Task 2: Add `ConnectionEntry` types and `TokenServiceApi`

**Files:**
- Create: `src/types/connectionEntry.ts`
- Create: `src/api/tokenServiceApi.ts`
- Modify: `docker-compose.yml`

**Interfaces:**
- Consumes: `BaseApi` (`src/api/baseApi.ts`), unchanged.
- Produces: `ConnectionEntry`, `ListConnectionsResponse`, `ConnectionToken` types from
  `src/types/connectionEntry.ts`; `TokenServiceApi` class from `src/api/tokenServiceApi.ts`
  with `listConnections(params?): Promise<ListConnectionsResponse>` and
  `getConnectionToken({serviceSlug, memberId}): Promise<ConnectionToken>`. Tasks 5 and 6
  (the two new pages) consume both.

- [ ] **Step 1: Add the types**

Create `src/types/connectionEntry.ts`:

```ts
export interface ConnectionEntry {
    bwell_fhir_person_id: string;
    client_fhir_person_id: string;
    member_id: string;
    patient_id: string;
    display_name: string;
    service_slug: string;
    category: string;
    status: string;
    fhir_url: string;
    fhir_version: string;
    expiry: string;
    unique_identifier: string;
    scope: string;
    custom_fhir_api_headers?: string;
}

export interface ListConnectionsResponse {
    data: ConnectionEntry[];
    next_cursor: string | null;
}

export interface ConnectionToken {
    token: string;
    url: string;
    fhir_version: string;
    patient_id: string;
    expiry: string;
}
```

- [ ] **Step 2: Add `TokenServiceApi`**

Create `src/api/tokenServiceApi.ts`:

```ts
import BaseApi from './baseApi';
import { ConnectionToken, ListConnectionsResponse } from '../types/connectionEntry';

interface ListConnectionsParams {
    category?: string;
    serviceSlug?: string;
    cursor?: string;
    limit?: number;
}

class TokenServiceApi extends BaseApi {
    async listConnections(params: ListConnectionsParams = {}): Promise<ListConnectionsResponse> {
        const queryParams: Record<string, string> = {
            limit: String(params.limit ?? 50),
        };
        if (params.category) {
            queryParams.category = params.category;
        }
        if (params.serviceSlug) {
            queryParams.service_slug = params.serviceSlug;
        }
        if (params.cursor) {
            queryParams.cursor = params.cursor;
        }

        const { json } = await this.getData({ urlString: '/tokens', params: queryParams });
        return json ?? { data: [], next_cursor: null };
    }

    async getConnectionToken({
        serviceSlug,
        memberId,
    }: {
        serviceSlug: string;
        memberId: string;
    }): Promise<ConnectionToken> {
        // Trailing slash before the query string is required: ATS 302-redirects a request
        // missing it, and the Authorization header does not survive that redirect.
        const { json } = await this.getData({
            urlString: `/all-tokens/${encodeURIComponent(serviceSlug)}/`,
            params: { member_id: memberId },
        });
        return json;
    }
}

export default TokenServiceApi;
```

- [ ] **Step 3: Wire the new env var into `docker-compose.yml`**

In `docker-compose.yml`, find the line `REACT_APP_FHIR_SERVER_URL: ...` (in the dev
service's `environment:` block) and add immediately after it:

```yaml
      # Aperture Token Service (ATS) base URL, used by the /connections screens.
      REACT_APP_TOKEN_SERVICE_URL: ${REACT_APP_TOKEN_SERVICE_URL:-https://aperture-token-service.dev-ue1.icanbwell.com/api/v1.0}
```

- [ ] **Step 4: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged baseline).

- [ ] **Step 5: Commit**

```bash
git add src/types/connectionEntry.ts src/api/tokenServiceApi.ts docker-compose.yml
git commit -m "Add ConnectionEntry types and TokenServiceApi client"
```

---

### Task 3: Add `ConnectionFhirApi`

**Files:**
- Create: `src/api/connectionFhirApi.ts`

**Interfaces:**
- Consumes: `sendStreamingRequest`/`StreamingFetchResult` (Task 1), `HttpMethod` (from
  `src/context/LastRequestContext.ts`, already exported today).
- Produces: `ConnectionFhirApi` class, constructed with
  `{baseUrl: string, token: string, customHeaders?: Record<string, string>}`, exposing
  `sendRequest(params): Promise<StreamingFetchResult>` with the same param shape
  `FhirApi.sendRequest` uses (`method`, `urlPath`, `data?`, `headers?`, `onChunk?`,
  `onHeaders?`, `signal?`). Task 6 (`ConnectionConsolePage`) consumes this directly.

- [ ] **Step 1: Create the class**

Create `src/api/connectionFhirApi.ts`:

```ts
import { sendStreamingRequest, StreamingFetchResult } from '../utils/streamingFetch';
import { HttpMethod } from '../context/LastRequestContext';

interface ConnectionFhirApiParams {
    baseUrl: string;
    token: string;
    customHeaders?: Record<string, string>;
}

// Deliberately independent of BaseApi: BaseApi's axios interceptor always attaches the
// local session's own bearer token, which is exactly wrong here — every request this
// class sends must carry the connection's own token instead, never the session's. It
// also never calls handleUnauthorized: a 401 from a connection's FHIR server means that
// connection's token is stale, not that the user's b.well session is invalid, and must
// not log the user out of this app.
class ConnectionFhirApi {
    private readonly baseUrl: string;
    private readonly token: string;
    private readonly customHeaders: Record<string, string>;

    constructor({ baseUrl, token, customHeaders }: ConnectionFhirApiParams) {
        this.baseUrl = baseUrl;
        this.token = token;
        this.customHeaders = customHeaders || {};
    }

    async sendRequest({
        method,
        urlPath,
        data,
        headers,
        onChunk,
        onHeaders,
        signal,
    }: {
        method: HttpMethod;
        urlPath: string;
        data?: object;
        headers?: Record<string, string>;
        onChunk?: (text: string) => void;
        onHeaders?: (status: number, headers: Record<string, string>) => void;
        signal?: AbortSignal;
    }): Promise<StreamingFetchResult> {
        let url: URL;
        try {
            url = new URL(urlPath, this.baseUrl);
        } catch {
            return { status: undefined, json: { error: 'Invalid request path' }, headers: {}, rawText: '' };
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return {
                status: undefined,
                json: { error: 'Only http(s) requests are supported' },
                headers: {},
                rawText: '',
            };
        }

        // Same case-insensitive-merge approach as BaseApi.buildHeaders: keyed by lower-cased
        // name so "Content-Type" and "content-type" can't both survive into the Headers the
        // browser sends, with the original casing preserved (some source systems' custom
        // headers may be case-sensitive in practice even though HTTP header names formally
        // aren't). Precedence, lowest to highest: defaults, this connection's mandated
        // headers, the caller's own headers (Authorization excluded), then Authorization —
        // which always resolves to the connection's token and can never be overridden.
        const merged = new Map<string, { name: string; value: string }>();
        const setHeader = (name: string, value: string) => {
            merged.set(name.toLowerCase(), { name, value });
        };
        setHeader('Content-Type', 'application/fhir+json');
        setHeader('Accept', 'application/fhir+json');
        Object.entries(this.customHeaders).forEach(([name, value]) => setHeader(name, value));
        Object.entries(headers || {}).forEach(([name, value]) => {
            if (name.toLowerCase() !== 'authorization') {
                setHeader(name, value);
            }
        });
        setHeader('Authorization', `Bearer ${this.token}`);

        const requestHeaders = Object.fromEntries(
            Array.from(merged.values(), ({ name, value }) => [name, value] as [string, string])
        );

        return sendStreamingRequest({
            url: url.toString(),
            method,
            data,
            headers: requestHeaders,
            signal,
            onChunk,
            onHeaders,
        });
    }
}

export default ConnectionFhirApi;
```

- [ ] **Step 2: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged baseline).

- [ ] **Step 3: Commit**

```bash
git add src/api/connectionFhirApi.ts
git commit -m "Add ConnectionFhirApi for calling a Token Service connection's own FHIR server"
```

---

### Task 4: `ConnectionsListPage` and route

**Files:**
- Create: `src/pages/ConnectionsListPage.tsx`
- Modify: `src/routes/fhirRoutes.tsx`

**Interfaces:**
- Consumes: `TokenServiceApi` (Task 2), `EnvironmentContext` (for
  `REACT_APP_TOKEN_SERVICE_URL` — read directly via `import.meta.env`, matching how
  `BwellAppLogin.tsx` reads its own config vars, since this isn't part of the shared
  `EnvContext` shape), `UserContext` (for `setUserDetails`, needed by `TokenServiceApi`'s
  inherited `handleUnauthorized`), `getLocalData` (existing,
  `src/utils/localData.utils.ts`, to check `identityProvider`).
- Produces: route `/connections`. Task 5 (`ConnectionConsolePage`) is what a row
  navigates to; it depends on this task's navigation `state` shape:
  `{ connection: ConnectionEntry }`.

- [ ] **Step 1: Create the page**

Create `src/pages/ConnectionsListPage.tsx`:

```tsx
import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    List,
    ListItemButton,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TokenServiceApi from '../api/tokenServiceApi';
import UserContext from '../context/UserContext';
import { getLocalData } from '../utils/localData.utils';
import { ConnectionEntry } from '../types/connectionEntry';

const ConnectionsListPage = () => {
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();

    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;
    const isBwellAppLogin = getLocalData('identityProvider') === 'bwellapp';

    const [connections, setConnections] = useState<ConnectionEntry[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [category, setCategory] = useState<string>('All');
    const [search, setSearch] = useState<string>('');

    const loadConnections = async (cursor?: string) => {
        if (!tokenServiceUrl) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const response = await api.listConnections({ cursor });
            setConnections((prev) => (cursor ? [...prev, ...response.data] : response.data));
            setNextCursor(response.next_cursor);
        } catch {
            setError('Failed to load connections.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConnections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenServiceUrl]);

    const categories = useMemo(() => {
        const unique = new Set(connections.map((c) => c.category));
        return ['All', ...Array.from(unique)];
    }, [connections]);

    const filtered = useMemo(() => {
        return connections.filter((c) => {
            if (category !== 'All' && c.category !== category) {
                return false;
            }
            if (!search.trim()) {
                return true;
            }
            const needle = search.trim().toLowerCase();
            return (
                c.display_name.toLowerCase().includes(needle) ||
                c.service_slug.toLowerCase().includes(needle)
            );
        });
    }, [connections, category, search]);

    const handleSelect = (connection: ConnectionEntry) => {
        navigate(
            `/connections/${encodeURIComponent(connection.service_slug)}/console?member_id=${encodeURIComponent(connection.member_id)}`,
            { state: { connection } }
        );
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Connections
                    </Typography>

                    {!isBwellAppLogin && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Connections only work when signed in with b.well App login.
                        </Alert>
                    )}

                    {!tokenServiceUrl ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={category}
                                        label="Category"
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        {categories.map((c) => (
                                            <MenuItem key={c} value={c}>
                                                {c}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    size="small"
                                    label="Search"
                                    placeholder="Display name or service slug"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    sx={{ flex: 1, minWidth: 250 }}
                                />
                            </Box>

                            {error && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography color="error">{error}</Typography>
                                    <Button onClick={() => loadConnections()}>Retry</Button>
                                </Box>
                            )}

                            {loading && connections.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : filtered.length === 0 ? (
                                <Typography color="text.secondary">No connections found.</Typography>
                            ) : (
                                <List>
                                    {filtered.map((connection) => (
                                        <ListItemButton
                                            key={connection.unique_identifier}
                                            onClick={() => handleSelect(connection)}
                                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}
                                        >
                                            <ListItemText
                                                primary={connection.display_name}
                                                secondary={`${connection.service_slug} · ${connection.fhir_version} · expires ${connection.expiry}`}
                                            />
                                            <Chip label={connection.category} size="small" sx={{ mr: 1 }} />
                                            <Chip label={connection.status} size="small" variant="outlined" />
                                        </ListItemButton>
                                    ))}
                                </List>
                            )}

                            {nextCursor && !loading && (
                                <Button onClick={() => loadConnections(nextCursor)}>Load more</Button>
                            )}
                        </>
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionsListPage;
```

- [ ] **Step 2: Add the route**

In `src/routes/fhirRoutes.tsx`, add the lazy import alongside the others:

```tsx
const ConnectionsListPage = lazy(() => import('../pages/ConnectionsListPage'));
```

And add the route entry alongside the `apiConsole` route:

```tsx
    <Route key="connections" path="/connections" element={<ConnectionsListPage />} />,
```

- [ ] **Step 3: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged baseline).

- [ ] **Step 4: Verify — manual**

Run `yarn dev`, log in, navigate to `/connections`:
- With `REACT_APP_TOKEN_SERVICE_URL` unset: confirms the config-error message shows
  instead of a crash.
- Logged in via Cognito/Okta (not b.well App): confirms the "only works with b.well App
  login" banner shows.
- Logged in via b.well App: confirms the banner is absent, and the list loads, category
  filter and search narrow it, and "Load more" appears/works if `next_cursor` is present.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ConnectionsListPage.tsx src/routes/fhirRoutes.tsx
git commit -m "Add ConnectionsListPage and /connections route"
```

---

### Task 5: `ConnectionConsolePage` and route

**Files:**
- Create: `src/pages/ConnectionConsolePage.tsx`
- Modify: `src/routes/fhirRoutes.tsx`

**Interfaces:**
- Consumes: `TokenServiceApi`, `ConnectionFhirApi` (Tasks 2–3), `ConnectionEntry`/
  `ConnectionToken` types (Task 2), `KeyValueRows`/`KeyValueRow` (existing,
  `src/components/KeyValueRows.tsx`), `PreJson` (existing, `src/components/PreJson.tsx`),
  `HttpMethod` (existing, `src/context/LastRequestContext.ts`), navigation `state` shape
  `{ connection: ConnectionEntry }` produced by Task 4.
- Produces: route `/connections/:serviceSlug/console`. Nothing else depends on this task.

- [ ] **Step 1: Create the page**

Create `src/pages/ConnectionConsolePage.tsx`:

```tsx
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
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
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PreJson from '../components/PreJson';
import KeyValueRows, { KeyValueRow } from '../components/KeyValueRows';
import TokenServiceApi from '../api/tokenServiceApi';
import ConnectionFhirApi from '../api/connectionFhirApi';
import UserContext from '../context/UserContext';
import { HttpMethod } from '../context/LastRequestContext';
import { ConnectionEntry, ConnectionToken } from '../types/connectionEntry';

const parseCustomHeaders = (raw?: string): Record<string, string> => {
    if (!raw) {
        return {};
    }
    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
};

const ConnectionConsolePage = () => {
    const { setUserDetails } = useContext(UserContext);
    const { serviceSlug } = useParams();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const memberId = searchParams.get('member_id') || '';

    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;

    const [connection, setConnection] = useState<ConnectionEntry | null>(
        (location.state as { connection?: ConnectionEntry } | null)?.connection || null
    );
    const [connectionToken, setConnectionToken] = useState<ConnectionToken | null>(null);
    const [loadingConnection, setLoadingConnection] = useState<boolean>(false);
    const [loadingToken, setLoadingToken] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [method, setMethod] = useState<HttpMethod>('GET');
    const [urlSuffix, setUrlSuffix] = useState<string>('');
    const [resourceJson, setResourceJson] = useState<string>('');
    const [customHeaders, setCustomHeaders] = useState<KeyValueRow[]>([{ key: '', value: '' }]);
    const [activeRequestTab, setActiveRequestTab] = useState<'body' | 'headers'>('body');
    const [responseJson, setResponseJson] = useState<object | null>(null);
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
    const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
    const [loading, setLoading] = useState<boolean>(false);
    const [streamedText, setStreamedText] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [responseIncomplete, setResponseIncomplete] = useState<boolean>(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    const connectionMandatedHeaders = useMemo(
        () => parseCustomHeaders(connection?.custom_fhir_api_headers),
        [connection]
    );

    // Resolve connection metadata: prefer the fast path from a ConnectionsListPage click
    // (already in router state), fall back to re-fetching by slug for a bookmarked/
    // refreshed URL that never went through the list page.
    useEffect(() => {
        if (connection || !tokenServiceUrl || !serviceSlug) {
            return;
        }
        const resolveConnection = async () => {
            setLoadingConnection(true);
            setError(null);
            try {
                const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
                const response = await api.listConnections({ serviceSlug });
                if (response.data[0]) {
                    setConnection(response.data[0]);
                } else {
                    setError(`No connection found for service slug "${serviceSlug}".`);
                }
            } catch {
                setError('Failed to load connection details.');
            } finally {
                setLoadingConnection(false);
            }
        };
        resolveConnection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connection, tokenServiceUrl, serviceSlug]);

    const fetchToken = useCallback(async () => {
        if (!tokenServiceUrl || !serviceSlug || !memberId) {
            return;
        }
        setLoadingToken(true);
        setError(null);
        try {
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const token = await api.getConnectionToken({ serviceSlug, memberId });
            setConnectionToken(token);
        } catch {
            setError('Failed to fetch a token for this connection.');
        } finally {
            setLoadingToken(false);
        }
    }, [tokenServiceUrl, serviceSlug, memberId, setUserDetails]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    const requestUrl = useMemo(() => {
        if (!urlSuffix) {
            return '';
        }
        return urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`;
    }, [urlSuffix]);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handleSend = async () => {
        if (!connectionToken || !requestUrl) {
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
            setResponseIncomplete(false);

            const connectionApi = new ConnectionFhirApi({
                baseUrl: connectionToken.url,
                token: connectionToken.token,
                customHeaders: connectionMandatedHeaders,
            });

            let data: object | undefined;
            if (resourceJson.trim() && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                data = JSON.parse(resourceJson);
            }
            const headersToSend = customHeaders.reduce<Record<string, string>>((acc, row) => {
                const key = row.key.trim();
                if (key && key.toLowerCase() !== 'authorization') {
                    acc[key] = row.value;
                }
                return acc;
            }, {});

            const { json, status, headers, incomplete } = await connectionApi.sendRequest({
                method,
                urlPath: requestUrl,
                data,
                headers: headersToSend,
                signal: controller.signal,
                onChunk: (chunk) => {
                    if (controller.signal.aborted) {
                        return;
                    }
                    setStreamedText((prev) => prev + chunk);
                },
                onHeaders: (earlyStatus, earlyHeaders) => {
                    if (controller.signal.aborted) {
                        return;
                    }
                    setResponseStatus(earlyStatus);
                    setResponseHeaders(earlyHeaders);
                },
            });
            setResponseStatus(status ?? null);
            setResponseJson(json);
            setResponseHeaders(headers || {});
            setResponseIncomplete(!!incomplete);
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                return;
            }
            if (error instanceof SyntaxError) {
                setResponseStatus(null);
                setResponseJson({ error: 'Invalid JSON in editor' });
            } else {
                setResponseStatus(null);
                setResponseJson({
                    error:
                        (error.message || 'Request failed') +
                        ' — this may be a CORS restriction from the source FHIR server.',
                });
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setIsStreaming(false);
                setLoading(false);
            }
        }
    };

    const getStatusColor = (status: number): 'success' | 'error' | 'warning' => {
        if (status >= 200 && status < 300) {
            return 'success';
        }
        if (status >= 400) {
            return 'error';
        }
        return 'warning';
    };

    const getMethodColor = (m: HttpMethod): string => {
        switch (m) {
            case 'GET': return '#4caf50';
            case 'POST': return '#ff9800';
            case 'PUT': return '#2196f3';
            case 'PATCH': return '#9c27b0';
            case 'DELETE': return '#f44336';
        }
    };

    const connectionHeaderRows: KeyValueRow[] = Object.entries(connectionMandatedHeaders).map(
        ([key, value]) => ({ key, value })
    );

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {!tokenServiceUrl ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : loadingConnection ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error && !connection ? (
                        <Typography color="error">{error}</Typography>
                    ) : connection ? (
                        <>
                            {/* Connection info bar */}
                            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="h6">{connection.display_name}</Typography>
                                    <Chip label={connection.category} size="small" />
                                    <Chip label={connection.status} size="small" variant="outlined" />
                                    <Chip label={connection.fhir_version} size="small" variant="outlined" />
                                    <Box sx={{ flexGrow: 1 }} />
                                    <Button
                                        size="small"
                                        startIcon={loadingToken ? <CircularProgress size={16} /> : <RefreshIcon />}
                                        onClick={fetchToken}
                                        disabled={loadingToken}
                                    >
                                        Refresh Token
                                    </Button>
                                </Box>
                                {connectionToken && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            patient_id: {connectionToken.patient_id}
                                        </Typography>
                                        <Tooltip title="Copy patient_id">
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    navigator.clipboard.writeText(connectionToken.patient_id)
                                                }
                                            >
                                                <ContentCopyIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                        <Typography variant="body2" color="text.secondary">
                                            token expires {connectionToken.expiry}
                                        </Typography>
                                    </Box>
                                )}
                                {error && (
                                    <Typography color="error" sx={{ mt: 1 }}>
                                        {error}
                                    </Typography>
                                )}
                            </Paper>

                            {/* Controls bar */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <FormControl size="small" sx={{ minWidth: 110 }}>
                                    <InputLabel>Method</InputLabel>
                                    <Select
                                        value={method}
                                        label="Method"
                                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
                                        sx={{ fontWeight: 'bold', color: getMethodColor(method) }}
                                    >
                                        {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                                            <MenuItem key={m} value={m} sx={{ fontWeight: 'bold', color: getMethodColor(m) }}>
                                                {m}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    size="small"
                                    label="Request Path"
                                    placeholder={
                                        connectionToken
                                            ? `e.g. /Patient/${connectionToken.patient_id}`
                                            : 'e.g. /Patient/123'
                                    }
                                    value={urlSuffix}
                                    onChange={(e) => setUrlSuffix(e.target.value)}
                                    sx={{ flex: 1, minWidth: 250 }}
                                />

                                <Button
                                    variant="contained"
                                    onClick={handleSend}
                                    disabled={loading || !connectionToken || !requestUrl}
                                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                                >
                                    {loading ? 'Sending...' : 'Send'}
                                </Button>
                            </Box>

                            {requestUrl && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: 'monospace',
                                        mb: 1,
                                        px: 1,
                                        py: 0.5,
                                        backgroundColor: 'action.hover',
                                        borderRadius: 1,
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    <strong>{method}</strong> {connectionToken?.url}
                                    {requestUrl}
                                </Typography>
                            )}

                            {/* Split pane */}
                            <Box sx={{ display: 'flex', height: 'calc(100vh - 320px)' }}>
                                <Paper elevation={2} sx={{ width: '50%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="subtitle2">Request</Typography>
                                        <Tabs
                                            value={activeRequestTab}
                                            onChange={(_, val) => setActiveRequestTab(val)}
                                            sx={{ minHeight: 0, ml: 'auto' }}
                                        >
                                            <Tab label="Body" value="body" sx={{ minHeight: 0, py: 0.5 }} />
                                            <Tab label="Headers" value="headers" sx={{ minHeight: 0, py: 0.5 }} />
                                        </Tabs>
                                    </Box>
                                    {activeRequestTab === 'headers' ? (
                                        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                                            {connectionHeaderRows.length > 0 && (
                                                <>
                                                    <Typography variant="caption" color="text.secondary">
                                                        From this connection (always sent)
                                                    </Typography>
                                                    <KeyValueRows rows={connectionHeaderRows} readOnly />
                                                </>
                                            )}
                                            <Typography variant="caption" color="text.secondary">
                                                Additional headers
                                            </Typography>
                                            <KeyValueRows
                                                rows={customHeaders}
                                                onChange={setCustomHeaders}
                                                keyLabel="Header name"
                                                valueLabel="Value"
                                            />
                                        </Box>
                                    ) : (
                                        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                                            <TextField
                                                multiline
                                                fullWidth
                                                value={resourceJson}
                                                onChange={(e) => setResourceJson(e.target.value)}
                                                slotProps={{
                                                    input: {
                                                        sx: {
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.875rem',
                                                            alignItems: 'flex-start',
                                                            backgroundColor: 'transparent',
                                                        },
                                                    },
                                                }}
                                                sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                                            />
                                        </Box>
                                    )}
                                </Paper>

                                <Box sx={{ width: '6px', backgroundColor: 'divider', flexShrink: 0 }} />

                                <Paper elevation={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="subtitle2">Response</Typography>
                                        {responseStatus !== null && (
                                            <Chip label={responseStatus} size="small" color={getStatusColor(responseStatus)} variant="outlined" />
                                        )}
                                        {responseIncomplete && (
                                            <Chip label="Connection dropped — response incomplete" size="small" color="warning" variant="outlined" />
                                        )}
                                        <Tabs
                                            value={activeResponseTab}
                                            onChange={(_, val) => setActiveResponseTab(val)}
                                            sx={{ minHeight: 0, ml: 'auto' }}
                                        >
                                            <Tab label={isStreaming ? 'Body (Receiving…)' : 'Body'} value="body" sx={{ minHeight: 0, py: 0.5 }} />
                                            <Tab label="Headers" value="headers" sx={{ minHeight: 0, py: 0.5 }} />
                                        </Tabs>
                                    </Box>
                                    <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                                        {activeResponseTab === 'headers' ? (
                                            Object.keys(responseHeaders).length > 0 ? (
                                                <KeyValueRows
                                                    rows={Object.entries(responseHeaders).map(([key, value]) => ({ key, value }))}
                                                    readOnly
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                    No response headers yet.
                                                </Typography>
                                            )
                                        ) : isStreaming ? (
                                            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', m: 0 }}>
                                                {streamedText}
                                            </Typography>
                                        ) : responseJson ? (
                                            <PreJson data={responseJson} collapsed={2} />
                                        ) : streamedText ? (
                                            <Typography component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', m: 0 }}>
                                                {streamedText}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                Response will appear here after sending...
                                            </Typography>
                                        )}
                                    </Box>
                                </Paper>
                            </Box>
                        </>
                    ) : null}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionConsolePage;
```

- [ ] **Step 2: Add the route**

In `src/routes/fhirRoutes.tsx`, add the lazy import:

```tsx
const ConnectionConsolePage = lazy(() => import('../pages/ConnectionConsolePage'));
```

And the route entry, right after the `connections` route added in Task 4:

```tsx
    <Route key="connectionConsole" path="/connections/:serviceSlug/console" element={<ConnectionConsolePage />} />,
```

- [ ] **Step 3: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged baseline).

- [ ] **Step 4: Verify — manual**

Run `yarn dev`, log in, go to `/connections`, click a connection:
- Confirms the info bar shows display name/category/status/FHIR version, and a token is
  fetched (patient_id + expiry appear).
- Click "Refresh Token" — confirms it re-fetches without navigating away.
- Type a request path and Send — confirms a request goes to the connection's own FHIR
  server (check the Network tab: request URL host should be the connection's `fhir_url`,
  not this app's own `REACT_APP_FHIR_SERVER_URL`) using `Authorization: Bearer
  <connection token>` (not the local session's token).
- If the connection has `custom_fhir_api_headers`, confirm they appear as read-only rows
  under "From this connection (always sent)" and are present on the outgoing request.
- Copy the current URL, open it in a new tab (no router `state` this time) — confirms the
  list-by-slug fallback resolves the connection and the page still works.
- Confirm `Header.tsx`'s "Open in API Console" button stays disabled/inactive while on
  this page (it must not offer to replay a connection request against this app's own FHIR
  server).

- [ ] **Step 5: Commit**

```bash
git add src/pages/ConnectionConsolePage.tsx src/routes/fhirRoutes.tsx
git commit -m "Add ConnectionConsolePage and /connections/:serviceSlug/console route"
```

---

### Task 6: Nav entry point in `Header.tsx`

**Files:**
- Modify: `src/components/Header.tsx`

**Interfaces:**
- Consumes: routes added in Task 4 (`/connections`).
- Produces: nothing consumed by anything else — final task.

- [ ] **Step 1: Add the icon import**

In `src/components/Header.tsx`, add to the icon imports:

```tsx
import HubIcon from '@mui/icons-material/Hub';
```

- [ ] **Step 2: Add the nav button**

Immediately after the existing "Open in API Console" `<Tooltip>`/`<IconButton>` block (the
one wrapping `TerminalIcon`) and before the dark-mode toggle `<IconButton>`, add:

```tsx
                    {userDetails && (
                        <Tooltip title="Connections">
                            <IconButton
                                color="inherit"
                                aria-label="connections"
                                id="btnConnections"
                                component={Link}
                                to="/connections"
                                sx={{ ml: 1 }}
                            >
                                <HubIcon />
                            </IconButton>
                        </Tooltip>
                    )}
```

- [ ] **Step 3: Verify — compiles**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, 6 warnings (unchanged baseline).

- [ ] **Step 4: Verify — manual**

Run `yarn dev`:
- Logged out: confirm the Connections icon is absent from the header.
- Logged in: confirm it's present and clicking it navigates to `/connections`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Header.tsx
git commit -m "Add Connections nav entry point to Header"
```

---

## Final manual pass

After all tasks, run through this once more in one sitting:

- [ ] `/api-console` and `Header.tsx`'s existing "Open in API Console" button behave
      exactly as before Task 1's refactor (streaming, abort, 401-logout all unchanged).
- [ ] `/connections` lists real ATS connections (staging), filter/search/"Load more" all
      work.
- [ ] Selecting a connection opens its console with a live token; "Refresh Token" works.
- [ ] A real request against at least one connection's FHIR server succeeds end-to-end —
      confirms or refutes the CORS open question from the design doc in practice.
- [ ] A connection with `custom_fhir_api_headers` sends them automatically and shows them
      as read-only.
- [ ] A bookmarked/refreshed console URL (no router `state`) still resolves correctly.
- [ ] An ATS 401 logs the user out, same as any other API call in this app.
- [ ] `yarn lint` and `yarn tsc --noEmit` both clean across the whole branch (0 errors, 6
      pre-existing warnings).
