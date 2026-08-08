# Scroll-Triggered Incremental Page Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace "fetch the whole (capped-at-2000) result set upfront, then virtualize the DOM render" with real incremental fetching — load a small first page (10 resources), then automatically fetch and append more pages as the user scrolls deeper into the virtualized list, so the browser never holds (in memory OR in flight over the network) much more than what the user has actually scrolled to.

**Architecture:** `IndexPage` currently issues one `fhirApi.getBundleAsync()` call per page load and accumulates the *entire* response (up to `MAX_RESOURCES = 2000`, added by the prerequisite plan below) into `resources` state, which `ResourceList` (also added by that plan) renders virtualized. This plan adds a second fetch path: request pages of `PAGE_SIZE = 10` via `_count`/`_getpagesoffset`, append each page's entries to `resources` as it arrives, and trigger the next page's fetch from `ResourceList`'s virtualizer when the user scrolls near the end of what's currently loaded — reusing the offset-increment logic that already exists (today, manually, via Prev/Next buttons) in `Footer.tsx`.

**Tech Stack:** React 19, TypeScript, `@tanstack/react-virtual` (`useVirtualizer`'s `getVirtualItems()`), existing `FhirApi`/`BaseApi` fetch layer.

## Prerequisite

This plan is written against `src/components/ResourceList.tsx` and the `MAX_RESOURCES`/virtualization changes from `docs/superpowers/plans/2026-08-07-summary-page-memory.md`, which as of this writing are implemented on branch `fix/summary-page-memory-usage` but **not yet merged to `main`**. Branch this plan's work from `fix/summary-page-memory-usage` after that plan's final review is clean and merged — do not start on `main` until then, and re-confirm the line numbers cited below against the actual merged file, since they may have shifted.

## Design Decisions Flagged for Review

1. **Unverified assumption: does `$summary`/`$everything` honor `_count`/`_getpagesoffset` server-side?** This is the operation the original OOM report used (`Person/{id}/$summary`). `FhirApi.addMissingRequiredParams` (`src/api/fhirApi.ts:65-67`) only defaults `_count=10` when there's **no** `id`, or the operation is `_history` — an id-scoped operation like `$summary`/`$everything` gets no default `_count` today, and whether the b.well FHIR server returns a `Bundle.link` with `relation: "next"` for these operations (the same signal `Footer.tsx:23-25` already uses for search results) is unverified. **The design is safe either way**: if the server ignores `_count` and returns everything in "page 1," `hasMorePages` (Task 2) resolves to `false` immediately (no `next` link, and the returned entry count won't cleanly equal the requested page size), and the page just falls back to today's already-fixed single-shot-then-virtualize behavior. Real incremental loading only kicks in for operations/servers that actually honor paging. Task 5's manual verification step confirms which case `$summary` falls into — recommend doing that check before investing further in tuning this feature specifically for `$summary`.
2. **Footer's existing manual Prev/Next pagination (`src/components/Footer.tsx`) is not removed.** It still serves `manageExport.tsx` and any flow that wants to jump to a specific `_getpagesoffset` rather than scroll. Task 4 below only decides whether `IndexPage` still *shows* it once scroll-loading covers the common case — it's a UX call, not a removal of Footer's capability.
3. **The incremental byte-stream parser (`incrementalBundleParser.ts`) is bypassed for paged fetches.** A 10-entry page will almost always arrive as 1-2 TCP chunks, so progressive per-entry rendering has no benefit and adds complexity. It stays in use for the existing non-paged fallback path (e.g., if a caller explicitly puts `_count=500` in the URL, matching today's behavior exactly).
4. **`MAX_RESOURCES = 2000` (from the prerequisite plan) stays as an outer safety net** even with paging — it caps total *appended* resources across all pages, guarding against a pathological `next`-link loop or a server that returns a `next` link forever.

## Global Constraints

- Do not change `Footer.tsx`'s existing manual-pagination behavior for other consumers (`manageExport.tsx`).
- Do not change `addMissingRequiredParams`'s shared defaults (`src/api/fhirApi.ts:59-78`) — those affect every `FhirApi` call site (including `$merge`). This feature requests its own page size explicitly via `queryParameters`, not by changing the shared default.
- `yarn build` and `yarn lint` must pass before each task's commit.
- This repo has no test framework (see the prerequisite plan's note) — verification is `yarn build`/`yarn lint`/manual smoke check.
- Preserve the existing single-shot fetch behavior for any request that already specifies its own `_count` in the URL query string (e.g., a user manually appending `?_count=500`), and for the `shouldBeJsonFormat`/`$merge` branches, which are unrelated to this feature.

---

## File Structure

- Modify: `src/api/fhirApi.ts` — extract a reusable "next page params" helper from the offset-increment logic duplicated in `Footer.tsx:45-53`.
- Modify: `src/pages/IndexPage.tsx` — add the paged-loading fetch path, `hasMorePages`/`isLoadingMore` state, and a `loadNextPage()` callback.
- Modify: `src/components/ResourceList.tsx` — accept `onLoadMore`/`hasMore`/`isLoadingMore` props; trigger `onLoadMore` from the virtualizer's scroll position; render a bottom loading indicator.
- Modify: `src/pages/IndexPage.tsx` (again, separately) — decide Footer's visibility for the paged view (Task 4).

---

### Task 1: Extract a reusable "next page" params helper

`Footer.tsx:45-53` already computes the next `_getpagesoffset` value on click. This task extracts that into `FhirApi` so `IndexPage`'s new scroll-triggered path can compute the same thing without a UI click.

**Files:**
- Modify: `src/api/fhirApi.ts`

**Interfaces:**
- Produces: `FhirApi.getNextPageQueryParameters({ currentQueryString, pageSize }: { currentQueryString?: string; pageSize: number }): string[]` — returns a `queryParameters`-shaped string array (matching `getBundleAsync`'s existing `queryParameters?: string[]` param, e.g. `['_count=10', '_getpagesoffset=1']`) with `_getpagesoffset` incremented by one page relative to whatever offset `currentQueryString` already had (defaulting to offset 0 → 1), and `_count` forced to `pageSize`.

- [ ] **Step 1: Add the helper**

Add to `src/api/fhirApi.ts`, as a new method on `FhirApi` (near `addMissingRequiredParams`):
```ts
    getNextPageQueryParameters({
        currentQueryString,
        pageSize,
    }: {
        currentQueryString?: string;
        pageSize: number;
    }): string[] {
        const params = new URLSearchParams(currentQueryString || '');
        const currentOffset = parseInt(params.get('_getpagesoffset') || '0', 10);
        return [`_count=${pageSize}`, `_getpagesoffset=${currentOffset + 1}`];
    }
```

- [ ] **Step 2: Type-check and lint**

Run: `yarn build && yarn lint`

- [ ] **Step 3: Commit**

```bash
git add src/api/fhirApi.ts
git commit -m "feat: add FhirApi.getNextPageQueryParameters for scroll-triggered paging"
```

---

### Task 2: Add the paged-loading fetch path to IndexPage

**Files:**
- Modify: `src/pages/IndexPage.tsx`

**Interfaces:**
- Produces: `const PAGE_SIZE = 10;` module constant; new state `hasMorePages: boolean`, `isLoadingMore: boolean`; a `loadNextPage: () => Promise<void>` function passed down to `ResourceList`.
- Consumes: `fhirApi.getNextPageQueryParameters` (Task 1), the existing `resources`/`setResources`/`truncated`/`setTruncated`/`MAX_RESOURCES` from the prerequisite plan, `fhirApi.getBundleAsync`.

- [ ] **Step 1: Decide the initial fetch's page size**

In the `callApi` effect, when the request is a plain search or a `$summary`/`$everything`-style operation (i.e., not `shouldBeJsonFormat`, not `$merge`, and the URL doesn't already specify its own `_count`), pass `queryParameters: ['_count=' + PAGE_SIZE]` into the initial `fhirApi.getBundleAsync()` call instead of relying on `addMissingRequiredParams`'s default. If the URL already has `_count`, leave it untouched (Global Constraint: preserve explicit-`_count` behavior).

- [ ] **Step 2: Track hasMorePages from the response**

After the initial fetch resolves and `json.entry` is available, compute:
```ts
const nextLink = json.link?.some((l: { relation?: string }) => l.relation === 'next');
setHasMorePages(Boolean(nextLink) && !overflowing);
```
(`overflowing` already exists from the prerequisite plan's `MAX_RESOURCES` cap — if the first page alone already hit the cap, don't offer to load more.)

- [ ] **Step 3: Implement loadNextPage**

```ts
const loadNextPage = async () => {
    if (isLoadingMore || !hasMorePages || !fhirUrl || resources.length >= MAX_RESOURCES) {
        return;
    }
    setIsLoadingMore(true);
    try {
        const fhirApi = new FhirApi({ fhirUrl, setUserDetails, onRequest: recordRequest });
        const queryParameters = fhirApi.getNextPageQueryParameters({
            currentQueryString: queryString,
            pageSize: PAGE_SIZE,
        });
        const { json } = await fhirApi.getBundleAsync({ resourceType, id, queryParameters, operation });
        const nextEntries = json?.entry ?? [];
        setResources((prev: any[]) => {
            const combined = [...prev, ...nextEntries];
            const overflowing = combined.length > MAX_RESOURCES;
            setTruncated(overflowing);
            return overflowing ? combined.slice(0, MAX_RESOURCES) : combined;
        });
        const nextLink = json?.link?.some((l: { relation?: string }) => l.relation === 'next');
        setHasMorePages(Boolean(nextLink) && nextEntries.length > 0);
    } finally {
        setIsLoadingMore(false);
    }
};
```
Note: this reconstructs its own `FhirApi` instance and increments the offset relative to the *original* `queryString`, not relative to how many pages have loaded — this only works correctly for exactly one "next" step at a time relative to the page most recently fetched. Track the current offset in a ref (`const currentOffsetRef = useRef(0)`) rather than re-deriving it from `queryString` on every call, and increment it locally after each successful fetch, so page 3's request correctly asks for offset 2 rather than re-deriving offset 1 from the original URL every time.

- [ ] **Step 4: Wire props into ResourceList**

Pass `hasMore={hasMorePages}`, `isLoadingMore={isLoadingMore}`, `onLoadMore={loadNextPage}` to `<ResourceList>`.

- [ ] **Step 5: Type-check, lint, commit**

Run: `yarn build && yarn lint`, then:
```bash
git add src/pages/IndexPage.tsx
git commit -m "feat: add scroll-triggered page loading to IndexPage"
```

---

### Task 3: Trigger loadNextPage from ResourceList's scroll position

**Files:**
- Modify: `src/components/ResourceList.tsx`

**Interfaces:**
- Consumes new props: `hasMore: boolean`, `isLoadingMore: boolean`, `onLoadMore: () => void`, added to `TResourceListProps`.

- [ ] **Step 1: Add the near-end scroll trigger**

Inside `ResourceList`, after computing `virtualizer`, add:
```tsx
const virtualItems = virtualizer.getVirtualItems();
useEffect(() => {
    if (!hasMore || isLoadingMore) {
        return;
    }
    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem && lastItem.index >= resources.length - 1 - LOAD_MORE_THRESHOLD) {
        onLoadMore();
    }
}, [virtualItems, hasMore, isLoadingMore, resources.length, onLoadMore]);
```
Add `const LOAD_MORE_THRESHOLD = 5;` as a module constant near the top of the file (fires the fetch when the user is within 5 rows of the end of what's loaded, not only at the exact last row).

- [ ] **Step 2: Render a loading-more indicator**

After the virtualized rows' container `Box`, inside the scrollable `parentRef` `Box` but outside the absolutely-positioned sizer, render:
```tsx
{isLoadingMore && (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
    </Box>
)}
```
(Import `CircularProgress` from `@mui/material`.)

- [ ] **Step 3: Type-check, lint, commit**

Run: `yarn build && yarn lint`, then:
```bash
git add src/components/ResourceList.tsx
git commit -m "feat: trigger next-page load from ResourceList scroll position"
```

---

### Task 4: Reconcile with Footer's manual pagination in the scroll-loaded view

**Files:**
- Modify: `src/pages/IndexPage.tsx`

Once scrolling auto-loads more results, a manual "Next" button showing the same data one page at a time (via full navigation) is redundant and their offset bookkeeping isn't unified (Footer computes its own `page` from `location.search`; the scroll-loaded view accumulates in memory without changing the URL). Hide Footer's pagination controls specifically for the paged/scrolled view (leave it fully intact for `manageExport.tsx` and any request that already specifies its own `_count`, which don't use `loadNextPage`).

- [ ] **Step 1: Gate Footer's `links` prop**

Only pass `links={bundle?.link}` to `<Footer>` when the request did NOT use the new scroll-loading path (i.e., when the URL already specified its own `_count`, or `hasMorePages` tracking was never engaged) — pass `links={undefined}` otherwise, since `Footer`'s `showPagination` (`Footer.tsx:26`) is gated on `links` being truthy.

- [ ] **Step 2: Manual verification**

Confirm: a request with an explicit `?_count=50` in the URL still shows Footer's Prev/Next controls and behaves exactly as before (unaffected by this plan). A plain search without an explicit `_count` shows no Footer pagination controls and instead loads more on scroll.

- [ ] **Step 3: Type-check, lint, commit**

Run: `yarn build && yarn lint`, then:
```bash
git add src/pages/IndexPage.tsx
git commit -m "fix: hide redundant manual pagination once scroll-loading is active"
```

---

### Task 5: Manual verification, including the original $summary case

- [ ] **Step 1:** Load a plain resourceType search with many results (no explicit `_count` in the URL). Confirm: first 10 resources load immediately, scrolling near the bottom triggers a visible loading indicator and appends the next 10, this repeats correctly, and stops cleanly when the server stops returning a `next` link.
- [ ] **Step 2:** Load the original bug's case — a `Person/{id}/$summary` for a Person known to produce a large result. Check whether page 1 alone already contains everything (server ignores `_count`/paging for this operation) or whether it genuinely pages. Record the answer in the ledger/PR description either way — it tells us whether this feature actually helps the original report or whether the prerequisite plan's `MAX_RESOURCES`/virtualization fix is still doing all the real work for that specific URL.
- [ ] **Step 3:** Confirm `MAX_RESOURCES = 2000` still caps total accumulated resources across many appended pages (temporarily lower it to verify, then revert, same technique as the prerequisite plan's Task 4).
- [ ] **Step 4:** Confirm "Expand All"/"Collapse All" still behave correctly across newly-appended pages (this exercises the same `ResourceCard` mount/unmount path the prerequisite plan's Task 5 fixed — appended pages mount fresh `ResourceCard`s just like scrolled-into-view ones did).
