# Connections Other-Logins Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Test Connections" entry point to Patient/Person resource cards, usable by staff
logged in via `clientcredentials`/`okta`, that opens the existing Connections console pre-scoped
to that specific person's connections instead of the logged-in caller's own.

**Architecture:** A `personId` search param drives a mode switch on `ConnectionConsolePage.tsx`.
The list-fetch (`useConnections`) and token-fetch (`ConnectionRequestConsole`) both gain an
optional person-scoped code path, backed by two new `TokenServiceApi` methods calling the two new
backend endpoints from the companion `aperture_token_service` plan. A new `ConnectionConsoleContent`
component owns the `useConnections(personId)` call and is rendered with `key={personId ?? 'self'}`
so switching modes (or between two different people) fully unmounts/remounts every piece of
state below it — the same full-remount pattern already used for connection switches within one
mode, rather than trying to patch every individual `useState` reset by hand.

**Tech Stack:** React 19, TypeScript, MUI v9, react-router v8.

## Global Constraints

- **Hard backend dependency.** `TokenServiceApi.listConnectionsForPerson`/
  `getConnectionTokenForPerson` call `GET /get-client-person-connections/` and
  `GET /get-client-person-connection-token/{serviceSlug}/`, specified in
  `aperture_token_service/docs/superpowers/plans/2026-08-09-person-connection-endpoints.md`.
  Tasks 1-3 below (API client, hook, component wiring) do not require those endpoints to exist —
  they're pure code changes verified by `yarn lint`/`yarn tsc --noEmit` and code inspection. **Any
  manual verification step that calls a real backend cannot pass until that companion plan ships
  to at least the dev environment** — those steps are marked "blocked until backend ships" below;
  do not treat a failure of one of those specific steps as a defect in this plan's own code before
  confirming the backend endpoint actually exists and is reachable.
- **Gate zero — the identifier assumption is unverified.** This whole feature assumes a
  Patient/Person resource's `uuid` (per `ResourceCard.tsx`'s existing `tagUUID ?? resource.id`
  computation, not the raw FHIR `id`) equals ATS's `client_fhir_person_id`. Task 1 below is a
  verification-only task with no code changes — it must be completed (or explicitly overridden by
  a human decision, logged in the task's own notes) before Task 4 (the only task that hard-codes
  this identifier into UI code) is started.
- **No automated test framework in this repo.** Verification throughout is `yarn lint &&
  yarn tsc --noEmit` (0 errors; baseline is 6 pre-existing warnings — that count must not
  increase) plus manual/live-browser checks per task.
- **No change to the existing "my own connections" flow's behavior when `personId` is absent.**
  Every existing manual-verification item from the single-page-merge plan
  (`docs/superpowers/plans/2026-08-09-connections-single-page.md`) must still pass unchanged.
- **The three safeguards from the design are not optional polish — they are the mechanism that
  prevents the two trust boundaries (own connections vs. an arbitrary person's) from blurring
  into each other.** Do not simplify away the `key`-based remount, the mode banner, or the
  client-side identity guard.

---

### Task 1: Verify the identifier assumption (gate zero — no code changes)

**Files:** none — this task produces a decision, not a diff.

**Interfaces:** none produced; Task 4 consumes this task's outcome (proceed as designed, or stop
and revisit the design) but not any code artifact.

- [ ] **Step 1: Find a real Patient or Person resource's `uuid`**

