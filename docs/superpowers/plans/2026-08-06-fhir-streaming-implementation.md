# Streaming FHIR Responses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let every page that calls the FHIR server display results as they arrive over the wire (instead of after the full response buffers) and resist idle-timeouts, using one shared streaming HTTP client instead of duplicated per-page code.

**Architecture:** Generalize the API Console's existing `fetch()` + `ReadableStream` reader pattern into a new `BaseApi.streamRequest()` method. `getData()`, `request()`, and `downloadFile()` become thin wrappers over it (axios is removed from `BaseApi`/`FhirApi`/`AdminApi` entirely). Pages that want visible progress pass an `onProgress` callback into their existing calls (Tier A); the search/`IndexPage` resource list additionally gets true incremental resource-by-resource rendering via a streaming JSON parser (Tier B).

**Tech Stack:** React 19, TypeScript, Vite, MUI 9. New dependency: `@streamparser/json` (browser-native streaming JSON parser, verified on npm at v0.0.23).

**Source spec:** `docs/superpowers/specs/2026-08-06-fhir-streaming-design.md`

## Global Constraints

- No page may implement its own `fetch`/reader loop. All streaming logic lives in `BaseApi.streamRequest()`; `FhirApi`, `AdminApi`, and every page consume it through `getData()`/`request()`/`downloadFile()`/`getBundleAsync()`.
- `getData()`, `request()`, and `downloadFile()` keep their current return shape and behavior for existing callers that don't pass streaming options — this is a non-breaking internal refactor by default.
- `axios` is removed from `BaseApi` (and therefore `FhirApi`/`AdminApi`). It remains a dependency only for the unrelated OIDC/auth services (`CognitoAuthService.ts`, `OktaAuthService.ts`, `ClientCredentialsAuthService.ts`, `BwellAppAuthService.ts`, `WellKnownConfigurationService.ts`, `Auth.tsx`) — do not touch those files.
- **No automated test framework in this plan.** This repo has zero test infrastructure today (no runner, no config, no test files); Vitest is being added in a separate PR. Every task below ends with a **manual verification** step (dev server commands, browser actions, expected observations) instead of an automated test cycle. Write new logic as small, pure, injectable functions so it's trivial to cover once Vitest lands.
- Run `yarn lint` before every commit — the repo's pre-commit hook enforces this and will block the commit otherwise.
- Dev server: `yarn dev`, served at `http://localhost:5051`.

## Deviations from the source spec (found during planning)

1. **Tier A scope narrowed for admin pages.** The spec listed "all AdminApi-backed admin pages" under Tier A (progress indicator). Inspecting every `AdminApi` method (`src/api/adminApi.ts`) and its callers shows they're all small request/response operations (person-match lookups, cache-key lists, search-log results, single status resources) — none return a response large enough for a progress indicator to be meaningful. Phase 1 already gives these pages the transport-level streaming/timeout-resilience benefit for free (via `request()`), with no page-level changes needed. This plan does not add Tier A progress UI to any admin page. If a specific admin operation later turns out to return large payloads, add a task then.
2. **Tier B error handling is coarser than the spec described.** The spec said "a malformed individual entry is logged and skipped... does not abort the stream." Verified against the actual `@streamparser/json` library (see Task 13): its tokenizer is stream-fatal — any malformed token anywhere aborts the *entire* incremental parse, not just one entry, because it's one continuous tokenizer over the whole byte stream. Task 14 implements the achievable equivalent: on a parser error, incremental updates stop (whatever resources already rendered stay on screen) and the page falls back to the existing end-of-stream full `JSON.parse` as the source of truth — so the user never ends up with missing data, they just lose the "watch it populate live" effect for that one malformed response.

---

## Phase 1: Shared streaming client foundation

### Task 1: Add `BaseApi.streamRequest()`

**Files:**
- Modify: `src/api/baseApi.ts`

**Interfaces:**
- Produces: `StreamRequestParams` (`method: HttpMethod`, `urlString: string`, `params?: Record<string, string>`, `data?: any`, `headers?: Record<string, string>`, `signal?: AbortSignal`, `responseMode?: 'text' | 'binary'` default `'text'`, `onHeaders?: (status: number, headers: Record<string,string>) => void`, `onChunk?: (chunk: Uint8Array) => void`, `onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void`) and `StreamRequestResult` (`status: number | undefined`, `headers: Record<string,string>`, `bytes: Uint8Array`, `text: string`, `incomplete: boolean`) — every later task in this plan consumes these exact shapes.

- [ ] **Step 1: Add the new types and `streamRequest()` method to `BaseApi`**

Add near the top of `src/api/baseApi.ts`, alongside the existing `GetDataParams`/`RequestParams` interfaces:

```ts
export interface StreamRequestParams {
    method: HttpMethod;
    urlString: string;
    params?: Record<string, string>;
    data?: any;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    responseMode?: 'text' | 'binary';
    onHeaders?: (status: number, headers: Record<string, string>) => void;
    onChunk?: (chunk: Uint8Array) => void;
    onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void;
}

export interface StreamRequestResult {
    status: number | undefined;
    headers: Record<string, string>;
    bytes: Uint8Array;
    text: string;
    incomplete: boolean;
}
```

