# Person/$summary Browser Memory Exhaustion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the browser tab from running out of memory when viewing a Person/Patient `$summary` (or any large search result) in `IndexPage`, without losing any currently-rendered data by default.

**Architecture:** `GET /4_0_0/Person/{id}/$summary` is routed by `src/routes/fhirRoutes.tsx` to `IndexPage`, not `CompositionSummaryPage` (that page only exists at `/composition-summary/...`, reached via a link inside a card). `IndexPage` streams the response through `BaseApi.streamRequest`/`readStreamedBody`, incrementally parses it with `createBundleEntryParser`, and renders one `ResourceCard` per Bundle entry with no cap and no virtualization. Three independent memory sinks compound: (1) `readStreamedBody` retains a full array of raw response bytes *and* a full decoded string simultaneously even when only the string is ever used, (2) every `ResourceCard`/`CompositionSummary` `Accordion` keeps its full content mounted in the DOM even while collapsed, and (3) `IndexPage` keeps every parsed resource in React state and renders all of them as real DOM nodes at once, unbounded. This plan fixes each independently, ordered smallest/lowest-risk first.

**Tech Stack:** React 19, TypeScript, MUI v9 (`Collapse`/`Accordion`), `@tanstack/react-virtual` (new dependency, Task 5), Vite.

## Design Decisions Flagged for Review

These are judgment calls made while writing this plan — please push back on any of them before execution starts:

1. **No automated tests.** This repo has no test runner at all (no `jest`/`vitest`/`@testing-library/*` in `package.json`, no `*.test.*` files, no test script beyond `lint`). Adding a test framework is out of scope for a memory-mitigation fix — that's a separate, larger decision. Each task below is verified instead with `yarn build` (TypeScript compile + prod bundle), `yarn lint`, and a manual dev-server check. If you'd rather stand up a test framework first, say so and we'll split that into its own plan.
2. **Hard cap of 2,000 resources per page load** (Task 4), with a visible "truncated" banner. This is a deterministic circuit-breaker — simpler and more testable than reacting to live browser memory pressure (`performance.memory` is Chrome-only and imprecise; `navigator.deviceMemory` only gives a coarse bucket at page load). If 2,000 is wrong for real `$everything`/`$summary` payloads you've seen, tell me the number.
3. **The resource list becomes an inner scrolling region (`75vh`, `overflow: auto`) instead of scrolling with the whole page** (Task 5), so it can be virtualized with `useVirtualizer` against a known scroll container. The alternative (`useWindowVirtualizer`, keeping full-page scroll) is more complex — it needs the list's offset from the top of the document recomputed whenever content above it changes — for no functional benefit here. Flagging because it's a visible UX change.
4. **Explicitly out of scope:**
   - `downloadFile()`'s full-`Blob` construction (`src/api/baseApi.ts:340-371`) still holds the entire raw response in memory for CSV/Excel/JSON downloads. Fixing that means streaming to disk (File System Access API) or a different download strategy — a bigger redesign than this OOM report warrants.
   - `CompositionSummaryPage.tsx` keeping both `rawResponse` and the parsed `TComposition` in state — it's a secondary, single-resource page; Task 3's Accordion fix already removes its dominant memory cost (mounted DOM).
   - Reactive `performance.memory`/`navigator.deviceMemory`-based throttling — unreliable browser support, treated as a future safety-valve, not a fix.

## Global Constraints

- Do not change any existing FHIR request/response shapes or public component props beyond what's specified in a task.
- Every task must leave `yarn build` and `yarn lint` passing before its commit.
- Preserve existing behavior for small result sets (below the cap, few entries) — these changes must be invisible when there's no memory pressure to relieve.
- Follow existing code conventions in each file (comment style, naming, MUI usage patterns already in that file).

---

## File Structure

