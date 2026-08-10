# Connections Single-Page Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse `ConnectionsListPage` (`/connections`) and `ConnectionConsolePage`
(`/connections/:serviceSlug/console`) into a single page at `/connections/:serviceSlug?`,
replacing the list+category-filter+search UI with a grouped connection-picker
`Autocomplete`, while extracting a shared `FhirRequestConsole` component out of
`APIConsolePage.tsx` so the connection console reuses it instead of duplicating its
request/response UI a second time.

**Architecture:** Four extractions, each independently testable, building toward the
merge: (1) `FhirRequestConsole.tsx` pulls `APIConsolePage.tsx`'s controls
bar/split-pane/send logic into a component parameterized by an injected `sendRequest`
function; (2) `ConnectionRequestConsole.tsx` pulls the token-fetch + info-bar logic out
of today's `ConnectionConsolePage.tsx` and composes `FhirRequestConsole`; (3)
`useConnections.ts` pulls the connections-list-fetch logic out of
`ConnectionsListPage.tsx`; (4) `ConnectionPicker.tsx` (new) plus a from-scratch,
thin-container rewrite of `ConnectionConsolePage.tsx` wire everything into the single
merged route, at which point `ConnectionsListPage.tsx` is deleted and the route table
collapses to one entry. A `key={connection.service_slug}` on `ConnectionRequestConsole`
in the final task guarantees no token/response state survives a connection switch.

**Tech Stack:** React 19, TypeScript, MUI v9 (`Autocomplete`, `createFilterOptions`),
react-router v8 (optional route params via `:param?`), Vite.

## Global Constraints

- **No automated test framework exists in this repo** (no jest/vitest/playwright in
  `package.json`, no `*.test.*` files). Every task below replaces the "write a failing
  test" cycle with: make the change, run `yarn lint` and `yarn tsc --noEmit` (must stay at
  0 errors; do not introduce new warnings beyond the pre-existing baseline), then manually
  verify via `yarn dev` per the task's manual-check steps.
- **`APIConsolePage.tsx`'s observable behavior must not change** after Task 1's
  extraction: standalone `/api-console` search-param persistence, the `$merge`-redirect
  auto-fetch/prefill flow, the resizable split pane, and all streaming/response behavior
  must all work exactly as before.
- **`ConnectionFhirApi` must never be wired to call `handleUnauthorized`.** A 401 from a
  connection's own FHIR server means that connection's token is stale, not that the
  user's b.well session is invalid — it must not log the user out. This is already true of
  `ConnectionFhirApi` itself and must remain true through every refactor in this plan.
- **Neither console may call `LastRequestContext`'s `recordRequest`.** Confirmed by
  reading the current codebase that `APIConsolePage.tsx` never calls it either (only
  `IndexPage.tsx`, `CompositionSummaryPage.tsx`, and `IPSViewer.tsx` do, when redirecting
  *into* `/api-console`) — so this requires no special-casing in `FhirRequestConsole`,
  just not adding a call that isn't there today.