Using this app's own `/api-console` (or `curl` directly against the dev FHIR server with a valid
session token), fetch a real `Patient` or `Person` resource that you know has at least one ATS
connection (ask a teammate which test member/patient has one, if you don't already know). Compute
its `uuid` the same way `ResourceCard.tsx` does: the `code` of the `meta.tag` entry whose `system`
is `https://www.icanbwell.com/uuid` (`IdentifierSystem.uuid` in `src/utils/identifierSystem.ts`),
falling back to the resource's own `id` if no such tag exists.

- [ ] **Step 2: Compare it against a real ATS connection document's `client_fhir_person_id`**

Once the companion `aperture_token_service` endpoint (`GET /get-client-person-connections/`) is deployed
to dev, call it with the `uuid` from Step 1 as `client_fhir_person_id`:

```bash
curl -G "https://aperture-token-service.dev-ue1.icanbwell.com/api/v1.0/get-client-person-connections/" \
  --data-urlencode "client_fhir_person_id=<uuid from Step 1>" \
  -H "Authorization: Bearer <a real clientcredentials service token>"
```

(If the backend isn't deployed yet, ask whoever has direct Mongo access to the `token-service`
database to check whether a document with `client_fhir_person_id` equal to that `uuid` exists,
instead of waiting.)

- [ ] **Step 3: Record the outcome**

If a real connection comes back: the assumption holds — proceed to Task 4 as designed. If it
comes back empty but you're confident that Patient/Person genuinely has a connection: the
assumption is wrong. **Stop and escalate to a human decision** — do not guess a fix (e.g.
silently trying `bwell_fhir_person_id` instead) without confirming which field is actually
correct; that decision belongs in a design revision, not an implementer's guess mid-task.
Whichever outcome, write one sentence recording it (e.g. as a commit message on an empty commit,
or a note in this plan file) so Task 4's implementer doesn't have to re-derive it.

---

### Task 2: `TokenServiceApi` new methods

**Files:**
- Modify: `src/api/tokenServiceApi.ts`

**Interfaces:**
- Consumes: `ConnectionEntry`, `ConnectionToken` from `src/types/connectionEntry.ts` (both
  unchanged — the new backend endpoints return the identical shapes).
- Produces: `TokenServiceApi.listConnectionsForPerson({ clientPersonId: string }):
  Promise<{ status: number | undefined; connections: ConnectionEntry[] }>` and
  `TokenServiceApi.getConnectionTokenForPerson({ serviceSlug: string; clientPersonId: string }):
  Promise<{ status: number | undefined; connectionToken: ConnectionToken | null }>`. Task 3
  (`useConnections`, `ConnectionRequestConsole`) calls both by these exact names.

- [ ] **Step 1: Add the two new methods**

In `src/api/tokenServiceApi.ts`, add both methods to the `TokenServiceApi` class, immediately
after the existing `getConnectionToken` method:

```ts
    async listConnectionsForPerson({ clientPersonId }: { clientPersonId: string }): Promise<{
        status: number | undefined;
        connections: ConnectionEntry[];
    }> {
        const { status, json } = await this.getData({
            urlString: `/get-client-person-connections/?client_fhir_person_id=${encodeURIComponent(clientPersonId)}`,
        });
        const rawConnections: RawConnectionEntry[] = Array.isArray(json) ? json : [];
        return {
            status,
            connections: rawConnections.map((raw) => ({
                service_slug: raw.value,
                display_name: raw.display,
                category: raw.category,
                status: raw.status,
                expired: raw.expired,
                is_direct: raw.is_direct,
                number_of_resources: raw.number_of_resources,
            })),
        };
    }

    async getConnectionTokenForPerson({ serviceSlug, clientPersonId }: {
        serviceSlug: string;
        clientPersonId: string;
    }): Promise<{
        status: number | undefined;
        connectionToken: ConnectionToken | null;
    }> {
        // Same trailing-slash-before-query-string requirement as getConnectionToken — see that
        // method's comment.
        const { status, json } = await this.getData({
            urlString: `/get-client-person-connection-token/${encodeURIComponent(serviceSlug)}/?client_fhir_person_id=${encodeURIComponent(clientPersonId)}`,
        });
        return { status, connectionToken: status === 200 ? json : null };
    }
```

- [ ] **Step 2: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings beyond the existing 6-warning baseline.

- [ ] **Step 3: Commit**

```bash
git add src/api/tokenServiceApi.ts
git commit -m "Add TokenServiceApi methods for person-parameterized connection lookups"
```

---

### Task 3: Mode-aware `useConnections` and `ConnectionRequestConsole`, plus the new
`ConnectionConsoleContent` container

**Files:**
- Modify: `src/hooks/useConnections.ts`
- Modify: `src/components/ConnectionRequestConsole.tsx`
- Modify: `src/components/ConnectionPicker.tsx`
- Create: `src/components/ConnectionConsoleContent.tsx`
- Modify: `src/pages/ConnectionConsolePage.tsx` (full rewrite)

**Interfaces:**
- Consumes: `TokenServiceApi.listConnectionsForPerson`/`getConnectionTokenForPerson` (Task 2).
- Produces: `useConnections(personId?: string): UseConnectionsResult` (same shape as today, one
  new optional parameter); `ConnectionRequestConsole`'s props gain `personId?: string`;
  `ConnectionPicker`'s props gain `hideLoginBanner?: boolean` (default `false`);
  `ConnectionConsoleContent` (default export), props `{ serviceSlug: string | undefined;
  personId?: string; onSelect: (slug: string | null) => void }`. Nothing beyond this task
  consumes `ConnectionConsoleContent` directly except `ConnectionConsolePage.tsx` itself, rewritten
  in this same task.

- [ ] **Step 1: Add the optional `personId` parameter to `useConnections`**

Replace the full contents of `src/hooks/useConnections.ts` with:

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
    hasLoaded: boolean;
    reload: () => void;
}