Add this import at the top (it's already imported for `HttpMethod`, so this is likely already present — verify, don't duplicate):

```ts
import { HttpMethod, TRequestInfo } from '../context/LastRequestContext';
```

Add the method inside the `BaseApi` class (place it above `getData`, since `getData`/`request`/`downloadFile` will call it in later tasks):

```ts
async streamRequest({
    method,
    urlString,
    params,
    data,
    headers,
    signal,
    responseMode = 'text',
    onHeaders,
    onChunk,
    onProgress,
}: StreamRequestParams): Promise<StreamRequestResult> {
    let path = urlString;
    if (path.startsWith(window.location.origin)) {
        path = path.slice(window.location.origin.length);
    }
    const url = new URL(path, this.getBaseUrl());
    if (params) {
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    }

    // The session's bearer token must never leave the configured base URL. A scheme-relative
    // or absolute path can resolve to a different origin via `new URL()`, so refuse before any
    // fetch happens rather than trusting every caller to have validated its own input. This
    // check used to live only in FhirApi.sendRequest (the one caller that took a free-form path
    // from user input); moving it here means every BaseApi-derived call gets the guarantee.
    if (url.origin !== new URL(this.getBaseUrl()).origin) {
        return {
            status: undefined,
            headers: {},
            bytes: new Uint8Array(0),
            text: JSON.stringify({ error: 'Request path must stay on the configured FHIR server' }),
            incomplete: false,
        };
    }

    this.onRequest?.({ method, url: url.pathname + url.search });

    const requestHeaders = this.buildHeaders({
        'Content-Type': 'application/fhir+json',
        ...headers,
    });

    let response: Response;
    try {
        response = await fetch(url.toString(), {
            method,
            headers: requestHeaders,
            body: data !== undefined && data !== null ? JSON.stringify(data) : undefined,
            signal,
        });
    } catch (err: any) {
        if (err?.name === 'AbortError') {
            throw err;
        }
        return { status: undefined, headers: {}, bytes: new Uint8Array(0), text: '', incomplete: true };
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
    });

    // Surface status/headers as soon as fetch() resolves — before the body streaming loop
    // below starts — so callers can populate UI without waiting for the whole body.
    onHeaders?.(response.status, responseHeaders);
    await this.handleUnauthorized(response.status);

    const totalBytes = responseHeaders['content-length']
        ? parseInt(responseHeaders['content-length'], 10)
        : undefined;

    const receivedChunks: Uint8Array[] = [];
    let receivedBytes = 0;
    const decoder = new TextDecoder();
    let text = '';

    const finalize = (incomplete: boolean): StreamRequestResult => {
        const bytes = new Uint8Array(receivedBytes);
        let offset = 0;
        for (const chunk of receivedChunks) {
            bytes.set(chunk, offset);
            offset += chunk.length;
        }
        return { status: response.status, headers: responseHeaders, bytes, text, incomplete };
    };

    try {
        if (response.body) {
            const reader = response.body.getReader();
            let done = false;
            while (!done) {
                const result = await reader.read();
                done = result.done;
                if (result.value) {
                    receivedChunks.push(result.value);
                    receivedBytes += result.value.length;
                    if (responseMode === 'text') {
                        text += decoder.decode(result.value, { stream: true });
                    }
                    onChunk?.(result.value);
                    onProgress?.(receivedBytes, totalBytes);
                }
            }
        } else if (responseMode === 'text') {
            text = await response.text();
            onChunk?.(new TextEncoder().encode(text));
            onProgress?.(text.length, totalBytes);
        }
    } catch (err: any) {
        if (err?.name === 'AbortError') {
            throw err;
        }
        // A mid-stream drop rejects here. Headers were already surfaced via onHeaders and
        // whatever bytes arrived via onChunk, so resolve with the partial data instead of
        // throwing — callers decide how to degrade rather than losing everything.
        return finalize(true);
    }

    return finalize(false);
}
```

- [ ] **Step 2: Manual verification — the method compiles and doesn't break the build**

