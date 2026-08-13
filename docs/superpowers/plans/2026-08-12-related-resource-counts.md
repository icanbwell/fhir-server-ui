# Related Resource Counts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a resource page shows a related link — a direct `Reference` field (e.g.
`Patient.generalPractitioner`) or a "Related Resources" reverse-search link (e.g.
Patient → Observations) — asynchronously fetch and display how many resources actually
live behind that link, without blocking or slowing down the initial page render. A
single-resource `Reference` link gets a green check (resource exists) or red cross
(resource is missing/deleted); a reverse-search link gets an entry count in brackets,
e.g. `(5)`.

**Architecture:** A new `FhirApi.getResourceCount()` method asks the FHIR server for a
`Bundle.total` via `_summary=count&_total=accurate` instead of fetching entries. A new
`useResourceCount` hook wraps that call in `useEffect`/`useState` (mirroring the
`FileDownload.tsx` loading-state pattern already in this codebase) and fires the fetch
after mount, never blocking render. Two new small "list item" components —
`ReferenceLink` and `ReverseReferenceLink` — each call the hook once per rendered link
(required because `eslint-plugin-react-hooks` forbids calling a hook inside the existing
`.map()` callbacks in `Reference.tsx`/`ReverseReference.tsx`) and render the
check/cross or count badge next to the existing `OpenInNewIcon` link.

**Tech Stack:** React 19, TypeScript 6 (strict), MUI v9, Vite, Yarn 4 (Berry,
`nodeLinker: node-modules`). No test framework exists in this repo.

**Spec:** No separate design doc — the spec is the plan's Goal section above, distilled
from the feature request (verified against the codebase during planning, see Global
Constraints and Task 1).

## Global Constraints

- **No automated test framework exists in this repo** (no jest/vitest/playwright, no
  `*.test.*` files). Every task replaces the "write a failing test" cycle with: make the
  change, run `yarn lint && yarn tsc --noEmit` (0 errors; this repo's current baseline is
  0 errors / 6 pre-existing warnings in unrelated files — `ResourceList.tsx` and
  `streamingFetch.ts` — do not fix those, and do not introduce new ones), then manually
  verify via `yarn dev`.