const useConnections = (personId?: string): UseConnectionsResult => {
    const { setUserDetails } = useContext(UserContext);
    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;

    const [connections, setConnections] = useState<ConnectionEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);
    const [hasLoaded, setHasLoaded] = useState<boolean>(false);

    const loadConnections = async () => {
        if (!tokenServiceUrl) {
            return;
        }
        setLoading(true);
        setError(null);
        setForbidden(false);
        try {
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const { status, connections: loaded } = personId
                ? await api.listConnectionsForPerson({ clientPersonId: personId })
                : await api.listConnections();
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
            setHasLoaded(true);
        }
    };

    useEffect(() => {
        loadConnections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenServiceUrl, personId]);

    return {
        connections,
        loading,
        error,
        forbidden,
        configMissing: !tokenServiceUrl,
        hasLoaded,
        reload: loadConnections,
    };
};

export default useConnections;
```

(This hook is always called from `ConnectionConsoleContent`, below, which is remounted whenever
`personId` changes — so `connections`/`error`/`forbidden`/`hasLoaded` never need to be manually
reset when `personId` changes; the `useEffect`'s `personId` dependency here only matters for the
case where `ConnectionConsoleContent` itself doesn't remount, which shouldn't happen given Step 4
below, but costs nothing to keep correct in isolation.)

- [ ] **Step 2: Add the optional `personId` prop to `ConnectionRequestConsole`**

In `src/components/ConnectionRequestConsole.tsx`:

Change the props interface:

```ts
interface ConnectionRequestConsoleProps {
    connection: ConnectionEntry;
    personId?: string;
}