Run: `yarn tsc --noEmit`
Expected: no new TypeScript errors introduced by this change (the app doesn't call `streamRequest` yet, so this is purely a compile check).

- [ ] **Step 3: Commit**

```bash
git add src/api/baseApi.ts
git commit -m "Add BaseApi.streamRequest() as the shared fetch+ReadableStream client"
```

---

### Task 2: Refactor `BaseApi.getData()` onto `streamRequest()`

**Files:**
- Modify: `src/api/baseApi.ts:107-121` (current `getData` implementation)

**Interfaces:**
- Consumes: `streamRequest()` from Task 1.
- Produces: `getData(params: GetDataParams, options?: { onChunk?: (chunk: Uint8Array) => void; onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void }): Promise<{ status: number | undefined; json: any; incomplete: boolean }>` — Task 8, 9, and 12 call this with the new second `options` argument.

- [ ] **Step 1: Replace the axios-based `getData()` body**

Replace the existing `getData` method:

```ts
async getData(
    { urlString, params }: GetDataParams,
    options?: {
        onChunk?: (chunk: Uint8Array) => void;
        onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void;
    }
): Promise<{ status: number | undefined; json: any; incomplete: boolean }> {
    const { status, text, incomplete } = await this.streamRequest({
        method: 'GET',
        urlString,
        params,
        onChunk: options?.onChunk,
        onProgress: options?.onProgress,
    });
    let json: any;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return { status, json, incomplete };
}
```

Note this drops the old manual `try/catch` around an axios call and the separate `err.response?.status` handling — `streamRequest()` already resolves (rather than throws) on HTTP error statuses and already calls `handleUnauthorized()` internally, so that behavior is preserved without the try/catch.

- [ ] **Step 2: Manual verification — existing pages still load resources correctly**

Run: `yarn dev`, then in a browser:
1. Navigate to `http://localhost:5051/4_0_0/Patient/_search?_count=5` (or any resourceType your dev FHIR server has data for) and confirm the resource list still renders (this page — `IndexPage`/`SearchPage` — calls `getData()` transitively via `getBundleAsync()`).
2. Open DevTools → Network tab, find the request, confirm the response still shows the same JSON body/status as before this change.
3. Navigate to a URL for a resource type that doesn't exist or an expired-session scenario if you can trigger one, and confirm the existing error/"Login Expired" UI still appears (exercises the non-2xx path).

- [ ] **Step 3: Commit**

```bash
git add src/api/baseApi.ts
git commit -m "Refactor BaseApi.getData() onto streamRequest(), drop axios for GET reads"
```

---

### Task 3: Refactor `BaseApi.request()` onto `streamRequest()`

**Files:**
- Modify: `src/api/baseApi.ts:127-144` (current `request` implementation)

**Interfaces:**
- Consumes: `streamRequest()` from Task 1.
- Produces: `request(params: RequestParams, options?: { onChunk?: (chunk: Uint8Array) => void; onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void }): Promise<{ status: number | undefined; json: any; incomplete: boolean }>`.

- [ ] **Step 1: Replace the axios-based `request()` body**

```ts
async request(
    { urlString, params, method, data }: RequestParams,
    options?: {
        onChunk?: (chunk: Uint8Array) => void;
        onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void;
    }
): Promise<{ status: number | undefined; json: any; incomplete: boolean }> {
    const { status, text, incomplete } = await this.streamRequest({
        method,
        urlString,
        params,
        data,
        onChunk: options?.onChunk,
        onProgress: options?.onProgress,
    });
    let json: any;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return { status, json, incomplete };
}
```

Note this fixes the pre-existing documented gap in the old `request()` (the comment above the old implementation noted `onRequest` was never fired with the fully-resolved URL) for free — `streamRequest()` calls `this.onRequest?.(...)` after resolving the final URL.

- [ ] **Step 2: Manual verification — admin operations still work**

Run: `yarn dev`, then in a browser (adjust IDs to real data in your dev environment):
1. Navigate to `http://localhost:5051/admin/personMatch` and run a person-match lookup; confirm results render.
2. Navigate to `http://localhost:5051/admin/searchLog` and run a search-log lookup; confirm results render.
3. Check DevTools Network tab for both requests — confirm status/response body look correct and no console errors appear.

- [ ] **Step 3: Commit**

```bash
git add src/api/baseApi.ts
git commit -m "Refactor BaseApi.request() onto streamRequest(), drop axios for writes/admin calls"
```

---

### Task 4: Refactor `BaseApi.downloadFile()` onto `streamRequest()` (binary-safe)

**Files:**
- Modify: `src/api/baseApi.ts:146-162` (current `downloadFile` implementation)

**Interfaces:**
- Consumes: `streamRequest()` from Task 1, with `responseMode: 'binary'`.
- Produces: `downloadFile(url: string, options?: { onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void }): Promise<{ status: number; data: Blob; headers: Record<string, string> }>` — throws an `Error` (with a `.status` property) for non-2xx responses, matching axios's default reject-on-error-status behavior that `SpreadsheetViewer.tsx` and `FileDownload.tsx` currently rely on in their `catch` blocks.

- [ ] **Step 1: Replace the axios-based `downloadFile()` body**

```ts
async downloadFile(
    url: string,
    options?: { onProgress?: (bytesReceived: number, totalBytes: number | undefined) => void }
): Promise<{ status: number; data: Blob; headers: Record<string, string> }> {
    const { status, bytes, headers } = await this.streamRequest({
        method: 'GET',
        urlString: url,
        responseMode: 'binary',
        onProgress: options?.onProgress,
    });
    if (!status || status < 200 || status >= 300) {
        throw Object.assign(new Error(`Request failed with status ${status}`), { status });
    }
    const contentType = headers['content-type'] || 'application/octet-stream';
    return { status, data: new Blob([bytes], { type: contentType }), headers };
}
```

(401 handling already happened inside `streamRequest()` via `handleUnauthorized()` before this method sees the result, so the old `if (err.response?.status === 401 ...) logout()` branch in the removed catch block is preserved.)

- [ ] **Step 2: Manual verification — spreadsheet/file download still works**

Run: `yarn dev`, then in a browser:
1. Navigate to a `$everything` or search result page, click "Open Search Results as Spreadsheet" (routes to `ExcelViewerPage`/`SpreadsheetViewer`), confirm the grid still populates.
2. Click the download icon (`FileDownload`) on that page, confirm a file actually downloads with the correct filename and opens correctly (CSV/XLSX).

- [ ] **Step 3: Commit**

```bash
git add src/api/baseApi.ts
git commit -m "Refactor BaseApi.downloadFile() onto streamRequest(), binary-safe chunk assembly"
```

---

### Task 5: Remove axios from `BaseApi`

**Files:**
- Modify: `src/api/baseApi.ts`

**Interfaces:**
- Consumes: nothing new — this is cleanup now that Tasks 2–4 no longer use `this.axiosInstance`.
- Produces: `BaseApi` has no axios dependency; `buildHeaders()` remains as a plain method used directly by `streamRequest()`.

- [ ] **Step 1: Delete the axios instance, interceptor, and imports**

In `src/api/baseApi.ts`:
- Remove the imports: `import axios, { AxiosInstance } from 'axios';` and `import { InternalAxiosRequestConfig } from 'axios';`.
- Remove the `private readonly axiosInstance: AxiosInstance;` field.
- Remove the two lines in the constructor: `this.axiosInstance = axios.create();` and `this.axiosInstance.interceptors.request.use(this.requestInterceptor.bind(this));`.
- Remove the `requestInterceptor(req: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> { ... }` method entirely (no longer called by anything).
- Leave `buildHeaders()` and `handleUnauthorized()` exactly as they are — `streamRequest()` already calls `buildHeaders()` directly.

- [ ] **Step 2: Manual verification — build still succeeds with axios removed from this file**

Run: `yarn tsc --noEmit`
Expected: no errors (confirms nothing else in `baseApi.ts` still references axios types).

Run: `yarn lint`
Expected: no new errors (the unused-import rule would catch a leftover axios import if Step 1 was incomplete).

- [ ] **Step 3: Commit**

```bash
git add src/api/baseApi.ts
git commit -m "Remove axios from BaseApi now that all methods use streamRequest()"
```

---

### Task 6: `FhirApi.sendRequest()` delegates to `BaseApi.streamRequest()`

**Files:**
- Modify: `src/api/fhirApi.ts:122-250` (current `sendRequest` implementation)

**Interfaces:**
- Consumes: `BaseApi.streamRequest()` from Task 1.
- Produces: `sendRequest(...)` keeps its exact existing external signature and return shape (`{ status, json, headers, rawText, incomplete? }`) — `src/pages/APIConsolePage.tsx` requires zero changes.

- [ ] **Step 1: Replace the duplicated fetch/reader loop with a call to `streamRequest()`**

Replace the body of `sendRequest` (everything after the parameter destructuring) with:

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
}): Promise<{
    status: number | undefined;
    json: any;
    headers: Record<string, string>;
    rawText: string;
    incomplete?: boolean;
}> {
    // APIConsolePage's onChunk expects decoded text, but streamRequest hands back raw
    // Uint8Array chunks (so binary downloads elsewhere aren't forced through a decoder). Keep
    // one TextDecoder alive across the whole request — decoding each chunk independently would
    // corrupt any multi-byte UTF-8 character split across a chunk boundary.
    const decoder = new TextDecoder();
    const result = await this.streamRequest({
        method,
        urlString: urlPath,
        data,
        headers,
        signal,
        onHeaders,
        onChunk: onChunk ? (chunk) => onChunk(decoder.decode(chunk, { stream: true })) : undefined,
    });

    let json: any;
    try {
        json = result.text ? JSON.parse(result.text) : undefined;
    } catch {
        json = undefined;
    }

    return {
        status: result.status,
        json,
        headers: result.headers,
        rawText: result.text,
        incomplete: result.incomplete,
    };
}
```

This removes the duplicated origin-lock check, fetch call, and manual reader loop (~70 lines) that used to live directly in `FhirApi` — they're now provided once by `BaseApi.streamRequest()`.

- [ ] **Step 2: Manual verification — API Console streaming behavior is unchanged**

Run: `yarn dev`, navigate to `http://localhost:5051/api-console`:
1. Send a `GET` request to `/4_0_0/Patient?_count=20` (or any endpoint returning a reasonably sized body). Confirm the "Body (Receiving…)" tab still shows text accumulating before the response finishes, and the final parsed/collapsible JSON view still appears once complete.
2. Confirm the status `Chip` and Headers tab still populate immediately (before the body finishes) — this proves `onHeaders` still fires early.
3. Send a request, then immediately navigate away from `/api-console` mid-stream (or send a second request before the first finishes) — confirm no console errors from the aborted request and no stale state overwrite (tests the existing `AbortController` cancellation path still works through the new code).
4. In the "Request Path" field, type an absolute URL to a different origin (e.g. `https://example.com`) and send — confirm you get back the `"Request path must stay on the configured FHIR server"` error, proving the origin-lock check still works from its new home in `streamRequest()`.