- **Use `yarn`, not `npm`, in this repo.** `package.json`/`yarn.lock` plus `.yarnrc.yml`
  (`nodeLinker: node-modules`) mean this is a Yarn 4 (Berry) project. `npm install` fails
  here with an `ERESOLVE` peer-dependency error (`eslint@10.x` vs.
  `eslint-plugin-react@7.37.5`'s `^8.57.0 || ^9.7.0` peer requirement) — this is a
  pre-existing, unrelated issue; do not attempt to fix it. `yarn install` succeeds (with
  the same peer-dependency mismatch surfaced only as a `YN0060` warning, not a hard
  error) — always use `yarn install`/`yarn lint`/`yarn tsc`/`yarn dev` in any worktree.
- **Never call a React hook inside `.map()`, a loop, or a conditional.**
  `eslint.config.js` enables `eslint-plugin-react-hooks`'s `recommended` rules, which
  hard-fails on this. Both `Reference.tsx` and `ReverseReference.tsx` currently render
  multiple links via `.map()` from a single component instance — the new count-fetching
  hook must live in a per-item child component (`ReferenceLink` / `ReverseReferenceLink`
  below), never inline in the `.map()` callback.
- **This app has no `HEAD` support and no `Bundle.total` usage today.**
  `HttpMethod` (`src/context/LastRequestContext.ts:7`) is
  `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'` — there is no `HEAD`, and adding one is
  out of scope. Existing pagination (`IndexPage.tsx`) reads `Bundle.link`, never
  `Bundle.total` — this plan is the first thing in the codebase to read `.total`, which
  is why Task 1 verifies the server actually returns it before any code is written
  against the assumption.
- **Stay on the existing fetch wrapper, not a new one.** All FHIR calls go through
  `BaseApi`/`FhirApi` (`src/api/baseApi.ts`, `src/api/fhirApi.ts`) — same-origin check,
  auth header injection, and 401 handling all live there. The new count call must be a
  method on `FhirApi`, built on top of the existing `getUrl()`/`getData()`, not a raw
  `fetch()`.
- **Follow the `FileDownload.tsx` context-consumption pattern exactly.** `Reference.tsx`
  and `ReverseReference.tsx` currently read no context at all (pure link renderers). Any
  new component that needs to call the FHIR server pulls `fhirUrl` from
  `EnvironmentContext` and `setUserDetails` from `UserContext`, exactly like
  `src/components/FileDownload.tsx:19-25`.
- **This work happens in the git worktree at
  `.worktrees/related-links-counts` (branch `related-links-resource-counts`)**, created
  because other Claude agents are working in parallel in the main `fhir-server-ui`
  checkout. Do not touch the main checkout while executing this plan.

---

### Task 1: Verify the FHIR server's count-query contract

**Files:** None (manual verification only — this task produces a decision that Task 2's
code depends on, not a code change).

**Interfaces:**
- Produces: confirmation of which query parameter combination makes the dev FHIR server
  return `Bundle.total` without returning `Bundle.entry`, which Task 2 bakes into
  `FhirApi.getResourceCount()`.

- [ ] **Step 1: Get a bearer token and a real patient ID**

  Start the app (`yarn dev`), log in against the `dev` environment, open any `Patient`
  resource in the resource browser, and copy its `id` from the URL
  (`/4_0_0/Patient/<id>`). Open browser DevTools → Network tab, find any XHR request to
  `fhir.dev.icanbwell.com`, and copy its `Authorization: Bearer <token>` header value.

- [ ] **Step 2: Try `_summary=count` alone**

  ```bash
  curl -s "https://fhir.dev.icanbwell.com/4_0_0/Observation?patient=Patient/<PATIENT_ID>&_summary=count" \
    -H "Authorization: Bearer <TOKEN>" -H "Accept: application/json" | python3 -m json.tool
  ```

  Look at the response. It will be a `Bundle` — check whether `total` is present as a
  number and whether `entry` is absent or empty.

- [ ] **Step 3: If `total` was missing or looked wrong, add `_total=accurate`**

  ```bash
  curl -s "https://fhir.dev.icanbwell.com/4_0_0/Observation?patient=Patient/<PATIENT_ID>&_summary=count&_total=accurate" \
    -H "Authorization: Bearer <TOKEN>" -H "Accept: application/json" | python3 -m json.tool
  ```

  Compare `total` here against the actual entry count you can see by removing
  `_summary=count&_total=accurate` and running the plain search — they must match.

- [ ] **Step 4: Record the result**

  - **If Step 2 or Step 3 returned a correct `total` with no/empty `entry`:** Task 2 below
    is written for exactly this case (`_summary=count&_total=accurate`) — no changes
    needed, proceed to Task 2.
  - **If neither returned a usable `total`:** stop and re-open this plan with the user —
    Task 2 includes a documented fallback (`_elements=id`, counting `entry.length`) but
    switching to it changes the "no `HEAD` support" tradeoff (it fetches ID-only entries
    instead of a bare count) and is worth a quick confirmation before proceeding.

- [ ] **Step 5: Commit**

  No files changed in this task — nothing to commit. Note the confirmed parameter
  combination in your PR description for the next task's reviewer.

---

### Task 2: Add `FhirApi.getResourceCount()`

**Files:**
- Modify: `src/api/fhirApi.ts:18-24` (add interface), `src/api/fhirApi.ts:119` (add method
  after `getUrl()`)

**Interfaces:**
- Consumes: `FhirApi.getUrl()` (`src/api/fhirApi.ts:83-119`, already handles
  `AuditEvent` date-bound injection and `_metaUuid`/`_count` defaults via
  `addMissingRequiredParams`), `FhirApi.getData()` (inherited from `BaseApi`,
  `src/api/baseApi.ts:302-323`).
- Produces: `getResourceCount({ resourceType, queryParameters }): Promise<number | null>`
  on `FhirApi` — `null` means "count unavailable" (non-2xx response or missing/malformed
  `total`), never throws.

- [ ] **Step 1: Add the params interface**

  In `src/api/fhirApi.ts`, immediately after the `GetUrlParams` interface (after line 24),
  add:

  ```ts
  interface GetResourceCountParams {
      resourceType: string;
      queryParameters?: string[];
  }
  ```

- [ ] **Step 2: Add the method**

  Immediately after the closing brace of `getUrl()` (after line 119, before
  `mergeResource`), add:

  ```ts
  async getResourceCount({ resourceType, queryParameters }: GetResourceCountParams): Promise<number | null> {
      const url = this.getUrl({ resourceType, queryParameters });
      url.searchParams.set('_summary', 'count');
      url.searchParams.set('_total', 'accurate');
      const { status, json } = await this.getData({ urlString: url.toString() });
      if (status && status >= 200 && status < 300 && typeof json?.total === 'number') {
          return json.total;
      }
      return null;
  }
  ```

  > **Fallback (only use if Task 1 found `_summary=count`/`_total=accurate` unreliable):**
  > replace the body above with an `_elements=id` search and count the returned entries
  > instead of trusting `total`:
  > ```ts
  > async getResourceCount({ resourceType, queryParameters }: GetResourceCountParams): Promise<number | null> {
  >     const url = this.getUrl({ resourceType, queryParameters });
  >     url.searchParams.set('_elements', 'id');
  >     url.searchParams.set('_count', '1000');
  >     const { status, json } = await this.getData({ urlString: url.toString() });
  >     if (status && status >= 200 && status < 300 && Array.isArray(json?.entry)) {
  >         return json.entry.length;
  >     }
  >     return null;
  > }
  > ```

- [ ] **Step 3: Verify**

  Run: `yarn lint && yarn tsc --noEmit`
  Expected: 0 errors (same 6 pre-existing warnings as baseline, none in `fhirApi.ts`).

- [ ] **Step 4: Commit**

  ```bash
  git add src/api/fhirApi.ts
  git commit -m "feat: add FhirApi.getResourceCount for lightweight resource-count checks"
  ```

---

### Task 3: Add the `useResourceCount` hook

**Files:**
- Create: `src/hooks/useResourceCount.ts`

**Interfaces:**
- Consumes: `FhirApi.getResourceCount()` (Task 2), `EnvironmentContext.fhirUrl`
  (`src/context/EnvironmentContext.ts`), `UserContext.setUserDetails`
  (`src/context/UserContext.ts`).
- Produces: `useResourceCount({ resourceType, queryParameters }): { count: number | null;
  isLoading: boolean; error: string | null }` — `resourceType`/`queryParameters` may be
  `undefined` to skip fetching entirely (renders no badge).

- [ ] **Step 1: Write the hook**

  Create `src/hooks/useResourceCount.ts`:

  ```ts
  import { useContext, useEffect, useState } from 'react';
  import EnvironmentContext from '../context/EnvironmentContext';
  import UserContext from '../context/UserContext';
  import FhirApi from '../api/fhirApi';

  export function useResourceCount({
      resourceType,
      queryParameters,
  }: {
      resourceType: string | undefined;
      queryParameters: string[] | undefined;
  }): { count: number | null; isLoading: boolean; error: string | null } {
      const { fhirUrl } = useContext(EnvironmentContext);
      const { setUserDetails } = useContext(UserContext);
      const [count, setCount] = useState<number | null>(null);
      const [isLoading, setIsLoading] = useState<boolean>(false);
      const [error, setError] = useState<string | null>(null);

      // queryParameters is a fresh array literal on every render from the caller
      // (e.g. `[\`${property}=${resolvedId}\`]`) — depending on it by identity would
      // refetch every render. Depend on its serialized contents instead.
      const serializedParams = JSON.stringify(queryParameters);

      useEffect(() => {
          if (!resourceType || !queryParameters) {
              return;
          }
          let cancelled = false;
          const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
          setIsLoading(true);
          setError(null);
          fhirApi
              .getResourceCount({ resourceType, queryParameters })
              .then((result) => {
                  if (!cancelled) {
                      setCount(result);
                  }
              })
              .catch((err: unknown) => {
                  if (!cancelled) {
                      setError(err instanceof Error ? err.message : 'Failed to load count');
                  }
              })
              .finally(() => {
                  if (!cancelled) {
                      setIsLoading(false);
                  }
              });
          return () => {
              cancelled = true;
          };
          // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [fhirUrl, setUserDetails, resourceType, serializedParams]);

      return { count, isLoading, error };
  }
  ```

  > The `catch` is a defensive no-op in practice — `FhirApi.getData()` never rejects on a
  > network failure today (`BaseApi.streamRequest()` catches and returns
  > `{ status: undefined, ... }` instead, see `src/api/baseApi.ts:182-200`) — but keeping
  > it means this hook degrades safely even if that changes later.

- [ ] **Step 2: Verify**

  Run: `yarn lint && yarn tsc --noEmit`
  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/hooks/useResourceCount.ts
  git commit -m "feat: add useResourceCount hook for async resource-count fetches"
  ```

---

### Task 4: Direct `Reference` links show a check/cross

**Files:**
- Create: `src/partials/ReferenceLink.tsx`
- Modify: `src/partials/Reference.tsx` (full file, currently 62 lines)

**Interfaces:**
- Consumes: `useResourceCount()` (Task 3).
- Produces: `ReferenceLink` component (props: `{ reference: string; display?: string }`)
  — not consumed elsewhere in this plan, but used by `Reference.tsx`.

- [ ] **Step 1: Create `ReferenceLink.tsx`**

  ```tsx
  import { Typography, Link, CircularProgress } from '@mui/material';
  import CheckCircleIcon from '@mui/icons-material/CheckCircle';
  import CancelIcon from '@mui/icons-material/Cancel';
  import OpenInNewIcon from '@mui/icons-material/OpenInNew';
  import { useResourceCount } from '../hooks/useResourceCount';

  type TReferenceLinkProps = {
      reference: string;
      display?: string;
  };

  function ReferenceLink({ reference, display }: TReferenceLinkProps) {
      const [resourceType, id] = reference.split('/');
      const { count, isLoading, error } = useResourceCount({
          resourceType,
          queryParameters: id ? [`_id=${id}`] : undefined,
      });

      return (
          <Link
              href={`/4_0_0/${reference}`}
              rel="noopener noreferrer"
              sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textDecoration: 'none',
                  '&:hover': {
                      textDecoration: 'underline',
                  },
              }}
          >
              <Typography>{display || reference}</Typography>
              {isLoading && <CircularProgress size={14} />}
              {!isLoading && !error && count !== null && (
                  count > 0 ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                  ) : (
                      <CancelIcon color="error" fontSize="small" />
                  )
              )}
              <OpenInNewIcon />
          </Link>
      );
  }

  export default ReferenceLink;
  ```

- [ ] **Step 2: Rewrite `Reference.tsx` to delegate to `ReferenceLink`**

  Replace the full contents of `src/partials/Reference.tsx` with:

  ```tsx
  import { useMemo } from 'react';
  import { Typography, Box } from '@mui/material';
  import { TBaseResourceProps } from '../types/baseTypes';
  import { TExtension } from '../types/partials/Extension';
  import { IdentifierSystem } from '../utils/identifierSystem';
  import { TReference } from '../types/partials/Reference';
  import ReferenceLink from './ReferenceLink';

  type TReferenceProps = TBaseResourceProps & {
      reference: any;
      field?: string;
  };

  function Reference({ reference: references = [], name, field }: TReferenceProps) {
      const uuidReferences = useMemo(() => {
          const referenceArray = Array.isArray(references) ? references : [references];

          return referenceArray
              .map((reference: any) => {
                  // When `field` is set, `reference` is a backbone-element wrapper (e.g. an
                  // Encounter.diagnosis entry) and the actual FHIR Reference — including its
                  // `display` — lives at reference[field], not on the wrapper itself.
                  const target = field ? reference[`${field}`] : reference;
                  const uuidReference = target?.extension?.find(
                      (e: TExtension) => e.url === IdentifierSystem.uuid
                  )?.valueString;
                  return { reference: uuidReference, display: target?.display };
              })
              .filter((u: TReference) => u.reference);
      }, [references, field]);

      return uuidReferences && uuidReferences.length > 0 && uuidReferences[0] ? (
          <Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
              {uuidReferences.map((reference: TReference, index: Number) =>
                  reference ? (
                      <ReferenceLink
                          key={`${index}`}
                          reference={String(reference.reference)}
                          display={reference.display ? String(reference.display) : undefined}
                      />
                  ) : null
              )}
          </Box>
      ) : null;
  }

  export default Reference;
  ```

- [ ] **Step 3: Verify**

  Run: `yarn lint && yarn tsc --noEmit`
  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/partials/ReferenceLink.tsx src/partials/Reference.tsx
  git commit -m "feat: show check/cross existence indicator on direct Reference links"
  ```

---

### Task 5: "Related Resources" links show a count badge

**Files:**
- Create: `src/partials/ReverseReferenceLink.tsx`
- Modify: `src/partials/ReverseReference.tsx` (full file, currently 68 lines)

**Interfaces:**
- Consumes: `useResourceCount()` (Task 3).
- Produces: `ReverseReferenceLink` component (props: `{ target: string; property: string;
  resolvedId: string }`) — used by `ReverseReference.tsx`.

- [ ] **Step 1: Create `ReverseReferenceLink.tsx`**

  ```tsx
  import { Typography, Link, Chip, CircularProgress } from '@mui/material';
  import OpenInNewIcon from '@mui/icons-material/OpenInNew';
  import { useResourceCount } from '../hooks/useResourceCount';

  type TReverseReferenceLinkProps = {
      target: string;
      property: string;
      resolvedId: string;
  };

  function ReverseReferenceLink({ target, property, resolvedId }: TReverseReferenceLinkProps) {
      const href = (() => {
          if (target === 'AuditEvent') {
              const currDate = new Date().toISOString().split('T')[0];
              const dateBeforeWeek = new Date();
              dateBeforeWeek.setDate(dateBeforeWeek.getDate() - 7);
              return `/4_0_0/${target}?${property}=${resolvedId}&date=lt.${currDate}&date=gt.${dateBeforeWeek.toISOString().split('T')[0]}`;
          }
          return `/4_0_0/${target}?${property}=${resolvedId}`;
      })();

      // AuditEvent's date bounds don't need to be repeated here: FhirApi.getUrl() ->
      // addMissingRequiredParams() already appends the same rolling 7-day window
      // (src/utils/auditEventDateFilter.ts) automatically for AuditEvent searches.
      const { count, isLoading, error } = useResourceCount({
          resourceType: target,
          queryParameters: [`${property}=${resolvedId}`],
      });

      return (
          <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textDecoration: 'none',
                  '&:hover': {
                      textDecoration: 'underline',
                  },
              }}
          >
              <Typography>{target}</Typography>
              {isLoading && <CircularProgress size={14} />}
              {!isLoading && !error && count !== null && (
                  <Chip label={`(${count})`} size="small" />
              )}
              <OpenInNewIcon />
          </Link>
      );
  }

  export default ReverseReferenceLink;
  ```

- [ ] **Step 2: Rewrite `ReverseReference.tsx` to delegate to `ReverseReferenceLink`**

  Replace the full contents of `src/partials/ReverseReference.tsx` with:

  ```tsx
  import { Box } from '@mui/material';
  import { TBaseResourceProps } from '../types/baseTypes';
  import ReverseReferenceLink from './ReverseReferenceLink';

  type TReverseReference = {
      target: string;
      property: string;
  };

  type TReverseReferenceProps = TBaseResourceProps & {
      reverseReferences: TReverseReference[];
  };

  function ReverseReference({ id, reverseReferences, resourceType }: TReverseReferenceProps) {
      let resolvedId = id;
      if (resourceType === 'Patient') {
          resolvedId = `Patient/${id}`;
      }
      if (resourceType === 'Person') {
          resolvedId = `Patient/person.${id}`;
      }

      return reverseReferences && reverseReferences.length > 0 && reverseReferences[0] ? (
          <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {reverseReferences.map((reference: TReverseReference, index: number) =>
                      reference ? (
                          <ReverseReferenceLink
                              key={`${index}`}
                              target={reference.target}
                              property={reference.property}
                              resolvedId={String(resolvedId)}
                          />
                      ) : null
                  )}
              </Box>
          </Box>
      ) : null;
  }

  export default ReverseReference;
  ```

- [ ] **Step 3: Verify**

  Run: `yarn lint && yarn tsc --noEmit`
  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/partials/ReverseReferenceLink.tsx src/partials/ReverseReference.tsx
  git commit -m "feat: show entry-count badge on Related Resources links"
  ```