- **Security: connection switches must not leak state.** `ConnectionRequestConsole` must
  be rendered with `key={connection.service_slug}` so React fully unmounts/remounts it
  (aborting any in-flight request via its existing cleanup effect, discarding its token
  and `FhirRequestConsole`'s response state) whenever the selected connection changes.
  Without this, switching connections in the merged page could show a stale token or a
  previous connection's response under the new connection's header.
- **MUI `Autocomplete`'s `groupBy` requires pre-sorted options.** Per MUI's own
  requirement, options passed to `ConnectionPicker`'s `Autocomplete` must be sorted by the
  `groupBy` key (category) beforehand, or grouping renders incorrectly.
- **The "not found" message must not stack on top of the error/forbidden banners.**
  `notFound` is only true when the list loaded successfully (`!loading && !error &&
  !forbidden`) but the slug still doesn't match any connection.
- **`Header.tsx`'s nav entry needs no change.** It already links to plain `/connections`
  (verified: `src/components/Header.tsx:95`, `to="/connections"`), which continues to
  resolve once the route's `serviceSlug` param becomes optional.
- **This is a rewrite of PR #220, still open.** Work happens directly on
  `feature/connections-fhir-console`; there is no separate merge/rebase step.

---

### Task 1: Extract shared `FhirRequestConsole` from `APIConsolePage.tsx`

**Files:**
- Create: `src/components/FhirRequestConsole.tsx`
- Modify: `src/pages/APIConsolePage.tsx` (full rewrite — see Step 3)

**Interfaces:**
- Consumes: `HttpMethod` from `src/context/LastRequestContext.ts`; `KeyValueRow` from
  `src/components/KeyValueRows.tsx`; `StreamingFetchResult` from
  `src/utils/streamingFetch.ts`; `PreJson` from `src/components/PreJson.tsx`.
- Produces: `FhirRequestConsole` (default export) and `SendRequestParams` (named export)
  from `src/components/FhirRequestConsole.tsx`. Task 2's `ConnectionRequestConsole`
  imports both. `SendRequestParams` is structurally identical to the parameter object
  both `FhirApi.sendRequest` and `ConnectionFhirApi.sendRequest` already accept, so
  neither class needs to change to satisfy `sendRequest: (params: SendRequestParams) =>
  Promise<StreamingFetchResult>`.

- [ ] **Step 1: Create `FhirRequestConsole.tsx`**

Create `src/components/FhirRequestConsole.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import PreJson from './PreJson';
import KeyValueRows, { KeyValueRow } from './KeyValueRows';
import { HttpMethod } from '../context/LastRequestContext';
import { StreamingFetchResult } from '../utils/streamingFetch';

const MIN_PANEL_WIDTH = 200;

export interface SendRequestParams {
    method: HttpMethod;
    urlPath: string;
    data?: object;
    headers?: Record<string, string>;
    onChunk?: (text: string) => void;
    onHeaders?: (status: number, headers: Record<string, string>) => void;
    signal?: AbortSignal;
}

export interface FhirRequestConsoleProps {
    method: HttpMethod;
    onMethodChange: (method: HttpMethod) => void;
    urlSuffix: string;
    onUrlSuffixChange: (urlSuffix: string) => void;
    resourceJson: string;
    onResourceJsonChange: (resourceJson: string) => void;
    requestPathPlaceholder: string;
    baseUrlForDisplay?: string;
    sendRequest: (params: SendRequestParams) => Promise<StreamingFetchResult>;
    sendDisabled?: boolean;
    loadingRequestBody?: boolean;
    splitPaneHeight?: string;
    readOnlyHeaderRows?: KeyValueRow[];
    readOnlyHeaderRowsLabel?: string;
}

const FhirRequestConsole = ({
    method,
    onMethodChange,
    urlSuffix,
    onUrlSuffixChange,
    resourceJson,
    onResourceJsonChange,
    requestPathPlaceholder,
    baseUrlForDisplay = '',
    sendRequest,
    sendDisabled = false,
    loadingRequestBody = false,
    splitPaneHeight = 'calc(100vh - 220px)',
    readOnlyHeaderRows,
    readOnlyHeaderRowsLabel,
}: FhirRequestConsoleProps) => {
    const [customHeaders, setCustomHeaders] = useState<KeyValueRow[]>([{ key: '', value: '' }]);
    const [activeRequestTab, setActiveRequestTab] = useState<'body' | 'headers'>('body');
    const [responseJson, setResponseJson] = useState<object | null>(null);
    const [responseStatus, setResponseStatus] = useState<number | null>(null);
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
    const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers'>('body');
    const [loading, setLoading] = useState<boolean>(false);
    const [leftWidthPercent, setLeftWidthPercent] = useState<number>(50);
    const [streamedText, setStreamedText] = useState<string>('');
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const [responseIncomplete, setResponseIncomplete] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const requestUrl = useMemo(() => {
        if (!urlSuffix) {
            return '';
        }
        return urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`;
    }, [urlSuffix]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) {
            return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        const minPercent = (MIN_PANEL_WIDTH / rect.width) * 100;
        setLeftWidthPercent(Math.min(100 - minPercent, Math.max(minPercent, percent)));
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleDragStart = () => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handleSend = async () => {
        if (!requestUrl) {
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

            let data: object | undefined;
            if (resourceJson.trim() && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
                data = JSON.parse(resourceJson);
            }
            const headersToSend = Object.fromEntries(
                customHeaders
                    .map((row) => ({ key: row.key.trim(), value: row.value }))
                    .filter((row) => row.key && row.key.toLowerCase() !== 'authorization')
                    .map((row): [string, string] => [row.key, row.value])
            );

            const { json, status, headers, incomplete } = await sendRequest({
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
                setResponseJson({ error: error.message || 'Request failed' });
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

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                    <InputLabel>Method</InputLabel>
                    <Select
                        value={method}
                        label="Method"
                        onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
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
                    placeholder={requestPathPlaceholder}
                    value={urlSuffix}
                    onChange={(e) => onUrlSuffixChange(e.target.value)}
                    sx={{ flex: 1, minWidth: 250 }}
                />

                <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={loading || loadingRequestBody || sendDisabled || !requestUrl}
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
                    <strong>{method}</strong> {baseUrlForDisplay}
                    {requestUrl}
                </Typography>
            )}

            <Box ref={containerRef} sx={{ display: 'flex', height: splitPaneHeight }}>
                <Paper
                    elevation={2}
                    sx={{ width: `${leftWidthPercent}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                >
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
                    {loadingRequestBody ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                            <CircularProgress />
                        </Box>
                    ) : activeRequestTab === 'headers' ? (
                        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                            {readOnlyHeaderRows && readOnlyHeaderRows.length > 0 && (
                                <>
                                    <Typography variant="caption" color="text.secondary">
                                        {readOnlyHeaderRowsLabel}
                                    </Typography>
                                    <KeyValueRows rows={readOnlyHeaderRows} readOnly />
                                </>
                            )}
                            {readOnlyHeaderRows !== undefined && (
                                <Typography variant="caption" color="text.secondary">
                                    Additional headers
                                </Typography>
                            )}
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
                                onChange={(e) => onResourceJsonChange(e.target.value)}
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

                <Box
                    onMouseDown={handleDragStart}
                    sx={{
                        width: '6px',
                        cursor: 'col-resize',
                        backgroundColor: 'divider',
                        '&:hover': { backgroundColor: 'primary.main' },
                        flexShrink: 0,
                    }}
                />

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
    );
};

export default FhirRequestConsole;
```

- [ ] **Step 2: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings beyond the existing baseline.

- [ ] **Step 3: Rewrite `APIConsolePage.tsx` to compose `FhirRequestConsole`**

Replace the full contents of `src/pages/APIConsolePage.tsx` with:

```tsx
import { useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Box } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FhirRequestConsole, { SendRequestParams } from '../components/FhirRequestConsole';
import FhirApi from '../api/fhirApi';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { HttpMethod } from '../context/LastRequestContext';
import { getLocalData } from '../utils/localData.utils';

const APIConsolePage = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const { id: routeId, resourceType: routeResourceType, operation: routeOperation } = useParams();

    const [searchParams, setSearchParams] = useSearchParams();

    // Determine if we arrived from a ResourceCard redirect (route params present)
    const isFromRedirect = Boolean(routeId && routeResourceType && routeOperation);

    const [method, setMethod] = useState<HttpMethod>(
        (searchParams.get('method') as HttpMethod) || (isFromRedirect ? 'POST' : 'GET')
    );
    const [urlSuffix, setUrlSuffix] = useState<string>(
        isFromRedirect && routeResourceType && routeId && routeOperation
            ? `/4_0_0/${routeResourceType}/${routeId}/${routeOperation}?smartMerge=true`
            : searchParams.get('urlSuffix') || ''
    );
    const [resourceJson, setResourceJson] = useState<string>('');
    const [fetching, setFetching] = useState<boolean>(false);

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

    // Auto-fetch resource when arriving from ResourceCard redirect
    useEffect(() => {
        if (!isFromRedirect || !fhirUrl || !routeId || !routeResourceType) {
            return;
        }
        const fetchResource = async () => {
            try {
                setFetching(true);
                const identityProvider = getLocalData('identityProvider');
                if (!identityProvider) {
                    return;
                }
                const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
                const { json } = await fhirApi.getResource({ id: routeId, resourceType: routeResourceType });
                if (json) {
                    setResourceJson(JSON.stringify(json, null, 2));
                }
            } catch (error) {
                console.error('Failed to fetch resource:', error);
            } finally {
                setFetching(false);
            }
        };
        fetchResource();
    }, [fhirUrl, routeId, routeResourceType, isFromRedirect, setUserDetails]);

    const sendRequest = useCallback(
        (params: SendRequestParams) => new FhirApi({ fhirUrl, setUserDetails }).sendRequest(params),
        [fhirUrl, setUserDetails]
    );

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    <FhirRequestConsole
                        method={method}
                        onMethodChange={setMethod}
                        urlSuffix={urlSuffix}
                        onUrlSuffixChange={setUrlSuffix}
                        resourceJson={resourceJson}
                        onResourceJsonChange={setResourceJson}
                        requestPathPlaceholder="Full path, e.g. /4_0_0/Patient/123 or /version"
                        sendRequest={sendRequest}
                        sendDisabled={fetching}
                        loadingRequestBody={fetching}
                    />
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default APIConsolePage;
```

- [ ] **Step 4: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 5: Manually verify `/api-console` is unchanged**

Run: `yarn dev`, then in a browser:
- Visit `/api-console`. Set Method to `POST`, Request Path to `/version`. Confirm the URL
  bar updates to `/api-console?method=POST&urlSuffix=%2Fversion`.
- Reload that URL directly. Confirm Method/Request Path restore from the query string.
- Send a `GET /version` request. Confirm the response panel shows a streamed/parsed body,
  the status chip appears, and the Headers tab shows response headers.
- Drag the divider between Request and Response panels. Confirm it resizes.
- Navigate to `/4_0_0/Patient/<a-real-patient-id>/$merge` (any existing Patient id on the
  configured dev FHIR server). Confirm: Method is `POST`, Request Path is prefilled as
  `/4_0_0/Patient/<id>/$merge?smartMerge=true`, a loading spinner shows in the Request
  panel briefly, then the fetched resource JSON appears as the request body.

- [ ] **Step 6: Commit**

```bash
git add src/components/FhirRequestConsole.tsx src/pages/APIConsolePage.tsx
git commit -m "Extract FhirRequestConsole from APIConsolePage"
```

---

### Task 2: Extract `ConnectionRequestConsole` from `ConnectionConsolePage.tsx`

**Files:**
- Create: `src/components/ConnectionRequestConsole.tsx`
- Modify: `src/pages/ConnectionConsolePage.tsx` (full rewrite — see Step 2; this is an
  *intermediate* version that still resolves `serviceSlug` itself via the existing
  two-route flow — Task 4 replaces it entirely)

**Interfaces:**
- Consumes: `FhirRequestConsole`/`SendRequestParams` (Task 1); `ConnectionEntry`,
  `ConnectionToken` from `src/types/connectionEntry.ts`; `TokenServiceApi` from
  `src/api/tokenServiceApi.ts`; `ConnectionFhirApi` from `src/api/connectionFhirApi.ts`;
  `CONNECTIONS_FORBIDDEN_MESSAGE` from `src/constants/connectionsConstants.ts`.
- Produces: `ConnectionRequestConsole` (default export), taking `{ connection:
  ConnectionEntry }` as its only prop, from `src/components/ConnectionRequestConsole.tsx`.
  Task 4's rewritten `ConnectionConsolePage.tsx` renders
  `<ConnectionRequestConsole connection={connection} key={connection.service_slug} />`.

- [ ] **Step 1: Create `ConnectionRequestConsole.tsx`**

Create `src/components/ConnectionRequestConsole.tsx`:

```tsx
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Paper,
    Tooltip,
    Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FhirRequestConsole, { SendRequestParams } from './FhirRequestConsole';
import { KeyValueRow } from './KeyValueRows';
import TokenServiceApi from '../api/tokenServiceApi';
import ConnectionFhirApi from '../api/connectionFhirApi';
import UserContext from '../context/UserContext';
import { HttpMethod } from '../context/LastRequestContext';
import { StreamingFetchResult } from '../utils/streamingFetch';
import { ConnectionEntry, ConnectionToken } from '../types/connectionEntry';
import { CONNECTIONS_FORBIDDEN_MESSAGE } from '../constants/connectionsConstants';

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

interface ConnectionRequestConsoleProps {
    connection: ConnectionEntry;
}

const ConnectionRequestConsole = ({ connection }: ConnectionRequestConsoleProps) => {
    const { setUserDetails } = useContext(UserContext);
    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;

    const [connectionToken, setConnectionToken] = useState<ConnectionToken | null>(null);
    const [loadingToken, setLoadingToken] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);

    const [method, setMethod] = useState<HttpMethod>('GET');
    const [urlSuffix, setUrlSuffix] = useState<string>('');
    const [resourceJson, setResourceJson] = useState<string>('');

    const connectionMandatedHeaders = useMemo(
        () => parseCustomHeaders(connectionToken?.custom_fhir_api_headers),
        [connectionToken]
    );

    const fetchToken = useCallback(async () => {
        if (!tokenServiceUrl) {
            return;
        }
        setLoadingToken(true);
        setError(null);
        setForbidden(false);
        try {
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const { status, connectionToken: token } = await api.getConnectionToken({
                serviceSlug: connection.service_slug,
            });
            if (status === 403) {
                setForbidden(true);
            } else if (status === 200 && token) {
                setConnectionToken(token);
            } else if (status === 404) {
                setError('No usable token for this connection — it may need to be reconnected.');
            } else {
                setError('Failed to fetch a token for this connection.');
            }
        } catch {
            setError('Failed to fetch a token for this connection.');
        } finally {
            setLoadingToken(false);
        }
    }, [tokenServiceUrl, connection.service_slug, setUserDetails]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    const sendRequest = useCallback(
        (params: SendRequestParams): Promise<StreamingFetchResult> => {
            if (!connectionToken) {
                return Promise.resolve({
                    status: undefined,
                    json: { error: 'No token available' },
                    headers: {},
                    rawText: '',
                });
            }
            return new ConnectionFhirApi({
                baseUrl: connectionToken.url,
                token: connectionToken.token,
                customHeaders: connectionMandatedHeaders,
            }).sendRequest(params);
        },
        [connectionToken, connectionMandatedHeaders]
    );

    const connectionHeaderRows: KeyValueRow[] = Object.entries(connectionMandatedHeaders).map(
        ([key, value]) => ({ key, value })
    );

    if (!tokenServiceUrl) {
        return (
            <Typography color="error">
                Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
            </Typography>
        );
    }

    if (forbidden) {
        return <Alert severity="warning">{CONNECTIONS_FORBIDDEN_MESSAGE}</Alert>;
    }

    return (
        <>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6">{connection.display_name}</Typography>
                    <Chip label={connection.category} size="small" />
                    <Chip label={connection.status} size="small" variant="outlined" />
                    {connection.expired && <Chip label="Expired" size="small" color="warning" />}
                    {connectionToken && (
                        <Chip label={connectionToken.fhir_version} size="small" variant="outlined" />
                    )}
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
                                onClick={() => navigator.clipboard.writeText(connectionToken.patient_id)}
                            >
                                <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                            token expires {new Date(connectionToken.expiry).toLocaleString()}
                        </Typography>
                    </Box>
                )}
                {error && (
                    <Typography color="error" sx={{ mt: 1 }}>
                        {error}
                    </Typography>
                )}
            </Paper>

            <FhirRequestConsole
                method={method}
                onMethodChange={setMethod}
                urlSuffix={urlSuffix}
                onUrlSuffixChange={setUrlSuffix}
                resourceJson={resourceJson}
                onResourceJsonChange={setResourceJson}
                requestPathPlaceholder={
                    connectionToken ? `e.g. /Patient/${connectionToken.patient_id}` : 'e.g. /Patient/123'
                }
                baseUrlForDisplay={connectionToken?.url}
                sendRequest={sendRequest}
                sendDisabled={!connectionToken}
                splitPaneHeight="calc(100vh - 320px)"
                readOnlyHeaderRows={connectionHeaderRows}
                readOnlyHeaderRowsLabel="From this connection (always sent)"
            />
        </>
    );
};

export default ConnectionRequestConsole;
```

- [ ] **Step 2: Rewrite `ConnectionConsolePage.tsx` to delegate to it (intermediate — still two routes)**

Replace the full contents of `src/pages/ConnectionConsolePage.tsx` with:

```tsx
import { useContext, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectionRequestConsole from '../components/ConnectionRequestConsole';
import TokenServiceApi from '../api/tokenServiceApi';
import UserContext from '../context/UserContext';
import { ConnectionEntry } from '../types/connectionEntry';
import { CONNECTIONS_FORBIDDEN_MESSAGE } from '../constants/connectionsConstants';

const ConnectionConsolePage = () => {
    const { setUserDetails } = useContext(UserContext);
    const { serviceSlug } = useParams();
    const location = useLocation();

    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;

    const [connection, setConnection] = useState<ConnectionEntry | null>(
        (location.state as { connection?: ConnectionEntry } | null)?.connection || null
    );
    const [loadingConnection, setLoadingConnection] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);

    useEffect(() => {
        if (connection || !tokenServiceUrl || !serviceSlug) {
            return;
        }
        const resolveConnection = async () => {
            setLoadingConnection(true);
            setError(null);
            try {
                const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
                const { status, connections } = await api.listConnections();
                if (status === 403) {
                    setForbidden(true);
                    return;
                }
                const match = connections.find((c) => c.service_slug === serviceSlug);
                if (match) {
                    setConnection(match);
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

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {!tokenServiceUrl ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : forbidden ? (
                        <Alert severity="warning">{CONNECTIONS_FORBIDDEN_MESSAGE}</Alert>
                    ) : loadingConnection ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error && !connection ? (
                        <Typography color="error">{error}</Typography>
                    ) : connection ? (
                        <ConnectionRequestConsole connection={connection} />
                    ) : null}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionConsolePage;
```

- [ ] **Step 3: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 4: Manually verify the connection console is unchanged (still via the old two-route flow)**

Run: `yarn dev`, then:
- Visit `/connections`, click into any connection. Confirm the console loads a token, the
  info bar shows display name/category/status/patient_id, and "Refresh Token" works.
- Send a request against that connection's FHIR server. Confirm the response appears.
- Open the Headers tab: if the connection has `custom_fhir_api_headers`, confirm they
  appear read-only under "From this connection (always sent)"; the "Additional headers"
  caption and editable rows appear either way.
- Confirm the split pane is now resizable (an intentional upgrade from the previous fixed
  50/50 split).
- Paste the console's URL into a fresh tab (no router state). Confirm it still resolves
  the connection via the list-fallback fetch.

- [ ] **Step 5: Commit**

```bash
git add src/components/ConnectionRequestConsole.tsx src/pages/ConnectionConsolePage.tsx
git commit -m "Extract ConnectionRequestConsole, composing FhirRequestConsole"
```

---

### Task 3: Extract `useConnections` hook from `ConnectionsListPage.tsx`

**Files:**
- Create: `src/hooks/useConnections.ts`
- Modify: `src/pages/ConnectionsListPage.tsx`

**Interfaces:**
- Consumes: `TokenServiceApi` from `src/api/tokenServiceApi.ts`; `ConnectionEntry` from
  `src/types/connectionEntry.ts`.
- Produces: `useConnections(): UseConnectionsResult` (default export) from
  `src/hooks/useConnections.ts`, where `UseConnectionsResult = { connections:
  ConnectionEntry[]; loading: boolean; error: string | null; forbidden: boolean;
  configMissing: boolean; reload: () => void }`. Task 4's `ConnectionPicker` and rewritten
  `ConnectionConsolePage` both consume this shape — in particular `configMissing` (true
  when `REACT_APP_TOKEN_SERVICE_URL` is unset) drives the "Token Service is not
  configured" message.

- [ ] **Step 1: Create `useConnections.ts`**

Create `src/hooks/useConnections.ts`:

```ts
import { useContext, useEffect, useState } from 'react';
import TokenServiceApi from '../api/tokenServiceApi';
import UserContext from '../context/UserContext';
import { ConnectionEntry } from '../types/connectionEntry';

export interface UseConnectionsResult {
    connections: ConnectionEntry[];
    loading: boolean;
    error: string | null;
    forbidden: boolean;
    configMissing: boolean;
    reload: () => void;
}

const useConnections = (): UseConnectionsResult => {
    const { setUserDetails } = useContext(UserContext);
    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;

    const [connections, setConnections] = useState<ConnectionEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);

    const loadConnections = async () => {
        if (!tokenServiceUrl) {
            return;
        }
        setLoading(true);
        setError(null);
        setForbidden(false);
        try {
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const { status, connections: loaded } = await api.listConnections();
            if (status === 403) {
                setForbidden(true);
            } else if (status === 200) {
                setConnections(loaded);
            } else {
                setError('Failed to load connections.');
            }
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

    return { connections, loading, error, forbidden, configMissing: !tokenServiceUrl, reload: loadConnections };
};

export default useConnections;
```

- [ ] **Step 2: Rewrite `ConnectionsListPage.tsx` to use it**

Replace the full contents of `src/pages/ConnectionsListPage.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
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
import useConnections from '../hooks/useConnections';
import { getLocalData } from '../utils/localData.utils';
import { ConnectionEntry } from '../types/connectionEntry';
import { CONNECTIONS_FORBIDDEN_MESSAGE } from '../constants/connectionsConstants';

const ConnectionsListPage = () => {
    const navigate = useNavigate();
    const { connections, loading, error, forbidden, configMissing, reload } = useConnections();

    const isBwellAppLogin = getLocalData('identityProvider') === 'bwellapp';

    const [category, setCategory] = useState<string>('All');
    const [search, setSearch] = useState<string>('');

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
        navigate(`/connections/${encodeURIComponent(connection.service_slug)}/console`, {
            state: { connection },
        });
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

                    {configMissing ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : forbidden ? (
                        <Alert severity="warning">{CONNECTIONS_FORBIDDEN_MESSAGE}</Alert>
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

                            {error ? (
                                <Box sx={{ mb: 2 }}>
                                    <Typography color="error">{error}</Typography>
                                    <Button onClick={() => reload()}>Retry</Button>
                                </Box>
                            ) : loading && connections.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : filtered.length === 0 ? (
                                <Typography color="text.secondary">No connections found.</Typography>
                            ) : (
                                <List>
                                    {filtered.map((connection) => (
                                        <ListItemButton
                                            key={connection.service_slug}
                                            onClick={() => handleSelect(connection)}
                                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}
                                        >
                                            <ListItemText
                                                primary={connection.display_name}
                                                secondary={connection.service_slug}
                                            />
                                            <Chip label={connection.category} size="small" sx={{ mr: 1 }} />
                                            <Chip label={connection.status} size="small" variant="outlined" sx={{ mr: 1 }} />
                                            {connection.expired && (
                                                <Chip label="Expired" size="small" color="warning" />
                                            )}
                                        </ListItemButton>
                                    ))}
                                </List>
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

- [ ] **Step 3: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 4: Manually verify `/connections` is unchanged**

Run: `yarn dev`, then visit `/connections`:
- Confirm the list loads, the category filter and search box both narrow it as before.
- Confirm the "sign in with b.well App login" banner still appears/doesn't appear under
  the same condition as before.
- Force a load failure (e.g. temporarily point `REACT_APP_TOKEN_SERVICE_URL` at an
  unreachable host in `.env`, restart `yarn dev`) and confirm the error banner + "Retry"
  button appear and "Retry" re-fetches; then restore the env var.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useConnections.ts src/pages/ConnectionsListPage.tsx
git commit -m "Extract useConnections hook from ConnectionsListPage"
```

---

### Task 4: Merge into `/connections/:serviceSlug?` — `ConnectionPicker`, thin container, route change, delete list page

**Files:**
- Create: `src/components/ConnectionPicker.tsx`
- Modify: `src/pages/ConnectionConsolePage.tsx` (full rewrite — replaces Task 2's
  intermediate version)
- Modify: `src/routes/fhirRoutes.tsx`
- Delete: `src/pages/ConnectionsListPage.tsx`

**Interfaces:**
- Consumes: `useConnections` (Task 3); `ConnectionRequestConsole` (Task 2);
  `ConnectionEntry` from `src/types/connectionEntry.ts`; `CONNECTIONS_FORBIDDEN_MESSAGE`
  from `src/constants/connectionsConstants.ts`.
- Produces: `ConnectionPicker` (default export), props `{ connections: ConnectionEntry[];
  loading: boolean; forbidden: boolean; selectedSlug: string | undefined; onSelect: (slug:
  string | null) => void }`, from `src/components/ConnectionPicker.tsx`. This is the final
  task in the plan — nothing downstream consumes its output beyond
  `ConnectionConsolePage.tsx` itself.

- [ ] **Step 1: Create `ConnectionPicker.tsx`**

Create `src/components/ConnectionPicker.tsx`:

```tsx
import { useMemo } from 'react';
import { Alert, Autocomplete, Box, Chip, TextField, Typography, createFilterOptions } from '@mui/material';
import { getLocalData } from '../utils/localData.utils';
import { ConnectionEntry } from '../types/connectionEntry';
import { CONNECTIONS_FORBIDDEN_MESSAGE } from '../constants/connectionsConstants';

interface ConnectionPickerProps {
    connections: ConnectionEntry[];
    loading: boolean;
    forbidden: boolean;
    selectedSlug: string | undefined;
    onSelect: (slug: string | null) => void;
}

// MUI's Autocomplete requires options to already be sorted by the groupBy key for
// grouping to render correctly — it does not sort them itself.
const filterOptions = createFilterOptions<ConnectionEntry>({
    stringify: (option) => `${option.display_name} ${option.service_slug}`,
});

const ConnectionPicker = ({ connections, loading, forbidden, selectedSlug, onSelect }: ConnectionPickerProps) => {
    const isBwellAppLogin = getLocalData('identityProvider') === 'bwellapp';

    const sortedConnections = useMemo(
        () =>
            [...connections].sort(
                (a, b) => a.category.localeCompare(b.category) || a.display_name.localeCompare(b.display_name)
            ),
        [connections]
    );

    const selectedConnection = useMemo(
        () => connections.find((c) => c.service_slug === selectedSlug) ?? null,
        [connections, selectedSlug]
    );

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Connections
            </Typography>

            {!isBwellAppLogin && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Connections only work when signed in with b.well App login.
                </Alert>
            )}

            {forbidden ? (
                <Alert severity="warning">{CONNECTIONS_FORBIDDEN_MESSAGE}</Alert>
            ) : (
                <Autocomplete
                    options={sortedConnections}
                    loading={loading}
                    value={selectedConnection}
                    groupBy={(option) => option.category}
                    getOptionLabel={(option) => option.display_name}
                    isOptionEqualToValue={(option, value) => option.service_slug === value.service_slug}
                    filterOptions={filterOptions}
                    onChange={(_, value) => onSelect(value ? value.service_slug : null)}
                    renderOption={(props, option) => (
                        <Box component="li" {...props} key={option.service_slug} sx={{ display: 'flex', gap: 1 }}>
                            <Typography sx={{ flex: 1 }}>{option.display_name}</Typography>
                            <Chip label={option.status} size="small" variant="outlined" />
                            {option.expired && <Chip label="Expired" size="small" color="warning" />}
                        </Box>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Connection"
                            placeholder="Search by display name or service slug"
                        />
                    )}
                    sx={{ maxWidth: 480 }}
                />
            )}
        </Box>
    );
};

export default ConnectionPicker;
```

- [ ] **Step 2: Rewrite `ConnectionConsolePage.tsx` as the thin merged container**

Replace the full contents of `src/pages/ConnectionConsolePage.tsx` with:

```tsx
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Box, Button, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectionPicker from '../components/ConnectionPicker';
import ConnectionRequestConsole from '../components/ConnectionRequestConsole';
import useConnections from '../hooks/useConnections';

const ConnectionConsolePage = () => {
    const { serviceSlug } = useParams();
    const navigate = useNavigate();
    const { connections, loading, error, forbidden, configMissing, reload } = useConnections();

    const connection = useMemo(
        () => connections.find((c) => c.service_slug === serviceSlug) ?? null,
        [connections, serviceSlug]
    );
    const notFound = !loading && !error && !forbidden && !!serviceSlug && !connection;

    const handleSelect = (slug: string | null) => {
        navigate(slug ? `/connections/${encodeURIComponent(slug)}` : '/connections');
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {configMissing ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : (
                        <>
                            <ConnectionPicker
                                connections={connections}
                                loading={loading}
                                forbidden={forbidden}
                                selectedSlug={serviceSlug}
                                onSelect={handleSelect}
                            />

                            {error && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography color="error">{error}</Typography>
                                    <Button onClick={() => reload()}>Retry</Button>
                                </Box>
                            )}

                            {notFound && (
                                <Typography color="error">
                                    No connection found for service slug &quot;{serviceSlug}&quot;.
                                </Typography>
                            )}

                            {connection && (
                                <ConnectionRequestConsole connection={connection} key={connection.service_slug} />
                            )}
                        </>
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionConsolePage;
```

- [ ] **Step 3: Update the route table**

In `src/routes/fhirRoutes.tsx`, remove the `ConnectionsListPage` lazy import and both
existing connection routes:

```tsx
const ConnectionsListPage = lazy(() => import('../pages/ConnectionsListPage'));
const ConnectionConsolePage = lazy(() => import('../pages/ConnectionConsolePage'));
```

and

```tsx
<Route key="connections" path="/connections" element={<ConnectionsListPage />} />,
<Route key="connectionConsole" path="/connections/:serviceSlug/console" element={<ConnectionConsolePage />} />,
```

Replace them with a single lazy import and a single route:

```tsx
const ConnectionConsolePage = lazy(() => import('../pages/ConnectionConsolePage'));
```

and

```tsx
<Route key="connections" path="/connections/:serviceSlug?" element={<ConnectionConsolePage />} />,
```

- [ ] **Step 4: Delete `ConnectionsListPage.tsx`**

```bash
git rm src/pages/ConnectionsListPage.tsx
```

- [ ] **Step 5: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings, no "unused import" or "module not found" errors
referencing the deleted file.

- [ ] **Step 6: Manually verify the full merged page**

Run: `yarn dev`, then in a browser:
- Visit `/connections/<validSlug>` directly (a real connection's slug). Confirm the
  picker shows it preselected and the console loads its token immediately — no extra
  click required.
- Visit `/connections/<bogusSlug>`. Confirm the "No connection found for service slug
  ..." message appears and the picker is still usable to select a real connection.
- Visit bare `/connections`. Confirm the picker is unselected and no console is shown.
- Select a connection from the picker. Confirm the URL updates to
  `/connections/<slug>` without a full page reload, and the console loads.
- **Security check:** select connection A, let its token load, then switch to connection
  B via the picker before A's info bar fully settles (or immediately after). Confirm B's
  info bar never briefly shows A's patient_id/token-derived data, and — using the
  browser's network inspector — confirm any request still in flight against A's FHIR
  server at the moment of switching shows as cancelled, not completed.
- Select connections A, then B, then C in sequence via the picker. Use the browser Back
  button twice. Confirm it lands back on B's URL/console, then A's — each reloading that
  connection's console correctly. Forward button replays the sequence.
- Clear the picker's selection (the Autocomplete's clear button). Confirm the URL
  returns to bare `/connections` and the console disappears. Press Back from there;
  confirm it leaves `/connections` for whatever page linked into it.
- Confirm the picker groups connections by category matching the old category `<Select>`
  options, and that typing in the picker filters by both display name and service slug.
- Confirm the "sign in with b.well App login" banner and the 403 "not available for
  delegated accounts" banner still appear under the same conditions verified in Tasks 2
  and 3.
- Re-run the `/api-console` regression checks from Task 1, Step 5 once more, confirming
  nothing in this task's route-table change affected that page.

- [ ] **Step 7: Commit**

```bash
git add src/components/ConnectionPicker.tsx src/pages/ConnectionConsolePage.tsx src/routes/fhirRoutes.tsx
git commit -m "Merge connections list + console into single /connections/:serviceSlug? page"
```