- [ ] **Step 3: Commit**

```bash
git add src/api/fhirApi.ts
git commit -m "FhirApi.sendRequest() delegates to BaseApi.streamRequest(), removing duplicate reader loop"
```

---

## Phase 2: Tier A — visible progress for large-response pages

### Task 7: Add `useStreamProgress` hook and `StreamProgressIndicator` component

**Files:**
- Create: `src/hooks/useStreamProgress.ts`
- Create: `src/components/StreamProgressIndicator.tsx`

**Interfaces:**
- Produces: `useStreamProgress(): { progress: StreamProgressState; start: () => void; onProgress: (bytesReceived: number, totalBytes: number | undefined) => void; finish: () => void }` and `StreamProgressState = { bytesReceived: number; totalBytes: number | undefined; isStreaming: boolean }`. `<StreamProgressIndicator progress={StreamProgressState} />`. Tasks 8–10 consume both.

- [ ] **Step 1: Write the hook**

`src/hooks/useStreamProgress.ts`:

```ts
import { useCallback, useState } from 'react';

export interface StreamProgressState {
    bytesReceived: number;
    totalBytes: number | undefined;
    isStreaming: boolean;
}

const INITIAL_STATE: StreamProgressState = {
    bytesReceived: 0,
    totalBytes: undefined,
    isStreaming: false,
};

export function useStreamProgress() {
    const [progress, setProgress] = useState<StreamProgressState>(INITIAL_STATE);

    const start = useCallback(() => {
        setProgress({ bytesReceived: 0, totalBytes: undefined, isStreaming: true });
    }, []);

    const onProgress = useCallback((bytesReceived: number, totalBytes: number | undefined) => {
        setProgress((prev) => ({ ...prev, bytesReceived, totalBytes, isStreaming: true }));
    }, []);

    const finish = useCallback(() => {
        setProgress((prev) => ({ ...prev, isStreaming: false }));
    }, []);

    return { progress, start, onProgress, finish };
}
```