---

### Task 6: Manual end-to-end verification

**Files:** None.

**Interfaces:** None — this task only exercises Tasks 2-5 through the running app.

- [ ] **Step 1: Start the app**

  Run: `yarn dev`, log in against the `dev` environment.

- [ ] **Step 2: Verify the count badge on a "Related Resources" link**

  Open a `Patient` resource, expand its card, and watch the "Related Resources" section.
  Confirm: the links (`Account`, `Observation`, `Encounter`, etc.) render immediately
  with no count, a small spinner appears briefly next to each, and each is replaced by a
  `(N)` chip once resolved — including `(0)` for resource types the patient has none of.
  Confirm the page did not visibly wait for these before becoming interactive.

- [ ] **Step 3: Verify the count matches reality**

  Click through one `(N)` link (opens `/4_0_0/<Target>?<property>=<id>` in a new tab) and
  confirm the number of rows shown there matches the `N` in the badge you just saw.

- [ ] **Step 4: Verify the check/cross indicator on a direct `Reference` link**

  Find a `Patient` with a `generalPractitioner` or `managingOrganization` set, expand its
  card, and confirm that field shows a green check. If you can construct/edit a resource
  with a `Reference` pointing at a deleted or non-existent ID, confirm it shows a red
  cross instead.

- [ ] **Step 5: Verify the AuditEvent link's count and its click-through list still agree**

  `AuditEvent` is the one reverse reference with extra `date` bounds. Confirm its count
  badge and its click-through list (both scoped to the same rolling 7-day window) show
  matching numbers.

- [ ] **Step 6: Commit**

  Nothing to commit — if any step above failed, return to the relevant task, fix, and
  re-verify before considering the plan complete.