const ConnectionRequestConsole = ({ connection, personId }: ConnectionRequestConsoleProps) => {
```

Change `fetchToken`'s body (the `try` block's first line) from:

```ts
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const { status, connectionToken: token } = await api.getConnectionToken({
                serviceSlug: connection.service_slug,
            });
```

to:

```ts
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const { status, connectionToken: token } = personId
                ? await api.getConnectionTokenForPerson({
                      serviceSlug: connection.service_slug,
                      clientPersonId: personId,
                  })
                : await api.getConnectionToken({ serviceSlug: connection.service_slug });
```

And add `personId` to `fetchToken`'s `useCallback` dependency array (currently
`[tokenServiceUrl, connection.service_slug, setUserDetails]` — add `personId` to it).

- [ ] **Step 3: Add `hideLoginBanner` to `ConnectionPicker`**

In `src/components/ConnectionPicker.tsx`, change the props interface:

```ts
interface ConnectionPickerProps {
    connections: ConnectionEntry[];
    loading: boolean;
    forbidden: boolean;
    selectedSlug: string | undefined;
    onSelect: (slug: string | null) => void;
    hideLoginBanner?: boolean;
}

const ConnectionPicker = ({
    connections,
    loading,
    forbidden,
    selectedSlug,
    onSelect,
    hideLoginBanner = false,
}: ConnectionPickerProps) => {
```

And change the existing banner condition from:

```tsx
            {!isBwellAppLogin && (
```

to:

```tsx
            {!hideLoginBanner && !isBwellAppLogin && (
```

(The "sign in with b.well App login" banner is misleading in on-behalf-of mode, where a
`clientcredentials`/`okta` session is exactly what's expected — `ConnectionConsoleContent`,
below, passes `hideLoginBanner={!!personId}`.)

- [ ] **Step 4: Create `ConnectionConsoleContent.tsx`**

Create `src/components/ConnectionConsoleContent.tsx`:

```tsx
import { useMemo } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import ConnectionPicker from './ConnectionPicker';
import ConnectionRequestConsole from './ConnectionRequestConsole';
import useConnections from '../hooks/useConnections';

interface ConnectionConsoleContentProps {
    serviceSlug: string | undefined;
    personId?: string;
    onSelect: (slug: string | null) => void;
}

const ConnectionConsoleContent = ({ serviceSlug, personId, onSelect }: ConnectionConsoleContentProps) => {
    const { connections, loading, error, forbidden, hasLoaded, reload } = useConnections(personId);

    const connection = useMemo(
        () => connections.find((c) => c.service_slug === serviceSlug) ?? null,
        [connections, serviceSlug]
    );
    const notFound = hasLoaded && !error && !forbidden && !!serviceSlug && !connection;

    return (
        <>
            {personId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Testing connections for Person {personId} (service session)
                </Alert>
            )}

            <ConnectionPicker
                connections={connections}
                loading={loading}
                forbidden={forbidden}
                selectedSlug={serviceSlug}
                onSelect={onSelect}
                hideLoginBanner={!!personId}
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
                <ConnectionRequestConsole connection={connection} personId={personId} key={connection.service_slug} />
            )}
        </>
    );
};

export default ConnectionConsoleContent;
```

- [ ] **Step 5: Rewrite `ConnectionConsolePage.tsx`**

Replace the full contents of `src/pages/ConnectionConsolePage.tsx` with:

```tsx
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Box, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConnectionConsoleContent from '../components/ConnectionConsoleContent';
import { getLocalData } from '../utils/localData.utils';

const ConnectionConsolePage = () => {
    const { serviceSlug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const personId = searchParams.get('personId') ?? undefined;
    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;
    const identityProvider = getLocalData('identityProvider');
    const canUseOnBehalfOf = identityProvider === 'clientcredentials' || identityProvider === 'okta';

    const handleSelect = (slug: string | null) => {
        const suffix = personId ? `?personId=${encodeURIComponent(personId)}` : '';
        navigate(slug ? `/connections/${encodeURIComponent(slug)}${suffix}` : `/connections${suffix}`);
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {!tokenServiceUrl ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : personId && !canUseOnBehalfOf ? (
                        <Typography color="error">
                            This view requires a service-authenticated login.
                        </Typography>
                    ) : (
                        <ConnectionConsoleContent
                            key={personId ?? 'self'}
                            serviceSlug={serviceSlug}
                            personId={personId}
                            onSelect={handleSelect}
                        />
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionConsolePage;
```

- [ ] **Step 6: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 7: Manually verify the existing "my own connections" flow is unchanged**

Run: `yarn dev`. Repeat the manual-verification checklist from
`docs/superpowers/plans/2026-08-09-connections-single-page.md`'s Task 4 Step 6 (direct nav to a
valid/bogus slug, bare `/connections`, picker selection, category grouping, banners) — none of
this should have changed, since `personId` is absent in all of those checks and every branch
above collapses back to the pre-existing behavior when it is.

- [ ] **Step 8: Manually verify the mode switch itself (no backend needed for this part)**

- Visit `/connections?personId=test-person-1` while logged in via a non-`clientcredentials`/
  `okta` provider (e.g. whatever you're using for the checks above). Confirm "This view requires
  a service-authenticated login." renders and no network call to
  `/get-client-person-connections/` is made (check the browser's network inspector) — the guard must
  fire before any API attempt.
- Log in via `clientcredentials` (see this repo's `ClientCredentialsLogin.tsx` page/flow) and
  revisit the same URL. Confirm the "Testing connections for Person test-person-1 (service
  session)" banner renders, the "sign in with b.well App login" banner does NOT render (that's
  `hideLoginBanner` in effect), and the picker attempts to load (its actual result is blocked
  until the backend ships — see the Global Constraints note).
- Remove `personId` from the URL (or click the picker's clear button, which navigates back to a
  bare `/connections` per `handleSelect`'s existing behavior). Confirm the mode banner disappears
  and the "sign in with b.well App login" banner reappears if applicable.

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useConnections.ts src/components/ConnectionRequestConsole.tsx src/components/ConnectionPicker.tsx src/components/ConnectionConsoleContent.tsx src/pages/ConnectionConsolePage.tsx
git commit -m "Add personId mode switch to the Connections console"
```

---

### Task 4: "Test Connections" entry point on `ResourceCard.tsx`

**Files:**
- Modify: `src/components/ResourceCard.tsx`

**Interfaces:**
- Consumes: `getLocalData` from `src/utils/localData.utils.ts` (existing); the `uuid` value
  already computed at `ResourceCard.tsx`'s render body (`const uuid = tagUUID ? tagUUID :
  resource.id;`) — this task passes that exact value as `personId`, per Task 1's gate-zero
  verification. **Do not start this task until Task 1 is complete.**
- Produces: nothing consumed by a later task — this is the last task in this plan.

- [ ] **Step 1: Add the "Test Connections" link**

In `src/components/ResourceCard.tsx`, add a new link function immediately after the existing
`getCompositionSummaryLink` function:

```tsx
const getTestConnectionsLink = ({ personId }: { personId: string }) => {
    return (
        <Tooltip title="Test this person's FHIR connections">
            <Link
                to={`/connections?personId=${encodeURIComponent(personId)}`}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                    color: 'inherit',
                }}
            >
                <DescriptionIcon color="primary" fontSize="small" />
                <Typography variant="body2" color="primary">
                    Test Connections
                </Typography>
            </Link>
        </Tooltip>
    );
};
```

(No `target="_blank"`/`OpenInNewIcon` — unlike the IPS/Composition links, this stays in the same
tab, since it's meant to be an interactive testing session, not a reference document to pop out.)

- [ ] **Step 2: Render it conditionally in the card header**

In the same file, find the existing card-header action block:

```tsx
                        {resource.resourceType &&
                            summaryResourceTypes.includes(resource.resourceType.toString()) &&
                            getIPSLink({ resource, uuid: uuid?.toString() })}
                        {resource.resourceType &&
                            compositionSummaryResourceTypes.includes(resource.resourceType.toString()) &&
                            getCompositionSummaryLink({ uuid: uuid?.toString() })}
```

Add, immediately after the `getCompositionSummaryLink` block above:

```tsx
                        {resource.resourceType &&
                            summaryResourceTypes.includes(resource.resourceType.toString()) &&
                            uuid &&
                            (getLocalData('identityProvider') === 'clientcredentials' ||
                                getLocalData('identityProvider') === 'okta') &&
                            getTestConnectionsLink({ personId: uuid.toString() })}
```

Add the import at the top of the file, alongside the other imports:

```ts
import { getLocalData } from '../utils/localData.utils';
```

- [ ] **Step 3: Run lint/typecheck**

Run: `yarn lint && yarn tsc --noEmit`
Expected: 0 errors, no new warnings.

- [ ] **Step 4: Manually verify the link's visibility**

Run: `yarn dev`. Browse to a page listing/showing Patient or Person resources (e.g. a search
result list rendered via `ResourceList.tsx`/`ResourceCard.tsx`).
- While logged in via `bwellapp` or `cognito`: confirm no "Test Connections" link appears on any
  Patient/Person card.
- While logged in via `clientcredentials` (or `okta`, if that login is available to you): confirm
  the "Test Connections" link appears on Patient/Person cards, and does NOT appear on cards for
  any other resource type (e.g. `Observation`, `Condition`).
- Click it. Confirm it navigates to `/connections?personId=<that resource's uuid>` in the same
  tab, and that the value in the URL matches the `uuid` `ResourceCard.tsx` itself displays in that
  card's title (`(${index + 1}) ${resource.resourceType}/${uuid}`) — not a different value.

- [ ] **Step 5: Commit**

```bash
git add src/components/ResourceCard.tsx
git commit -m "Add Test Connections entry point to Patient/Person resource cards"
```