- [ ] **Step 2: Write the indicator component**

`src/components/StreamProgressIndicator.tsx`:

```tsx
import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { StreamProgressState } from '../hooks/useStreamProgress';

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface StreamProgressIndicatorProps {
    progress: StreamProgressState;
}

const StreamProgressIndicator: React.FC<StreamProgressIndicatorProps> = ({ progress }) => {
    if (!progress.isStreaming) {
        return null;
    }
    const percent = progress.totalBytes
        ? Math.min(100, Math.round((progress.bytesReceived / progress.totalBytes) * 100))
        : undefined;
    return (
        <Box sx={{ width: '100%', my: 2 }}>
            <LinearProgress variant={percent !== undefined ? 'determinate' : 'indeterminate'} value={percent} />
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                {percent !== undefined
                    ? `Loading… ${formatBytes(progress.bytesReceived)} of ${formatBytes(progress.totalBytes as number)} (${percent}%)`
                    : `Loading… ${formatBytes(progress.bytesReceived)} received`}
            </Typography>
        </Box>
    );
};

export default StreamProgressIndicator;
```

- [ ] **Step 3: Manual verification — compiles cleanly**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors (nothing consumes these yet, so this just checks the new files are well-formed).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useStreamProgress.ts src/components/StreamProgressIndicator.tsx
git commit -m "Add shared useStreamProgress hook and StreamProgressIndicator component"
```

---

### Task 8: Wire progress into `CompositionSummaryPage.tsx`

**Files:**
- Modify: `src/pages/CompositionSummaryPage.tsx`

**Interfaces:**
- Consumes: `useStreamProgress()` and `<StreamProgressIndicator>` from Task 7; `baseApi.getData(params, options)` from Task 2.

- [ ] **Step 1: Wire the hook into the fetch effect**

Add the import:

```tsx
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from '../components/StreamProgressIndicator';
```

Inside the component, add:

```tsx
const { progress, start, onProgress, finish } = useStreamProgress();
const [isIncomplete, setIsIncomplete] = useState<boolean>(false);
```

Update the `fetchResource` function inside the existing `useEffect`:

```tsx
const fetchResource = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsIncomplete(false);
    start();
    try {
        const response = await baseApi.getData({ urlString: relativeUrl }, { onProgress });
        const json = response.json;
        setRawResponse(json);
        setIsIncomplete(response.incomplete);
        if (json?.resourceType === 'Composition') {
            setResource(json);
        } else {
            setErrorMessage('The requested resource is not a Composition');
        }
    } catch (error) {
        console.error('Error fetching Composition resource:', error);
        setErrorMessage('Failed to load the Composition resource');
    } finally {
        setIsLoading(false);
        finish();
    }
};
```

Update the render section: replace the `{isLoading && (...CircularProgress...)}` block with:

```tsx
{isLoading && (
    <Box sx={{ my: 4 }}>
        <StreamProgressIndicator progress={progress} />
    </Box>
)}
{!isLoading && isIncomplete && (
    <Alert severity="warning" sx={{ mb: 2 }}>
        Connection interrupted — showing partial results.
    </Alert>
)}
```

(You can leave the `CircularProgress` import if it's still used elsewhere in the file; if this was its only use, remove the now-unused `CircularProgress` import to keep lint clean.)

- [ ] **Step 2: Manual verification**

Run: `yarn dev`, navigate to `http://localhost:5051/composition-summary/4_0_0/Composition/<a-real-id>`:
1. Confirm the page still renders the Composition summary correctly.
2. Open DevTools → Network → throttle to "Slow 3G" and reload — confirm you now see a progress bar/byte counter (indeterminate is fine if the server doesn't send `Content-Length`) instead of a static spinner while it loads.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CompositionSummaryPage.tsx
git commit -m "Show streaming progress indicator on CompositionSummaryPage"
```

---

### Task 9: Wire progress into `IPSViewer.tsx`

**Files:**
- Modify: `src/components/IPSViewer.tsx`

**Interfaces:**
- Consumes: `useStreamProgress()` and `<StreamProgressIndicator>` from Task 7; `baseApi.getData(params, options)` from Task 2.

- [ ] **Step 1: Wire the hook into `fetchBundle`**

Add the imports (alongside the existing ones):

```tsx
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from './StreamProgressIndicator';
```

Inside the component, add:

```tsx
const { progress, start, onProgress, finish } = useStreamProgress();
const [isIncomplete, setIsIncomplete] = useState<boolean>(false);
```

Update `fetchBundle`:

```tsx
const fetchBundle = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsIncomplete(false);
    start();

    try {
        const response = await baseApi.getData({ urlString: relativeUrl }, { onProgress });
        const bundleData: Bundle = response.json;
        setRawResponse(bundleData);
        setIsIncomplete(response.incomplete);
        // ... rest of the existing body unchanged (compositionEntry extraction, etc.)
    } catch (error) {
        console.error('Error fetching IPS bundle:', error);
        setErrorMessage('Failed to load the International Patient Summary');
    } finally {
        setIsLoading(false);
        finish();
    }
};
```

Update the loading render branch — replace:

```tsx
if (isLoading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
        </Box>
    );
}
```

with:

```tsx
if (isLoading) {
    return (
        <Box sx={{ my: 4 }}>
            <StreamProgressIndicator progress={progress} />
        </Box>
    );
}
```

Add an incomplete-response notice right after the existing `if (errorMessage) { ... }` block, before the main `return`:

```tsx
{isIncomplete && (
    <Alert severity="warning" sx={{ mb: 2 }}>
        Connection interrupted — showing partial results.
    </Alert>
)}
```

(Since the successful-render path returns a single top-level `<Box>`, add this as its first child rather than a separate top-level statement — adjust to fit the existing JSX structure at `IPSViewer.tsx:331` onward.)

- [ ] **Step 2: Manual verification**

Run: `yarn dev`, navigate to `http://localhost:5051/ips/4_0_0/Patient/<a-real-patient-id>/$summary`:
1. Confirm the IPS summary still renders (narrative + sections + bundle resources list) exactly as before.
2. Throttle network to "Slow 3G" and reload — confirm the progress indicator shows while the (typically large) `$summary` bundle downloads.