- Modify: `src/api/baseApi.ts` — stop retaining unused raw chunks during text-mode streaming (Task 1)
- Modify: `src/components/ResourceCard.tsx` — unmount collapsed card content (Task 2)
- Modify: `src/components/CompositionSummary.tsx` — unmount collapsed accordion content (Task 3)
- Modify: `src/pages/IndexPage.tsx` — cap accumulated resources (Task 4); replace inline `.map()` with `<ResourceList>` (Task 5)
- Create: `src/components/ResourceList.tsx` — virtualized resource card list (Task 5)
- Modify: `package.json` — add `@tanstack/react-virtual` (Task 5)

---

### Task 1: Stop retaining unused raw chunks during text-mode streaming

`BaseApi.readStreamedBody` always pushes every incoming `Uint8Array` into a `chunks` array (`src/api/baseApi.ts:273`), even in `responseMode: 'text'` requests (the ones `IndexPage`/`CompositionSummaryPage` use to fetch Bundles) where nothing ever reads `chunks` afterward — `getData()` and `request()` (lines 293-338) destructure only `text`/`status`/`incomplete` from `streamRequest`'s result. Only `downloadFile()` (line 344, `responseMode: 'binary'`) actually uses `chunks`. So today, streaming a large Bundle holds the full raw bytes *and* the full decoded string in memory at once for no reason — confirmed via `grep -rn "\.chunks\b" src/` showing no other caller.

**Files:**
- Modify: `src/api/baseApi.ts:273` (inside `readStreamedBody`, the `while (!done)` loop)

**Interfaces:**
- No signature changes. `StreamRequestResult.chunks` still exists and is still populated correctly for `responseMode: 'binary'` (used by `downloadFile`); it's simply left empty for `responseMode: 'text'`.

- [ ] **Step 1: Make chunk retention conditional on responseMode**

Change:
```ts
                chunks.push(result.value);
                receivedBytes += result.value.length;
                if (responseMode === 'text') {
                    text += decoder.decode(result.value, { stream: true });
                }
```
to:
```ts
                receivedBytes += result.value.length;
                if (responseMode === 'binary') {
                    chunks.push(result.value);
                } else {
                    text += decoder.decode(result.value, { stream: true });
                }
```

- [ ] **Step 2: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both succeed with no new errors.

- [ ] **Step 3: Manual smoke check**

Run: `yarn dev`, open a `Patient` or `Person` search result page and a `downloadFile`-backed feature (e.g. the "Open as Spreadsheet"/download link on a `Patient`/`Person`/`Practitioner` card from `FileDownload.tsx`). Confirm both still work — the Bundle still renders, and the downloaded file still opens correctly with the expected content. This is the fastest way to catch a regression, since `downloadFile` is the one path that must still see populated `chunks`.

- [ ] **Step 4: Commit**

```bash
git add src/api/baseApi.ts
git commit -m "fix: stop retaining unused raw chunks during text-mode streaming"
```

---

### Task 2: Unmount collapsed ResourceCard content from the DOM

`ResourceCard`'s `<Collapse in={open}>` (`src/components/ResourceCard.tsx:154`) has no `mountOnEnter`/`unmountOnExit`, so `CardContent` — including the full `ResourceItem`, `Json` (raw JSON viewer), and any `FileDownload` links — stays mounted in the DOM for every card regardless of whether it's expanded. For a `$summary` Bundle with thousands of entries, that's thousands of fully-built DOM subtrees before the user opens a single one.

**Files:**
- Modify: `src/components/ResourceCard.tsx:154`

**Interfaces:**
- No prop or behavior changes visible to callers (`IndexPage` passes the same props). Purely internal to how `Collapse` renders its children.

- [ ] **Step 1: Add mountOnEnter and unmountOnExit to the Collapse**

Change:
```tsx
            <Collapse in={open}>
```
to:
```tsx
            <Collapse in={open} mountOnEnter unmountOnExit>
```

`mountOnEnter` skips building the content at all until the card is opened for the first time (the common case for a huge result set: most cards are never opened). `unmountOnExit` removes it again after closing.

- [ ] **Step 2: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both succeed with no new errors.

- [ ] **Step 3: Manual smoke check**