- [ ] **Step 3: Commit**

```bash
git add src/components/IPSViewer.tsx
git commit -m "Show streaming progress indicator on IPSViewer"
```

---

### Task 10: Wire byte-progress into `SpreadsheetViewer.tsx` and `FileDownload.tsx` downloads

**Files:**
- Modify: `src/components/SpreadsheetViewer.tsx`
- Modify: `src/components/FileDownload.tsx`

**Interfaces:**
- Consumes: `useStreamProgress()` / `<StreamProgressIndicator>` from Task 7; `baseApi.downloadFile(url, options)` from Task 4.

- [ ] **Step 1: `SpreadsheetViewer.tsx` — add progress to the download**

Add the imports:

```tsx
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from './StreamProgressIndicator';
```

Inside the component, add:

```tsx
const { progress, start, onProgress, finish } = useStreamProgress();
```

In `fetchSpreadsheetData`, wrap the download call:

```tsx
setIsLoading(true);
setErrorMessage(null);
start();

const response = await baseApi.downloadFile(downloadUri.toString(), { onProgress });
```

and add `finish();` alongside the existing `setIsLoading(false);` calls in both the success and `catch` paths.

Update the loading-state render block:

```tsx
if (isLoading) {
    return (
        <Box
            sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}
        >
            <StreamProgressIndicator progress={progress} />
            <Typography variant="body2" sx={{ mt: 2 }}>
                Loading spreadsheet...
            </Typography>
        </Box>
    );
}
```

- [ ] **Step 2: `FileDownload.tsx` — add progress during download**

Add the imports:

```tsx
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from './StreamProgressIndicator';
```

Inside the component, add:

```tsx
const { progress, start, onProgress, finish } = useStreamProgress();
```

In `downloadFile`, wrap the call:

```tsx
setIsLoading(true);
setErrorMessage(null);
start();
try {
    const response = await baseApi.downloadFile(downloadUri.toString(), { onProgress });
    // ... existing body unchanged ...
} catch (error1: unknown) {
    // ... existing body unchanged ...
} finally {
    finish();
}
```

(Add a `finally` block if one doesn't already wrap the existing `setIsLoading(false)` calls — consolidate the two existing `setIsLoading(false)` calls into a single `finally` while you're there, since both branches already only need it once.)

Add the indicator to the render output, right before the existing `<Tooltip>` button:

```tsx
{isLoading && <StreamProgressIndicator progress={progress} />}
```

- [ ] **Step 3: Manual verification**

Run: `yarn dev`, navigate to a search result page, open it as a spreadsheet (`/excel/...`):
1. Throttle network to "Slow 3G", reload — confirm `SpreadsheetViewer` shows byte-progress while downloading.
2. Click the download icon (`FileDownload`) — confirm a progress indicator briefly appears and the file still downloads correctly with the right filename.