Run: `yarn dev`, open any search results page, expand a card, confirm its content (JSON viewer, edit/IPS/composition links, file download) still renders correctly, collapse it, and open it again — confirm nothing is stuck half-rendered or loses state it needs (there's no per-card fetched state here, so this should be a non-issue, but verify). Use the browser DevTools Elements panel to confirm a collapsed card's `CardContent` is genuinely absent from the DOM, not just visually hidden.

- [ ] **Step 4: Commit**

```bash
git add src/components/ResourceCard.tsx
git commit -m "fix: unmount collapsed ResourceCard content instead of hiding it"
```

---

### Task 3: Unmount collapsed CompositionSummary accordion content from the DOM

Same problem, different component: `CompositionSummary.tsx` renders a group-level `Accordion` (`src/components/CompositionSummary.tsx:250`) and a per-section `Accordion` (`src/components/CompositionSummary.tsx:416`), neither of which unmounts its `AccordionDetails` when collapsed. MUI's `Accordion` doesn't expose `mountOnEnter`/`unmountOnExit` directly — they belong to the internal `Collapse` it renders via its `transition` slot, so they're set through `slotProps.transition`.

**Files:**
- Modify: `src/components/CompositionSummary.tsx:250` (group accordion)
- Modify: `src/components/CompositionSummary.tsx:416` (per-section accordion)

**Interfaces:**
- No prop or behavior changes visible to callers. Purely internal to how each `Accordion` renders its `AccordionDetails`.

- [ ] **Step 1: Add slotProps to the group-level Accordion**

Change (`src/components/CompositionSummary.tsx:250`):
```tsx
            <Accordion key={`group-${index}`} disableGutters sx={{ ml: 2, mb: 1 }}>
```
to:
```tsx
            <Accordion
                key={`group-${index}`}
                disableGutters
                sx={{ ml: 2, mb: 1 }}
                slotProps={{ transition: { mountOnEnter: true, unmountOnExit: true } }}
            >
```

- [ ] **Step 2: Add slotProps to the per-section Accordion**

Change (`src/components/CompositionSummary.tsx:416`):
```tsx
                    <Accordion key={section.id ? String(section.id) : index} sx={{ mb: 2 }}>
```
to:
```tsx
                    <Accordion
                        key={section.id ? String(section.id) : index}
                        sx={{ mb: 2 }}
                        slotProps={{ transition: { mountOnEnter: true, unmountOnExit: true } }}
                    >
```

- [ ] **Step 3: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both succeed with no new errors.

- [ ] **Step 4: Manual smoke check**

Run: `yarn dev`, open `/composition-summary/4_0_0/Composition/{id}` for a Composition with multiple sections, expand and collapse both a group and a leaf section, confirm content still renders correctly each time. Confirm via DevTools Elements panel that a collapsed section's `AccordionDetails` (entry chips, nested `SectionGroup`) is absent from the DOM.

- [ ] **Step 5: Commit**

```bash
git add src/components/CompositionSummary.tsx
git commit -m "fix: unmount collapsed CompositionSummary accordion content instead of hiding it"
```

---

### Task 4: Cap the number of resources IndexPage keeps in memory and renders

`IndexPage` accumulates every streamed entry into `incrementalResults` (`src/pages/IndexPage.tsx:195-217`) and, on completion, stores the full `json.entry` array in `resources` state (lines 271-295) with no limit. This task adds a hard ceiling (`MAX_RESOURCES = 2000`) applied consistently on both the incremental-streaming path and the final/fallback paths, plus a visible banner when truncation happens, per [[Design Decisions Flagged for Review]] item 2.

**Files:**
- Modify: `src/pages/IndexPage.tsx`

**Interfaces:**
- Produces: a module-level `const MAX_RESOURCES = 2000;` and a new `truncated` boolean state, read by `getBox()` to render a warning `Alert`. No change to any props IndexPage receives or to any function signatures used by other files.

- [ ] **Step 1: Add the cap constant and truncated state**

Add near the top of the file, after the imports (`src/pages/IndexPage.tsx:23`):
```tsx
// Hard ceiling on how many resources IndexPage will hold in state / render for a single
// page load. Without this, an unbounded Bundle (e.g. a Person $summary/$everything with
// tens of thousands of entries) grows the resources array and the DOM without limit and
// can exhaust the tab's memory. Adjust if real payloads need a different ceiling.
const MAX_RESOURCES = 2000;
```

Add alongside the other `useState` declarations (`src/pages/IndexPage.tsx:37`, right after `indexStart`):
```tsx
    const [truncated, setTruncated] = useState(false);
```

- [ ] **Step 2: Reset truncated at the start of every request**

In `callApi`, change:
```tsx
            try {
                setLoading(true);
```
to:
```tsx
            try {
                setLoading(true);
                setTruncated(false);
```

(This prevents a truncation banner from a previous request lingering across navigation to a smaller result set.)

- [ ] **Step 3: Cap the incremental-streaming accumulation**

Change (`src/pages/IndexPage.tsx:195-217`):
```tsx
                    let incrementalResults: any[] = [];
                    let parserFailed = false;
                    const streamParser = shouldBeJsonFormat
                        ? undefined
                        : createBundleEntryParser(
                              (resource) => {
                                  // Accumulate without copying per entry — the array is copied once per
                                  // network chunk (below), not once per resource, so a large Bundle
                                  // doesn't trigger one React re-render per entry. The end-of-stream full
                                  // JSON.parse result (below) still overwrites this once the response
                                  // completes, so a parser miss never leaves the page silently short of
                                  // data — it just skips the "populate live" effect for whatever wasn't
                                  // caught incrementally.
                                  incrementalResults.push(resource);
                              },
                              (err) => {
                                  console.error(
                                      'Incremental bundle parsing failed, falling back to full parse:',
                                      err
                                  );
                                  parserFailed = true;
                              }
                          );
```
to:
```tsx
                    let incrementalResults: any[] = [];
                    let incrementalTruncated = false;
                    let parserFailed = false;
                    const streamParser = shouldBeJsonFormat
                        ? undefined
                        : createBundleEntryParser(
                              (resource) => {
                                  // Accumulate without copying per entry — the array is copied once per
                                  // network chunk (below), not once per resource, so a large Bundle
                                  // doesn't trigger one React re-render per entry. The end-of-stream full
                                  // JSON.parse result (below) still overwrites this once the response
                                  // completes, so a parser miss never leaves the page silently short of
                                  // data — it just skips the "populate live" effect for whatever wasn't
                                  // caught incrementally.
                                  if (incrementalResults.length < MAX_RESOURCES) {
                                      incrementalResults.push(resource);
                                  } else {
                                      incrementalTruncated = true;
                                  }
                              },
                              (err) => {
                                  console.error(
                                      'Incremental bundle parsing failed, falling back to full parse:',
                                      err
                                  );
                                  parserFailed = true;
                              }
                          );
```

- [ ] **Step 4: Cap the final/fallback assignment paths**

Change (`src/pages/IndexPage.tsx:271-295`):
```tsx
                    if (shouldBeJsonFormat) {
                        setResources(json);
                    } else if (json && json.entry) {
                        setResources(json.entry);
                        setBundle(json);
                        if (resourceType) {
                            document.title = resourceType;
                        }
                    } else if (incomplete && incrementalResults.length > 0) {
                        // Connection dropped before the full Bundle could be parsed, but the incremental
                        // parser already captured some resources from what did arrive — keep those instead
                        // of wiping the list to empty.
                        setResources(incrementalResults);
                        if (resourceType) {
                            document.title = resourceType;
                        }
                    } else {
```
to:
```tsx
                    if (shouldBeJsonFormat) {
                        setResources(json);
                    } else if (json && json.entry) {
                        const overflowing = json.entry.length > MAX_RESOURCES;
                        setResources(overflowing ? json.entry.slice(0, MAX_RESOURCES) : json.entry);
                        setTruncated(overflowing);
                        setBundle(json);
                        if (resourceType) {
                            document.title = resourceType;
                        }
                    } else if (incomplete && incrementalResults.length > 0) {
                        // Connection dropped before the full Bundle could be parsed, but the incremental
                        // parser already captured some resources from what did arrive — keep those instead
                        // of wiping the list to empty.
                        setResources(incrementalResults);
                        setTruncated(incrementalTruncated);
                        if (resourceType) {
                            document.title = resourceType;
                        }
                    } else {
```

- [ ] **Step 5: Render the truncation banner**

In `getBox()`, add right after the opening `<>` and the existing `loading && <LinearProgress />` line (`src/pages/IndexPage.tsx:69-70`):
```tsx
                {loading && <LinearProgress />}
                {truncated && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Showing the first {MAX_RESOURCES.toLocaleString()} resources. The full result set is
                        larger than that — narrow your search (e.g. with <code>_count</code> and
                        <code>_getpagesoffset</code>) to see the rest.
                    </Alert>
                )}
```

- [ ] **Step 6: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both succeed with no new errors.

- [ ] **Step 7: Manual smoke check**

Run: `yarn dev`. First confirm a normal, small result set still renders with no banner and an unchanged resource count. Then confirm truncation triggers correctly: temporarily set `MAX_RESOURCES = 2` locally, load any search page with 3+ results, confirm exactly 2 render and the warning banner appears, then revert the temporary value to `2000` before committing.

- [ ] **Step 8: Commit**

```bash
git add src/pages/IndexPage.tsx
git commit -m "fix: cap resources IndexPage accumulates and renders per page load"
```

---

### Task 5: Virtualize the resource card list so only visible cards mount

Even after Tasks 2-4, every one of up to 2,000 `ResourceCard`s mounts as a real DOM node at once via `resources?.map(...)` (`src/pages/IndexPage.tsx:139-155`) — Task 2's `mountOnEnter` keeps each card's *collapsed body* out of the DOM, but the `Card`/`CardHeader` shell for every single row still mounts immediately. This task extracts the list into a new `ResourceList` component that only mounts DOM for rows currently near the viewport, using `@tanstack/react-virtual`. Per [[Design Decisions Flagged for Review]] item 3, the list becomes its own scrollable region (`75vh`) rather than scrolling with the full page.

**Files:**
- Modify: `package.json` (add dependency)
- Create: `src/components/ResourceList.tsx`
- Modify: `src/pages/IndexPage.tsx:139-155` (replace inline `.map()` with `<ResourceList>`) and its imports

**Interfaces:**
- Produces (`ResourceList.tsx`): `export default ResourceList`, a component with props:
  ```ts
  type TResourceListProps = {
      resources: any[];
      indexStart: number;
      resourceCardExpanded: boolean;
      expandAll: boolean;
      collapseAll: boolean;
      setExpandAll: React.Dispatch<React.SetStateAction<boolean>>;
      setCollapseAll: React.Dispatch<React.SetStateAction<boolean>>;
  };
  ```
- Consumes (in `IndexPage.tsx`): the existing `resources`, `indexStart`, `resourceCardExpanded`, `expandAll`, `collapseAll`, `setExpandAll`, `setCollapseAll` state/values already defined in that file — no new state needed in `IndexPage`.

- [ ] **Step 1: Add the virtualization dependency**

Run: `yarn add @tanstack/react-virtual@^3`
Expected: `package.json` gains a `@tanstack/react-virtual` entry under `dependencies`; `yarn.lock` updates.

- [ ] **Step 2: Create ResourceList.tsx**

Create `src/components/ResourceList.tsx`:
```tsx
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box } from '@mui/material';
import ResourceCard from './ResourceCard';

type TResourceListProps = {
    resources: any[];
    indexStart: number;
    resourceCardExpanded: boolean;
    expandAll: boolean;
    collapseAll: boolean;
    setExpandAll: React.Dispatch<React.SetStateAction<boolean>>;
    setCollapseAll: React.Dispatch<React.SetStateAction<boolean>>;
};

// Renders `resources` as ResourceCards inside a fixed-height scroll container, mounting DOM
// only for rows near the viewport. Row height varies (cards grow when expanded), so this uses
// dynamic measurement (`virtualizer.measureElement`) rather than a fixed estimate — each row's
// real height is measured after it renders and the virtualizer's ResizeObserver picks up
// changes when a card is expanded/collapsed.
const ResourceList = ({
    resources,
    indexStart,
    resourceCardExpanded,
    expandAll,
    collapseAll,
    setExpandAll,
    setCollapseAll,
}: TResourceListProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: resources.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 96,
        overscan: 8,
    });

    return (
        <Box ref={parentRef} sx={{ height: '75vh', overflow: 'auto', contain: 'strict' }}>
            <Box sx={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                    const fullResource = resources[virtualRow.index];
                    const resource = fullResource.resource || fullResource;
                    const error = resource.resourceType === 'OperationOutcome';
                    return (
                        <Box
                            key={virtualRow.key}
                            ref={virtualizer.measureElement}
                            data-index={virtualRow.index}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <ResourceCard
                                index={indexStart + virtualRow.index}
                                resource={resource}
                                expanded={resourceCardExpanded}
                                expandAll={expandAll}
                                collapseAll={collapseAll}
                                setExpandAll={setExpandAll}
                                setCollapseAll={setCollapseAll}
                                error={error}
                            />
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default ResourceList;
```

- [ ] **Step 3: Wire ResourceList into IndexPage**

Change the import block (`src/pages/IndexPage.tsx:11`):
```tsx
import ResourceCard from '../components/ResourceCard';
```
to:
```tsx
import ResourceList from '../components/ResourceList';
```

Change the render block (`src/pages/IndexPage.tsx:139-155`):
```tsx
                {resources?.map((fullResource: any, index: number) => {
                    const resource = fullResource.resource || fullResource;
                    const error = resource.resourceType === 'OperationOutcome';
                    return (
                        <ResourceCard
                            key={index}
                            index={indexStart + index}
                            resource={resource}
                            expanded={resourceCardExpanded}
                            expandAll={expandAll}
                            collapseAll={collapseAll}
                            setExpandAll={setExpandAll}
                            setCollapseAll={setCollapseAll}
                            error={error}
                        />
                    );
                })}
```
to:
```tsx
                {resources && resources.length > 0 && (
                    <ResourceList
                        resources={resources}
                        indexStart={indexStart}
                        resourceCardExpanded={resourceCardExpanded}
                        expandAll={expandAll}
                        collapseAll={collapseAll}
                        setExpandAll={setExpandAll}
                        setCollapseAll={setCollapseAll}
                    />
                )}
```

- [ ] **Step 4: Type-check and lint**

Run: `yarn build && yarn lint`
Expected: both succeed with no new errors.

- [ ] **Step 5: Manual smoke check**

Run: `yarn dev`. Load a search results page with enough entries to scroll (if needed, temporarily lower `MAX_RESOURCES` from Task 4, or use a resourceType search known to return many results). Confirm:
- The list scrolls smoothly inside its own region and the page around it stays put.
- Scrolling down mounts new cards and earlier ones disappear from the DOM (check via DevTools Elements panel — the total number of mounted `ResourceCard`s at any time should be roughly `overscan * 2` plus what's visible, not the full result count).
- Expanding a card grows its row correctly and doesn't overlap the next row (confirms dynamic measurement is picking up the height change).
- "Expand All" / "Collapse All" buttons still work across the whole list, not just visible rows.
- The single-resource "Answer" banner (narrative `text.div`) above the list still renders correctly when there's exactly one result.

- [ ] **Step 6: Commit**

```bash
git add package.json yarn.lock src/components/ResourceList.tsx src/pages/IndexPage.tsx
git commit -m "perf: virtualize IndexPage resource list to bound mounted DOM nodes"
```

---

## Summary

| Task | Fixes | Risk |
|---|---|---|
| 1 | ~2x peak memory during any large streamed fetch (unused raw byte buffer) | Low — internal-only change |
| 2 | Full DOM per collapsed search-result card | Low — one prop change |
| 3 | Full DOM per collapsed Composition accordion | Low — one prop change, two spots |
| 4 | Unbounded resource count in state/DOM for pathological result sets | Low-medium — new UX (banner), needs the cap value confirmed |
| 5 | Unbounded *mounted* DOM nodes for large-but-under-cap result sets | Medium — new dependency, new component, UX change (scroll region) |