- [ ] **Step 4: Commit**

```bash
git add src/components/SpreadsheetViewer.tsx src/components/FileDownload.tsx
git commit -m "Show byte-progress during spreadsheet/file downloads"
```

---

## Phase 3: Tier B — incremental resource rendering on the search/IndexPage list

### Task 11: Add the `@streamparser/json` dependency

**Files:**
- Modify: `package.json`, `yarn.lock` (via the command below)

- [ ] **Step 1: Install**

Run: `yarn add @streamparser/json`
Expected: `package.json` gains `"@streamparser/json": "^0.0.23"` (or newer patch) under `dependencies`, `yarn.lock` updates accordingly.

- [ ] **Step 2: Manual verification**

Run: `yarn lint`
Expected: passes (no code uses the new package yet, so this just confirms the install didn't break anything).

- [ ] **Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "Add @streamparser/json dependency for incremental Bundle parsing"
```

---

### Task 12: Let `FhirApi.getBundleAsync()` forward chunk callbacks

**Files:**
- Modify: `src/api/fhirApi.ts:38-51` (current `getBundleAsync` implementation)

**Interfaces:**
- Consumes: `getData()`'s new `options` parameter from Task 2.
- Produces: `getBundleAsync(params: GetBundleAsyncParams, options?: { onChunk?: (chunk: Uint8Array) => void }): Promise<{ status: number; json: any; incomplete: boolean }>` — Task 14 calls this with `onChunk` set.

- [ ] **Step 1: Add and forward the optional `onChunk` parameter**

```ts
async getBundleAsync(
    { resourceType, id, queryString, queryParameters, operation }: GetBundleAsyncParams,
    options?: { onChunk?: (chunk: Uint8Array) => void }
): Promise<{ status: number; json: any; incomplete: boolean }> {
    const url = this.getUrl({
        resourceType,
        id,
        queryString,
        queryParameters,
        operation,
    });
    return await this.getData({ urlString: url.toString() }, options);
}
```

- [ ] **Step 2: Manual verification**

Run: `yarn tsc --noEmit`
Expected: no errors (`IndexPage.tsx`'s existing call `fhirApi.getBundleAsync({...})` still compiles since `options` is optional).

- [ ] **Step 3: Commit**

```bash
git add src/api/fhirApi.ts
git commit -m "Let FhirApi.getBundleAsync() forward an optional onChunk callback"
```

---

### Task 13: Build the incremental Bundle-entry parser utility

**Files:**
- Create: `src/utils/incrementalBundleParser.ts`

**Interfaces:**
- Produces: `createBundleEntryParser(onEntry: (resource: any) => void, onError: (err: Error) => void): { write: (chunk: Uint8Array) => void; finish: () => void }` — Task 14 consumes this exactly.

- [ ] **Step 1: Write the parser wrapper**

`src/utils/incrementalBundleParser.ts`:

```ts
import { JSONParser } from '@streamparser/json';

/**
 * Wraps @streamparser/json to emit each Bundle.entry[].resource as it completes, instead of
 * waiting for the whole Bundle JSON object to finish downloading.
 *
 * The underlying tokenizer is stream-fatal: a single malformed token anywhere aborts the whole
 * parse (it's one continuous tokenizer over the byte stream, not a per-entry recovery
 * mechanism), so onError should be treated as "stop calling write(), fall back to the
 * caller's own full JSON.parse of the complete response" rather than "skip one bad entry."
 *
 * With no `separator` option, the parser auto-ends after the single top-level Bundle object
 * completes — calling finish() after that would throw, so finish() checks isEnded first.
 */
export function createBundleEntryParser(
    onEntry: (resource: any) => void,
    onError: (err: Error) => void
): { write: (chunk: Uint8Array) => void; finish: () => void } {
    const parser = new JSONParser({ paths: ['$.entry.*.resource'], keepStack: false });
    parser.onValue = ({ value }) => onEntry(value);
    parser.onError = onError;

    return {
        write: (chunk: Uint8Array) => {
            if (!parser.isEnded) {
                parser.write(chunk);
            }
        },
        finish: () => {
            if (!parser.isEnded) {
                parser.end();
            }
        },
    };
}
```

- [ ] **Step 2: Manual verification — run the parser against a real chunked Bundle**

Run: `yarn dev`, then in the browser DevTools console on any page, paste and run:

```js
const { createBundleEntryParser } = await import('/src/utils/incrementalBundleParser.ts');
const found = [];
const p = createBundleEntryParser((r) => found.push(r), (e) => console.error('parser error', e));
const bundle = { resourceType: 'Bundle', entry: [{ resource: { resourceType: 'Patient', id: '1' } }, { resource: { resourceType: 'Patient', id: '2' } }] };
const text = JSON.stringify(bundle);
const bytes = new TextEncoder().encode(text);
for (let i = 0; i < bytes.length; i += 5) {
    p.write(bytes.slice(i, i + 5));
}
p.finish();
console.log('found', found.length, found);
```

Expected: `found` has length 2, containing the two Patient resources, no error logged, no thrown exception from `p.finish()`.

- [ ] **Step 3: Commit**

```bash
git add src/utils/incrementalBundleParser.ts
git commit -m "Add incremental Bundle-entry parser wrapping @streamparser/json"
```

---

### Task 14: Wire incremental rendering into `IndexPage.tsx`'s search results

**Files:**
- Modify: `src/pages/IndexPage.tsx:153-232` (the `callApi` effect)

**Interfaces:**
- Consumes: `fhirApi.getBundleAsync(params, options)` from Task 12; `createBundleEntryParser(...)` from Task 13.

- [ ] **Step 1: Feed streamed chunks into the incremental parser as the search bundle downloads**

Add the import:

```tsx
import { createBundleEntryParser } from '../utils/incrementalBundleParser';
```

Inside `callApi`, before the `fhirApi.getBundleAsync({...})` call, only engage incremental rendering for the actual multi-resource search/list case (not the `shouldBeJsonFormat` raw-JSON view, which already renders the parsed result directly, and not single-resource reads, which have nothing to progressively render):

```tsx
const fhirApi = new FhirApi({
    fhirUrl,
    setUserDetails,
    onRequest: recordRequest,
});

let incrementalResults: any[] = [];
let parserFailed = false;
const streamParser = shouldBeJsonFormat
    ? undefined
    : createBundleEntryParser(
          (resource) => {
              incrementalResults = [...incrementalResults, resource];
              // Render each resource as it parses. The end-of-stream full JSON.parse result
              // (below) still overwrites this once the response completes, so a parser miss
              // never leaves the page silently short of data — it just skips the "populate
              // live" effect for whatever wasn't caught incrementally.
              setResources(incrementalResults);
          },
          (err) => {
              console.error('Incremental bundle parsing failed, falling back to full parse:', err);
              parserFailed = true;
          }
      );

const { json, status: statusCode, incomplete } = await fhirApi.getBundleAsync(
    {
        resourceType,
        id,
        queryString,
        operation: vid ? `_history/${vid}` : operation,
    },
    {
        onChunk: streamParser
            ? (chunk) => {
                  if (!parserFailed) {
                      streamParser.write(chunk);
                  }
              }
            : undefined,
    }
);
streamParser?.finish();
```

After the existing `setStatus(statusCode);` line, the existing logic already does:

```tsx
if (shouldBeJsonFormat) {
    setResources(json);
} else if (json && json.entry) {
    setResources(json.entry);
    setBundle(json);
    ...
```

Leave this exactly as-is — `setResources(json.entry)` still runs once the full response is parsed, which is the authoritative final state (it overwrites whatever the incremental parser produced, so `Bundle.total`/pagination links and anything the parser missed are always correct in the end). Note one nuance: the incremental parser's `onEntry` receives the raw FHIR `resource` object, while `json.entry` is an array of `{ resource, ... }` wrapper objects — `getBox()`'s render already handles both shapes via `const resource = fullResource.resource || fullResource;`, so no rendering-code change is needed for that difference.

Add the `incomplete` flag to the existing warning-less error path — right after `setStatus(statusCode);`, add:

```tsx
if (incomplete) {
    console.warn('Search response was interrupted mid-stream; results may be incomplete until retried.');
}
```

(A user-visible banner for this can be added later if it turns out to matter in practice — for now, matching what the API Console does with a full UI treatment would be scope creep on a page that doesn't have a dedicated status-chip area yet.)

- [ ] **Step 2: Manual verification — resources populate progressively**

Run: `yarn dev`, open DevTools → Network → throttle to "Slow 3G", then navigate to `http://localhost:5051/4_0_0/Patient?_count=20` (or any search returning several results):
1. Watch the page as it loads — confirm `ResourceCard`s appear one at a time (or in small batches) as the response streams in, rather than all appearing at once at the very end.
2. Once loading finishes, confirm the final list matches what you'd get without throttling (same count, same resources) — this proves the end-of-stream full parse correctly reconciles with the incremental one.
3. Switch to `_format=json` on the same search (append `&_format=json` to the URL) and confirm that view still renders exactly as before (this path skips the incremental parser entirely per the `shouldBeJsonFormat` guard).
4. Load a single-resource URL (e.g. `/4_0_0/Patient/<id>`) and confirm it still renders correctly (single-resource reads don't go through `getBundleAsync`'s entry-array path the same way, so this exercises the "existing behavior for non-list responses is untouched" guarantee).

- [ ] **Step 3: Commit**

```bash
git add src/pages/IndexPage.tsx
git commit -m "Render search results incrementally as the Bundle streams in"
```

---

## Self-review notes

- **Spec coverage:** Shared client (Task 1–6), Tier A progress (Task 7–10, scoped per the noted deviation), Tier B incremental rendering (Task 11–14), error handling for aborts/mid-stream drops (built into `streamRequest()` in Task 1, surfaced via `incomplete` in Tasks 2/3/8/9/14), origin-lock preserved (Task 1). Testing section of the spec is replaced by the manual-verification steps per the Global Constraints note (Vitest deferred to a separate PR).
- **Placeholder scan:** no TBD/TODO markers; every step has real code or a concrete manual-verification procedure.
- **Type consistency:** `StreamRequestParams`/`StreamRequestResult` (Task 1) are used with identical field names throughout Tasks 2–14 (`bytesReceived`, `totalBytes`, `incomplete`, `onChunk`, `onProgress`) — verified no renamed variants crept in across tasks.
