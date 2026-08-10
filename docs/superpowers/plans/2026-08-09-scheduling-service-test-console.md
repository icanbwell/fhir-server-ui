# Scheduling Service Test Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff exercise `scheduling-service`'s IHE ITI scheduling API (`Location/$find`,
`Appointment/$find`, `$hold`, `$book`) for a specific Person from a link on that Person's
resource card, watching each step's literal request/response.

**Architecture:** A new `/scheduling-console?personId=` page reuses `FhirRequestConsole`
(from PR #220) four times — one embedded console per IHE step — inside MUI tabs, seeded from a
static destination config and a new pure template module. A new `SchedulingApi` (mirrors
`FhirApi`/`TokenServiceApi`, extends `BaseApi`) talks to a new `REACT_APP_SCHEDULING_SERVICE_URL`.
Entry point is a `getTestSchedulingLink` helper added to `ResourceCard.tsx`, next to PR #225's
`getTestConnectionsLink`.

**Tech Stack:** React 19, TypeScript, MUI v9, react-router v8, Vite. No test framework exists in
this repo — verification is `yarn lint` + `yarn tsc --noEmit` + manual browser checks, matching
every prior PR in this codebase (confirmed zero `*.test.ts*` files in `src/`).

## Global Constraints

- Follow this repo's existing file conventions exactly — do not introduce a test framework, a
  new state-management library, or any new UI kit; MUI + plain `useState`/hooks only.
- No automatic chaining of data between the four IHE step consoles — each is independently
  seeded and sent; the user copies references between them by hand (see design doc's Non-goals).
- Per the approved design (`docs/superpowers/specs/2026-08-09-scheduling-service-test-console-design.md`):
  the entry-point link is **not** gated by `canUseServiceAuth` — scheduling-service uses this
  app's own session bearer token like every other FHIR-server call, no special login-type
  restriction.
- Reference every file/line below against the actual current repo state before editing — this
  plan was written against commit `7458b63` (PR #220 + PR #225 merged in); if the worktree has
  moved further, re-check line numbers, don't blindly patch by line number.

---

## File Structure

| File | Responsibility |
|---|---|
| `.env.example` (modify) | Document the new `REACT_APP_SCHEDULING_SERVICE_URL` var |
| `src/api/schedulingApi.ts` (create) | `SchedulingApi extends BaseApi` — generic base-URL + session-token client, `sendRequest()` matching `FhirRequestConsole`'s `SendRequestParams` contract |
| `src/constants/schedulingDestinations.ts` (create) | Static list of known scheduling destinations and their (per-environment) Organization reference |
| `src/utils/schedulingRequestTemplates.ts` (create) | Pure functions building the four IHE step request bodies from a destination + personId — no React, easy to reason about/adjust independent of the UI |
| `src/components/SchedulingConsoleContent.tsx` (create) | Destination picker + four `FhirRequestConsole` tabs, template seeding/dirty-tracking |
| `src/pages/SchedulingConsolePage.tsx` (create) | Route-level shell: reads `personId` from search params, `Header`/`Footer`, renders `SchedulingConsoleContent` keyed by `personId` |
| `src/routes/fhirRoutes.tsx` (modify) | Register `/scheduling-console` route |
| `src/components/ResourceCard.tsx` (modify) | Add `getTestSchedulingLink` entry point on Person cards |

---

### Task 1: `SchedulingApi` client + env var

**Files:**
- Create: `src/api/schedulingApi.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `SchedulingApi` class with `sendRequest(params: { method: HttpMethod; urlPath: string; data?: object; headers?: Record<string, string>; onChunk?: (text: string) => void; onHeaders?: (status: number, headers: Record<string, string>) => void; signal?: AbortSignal }): Promise<{ status: number | undefined; json: any; headers: Record<string, string>; rawText: string; incomplete?: boolean }>` — this exact shape matches `FhirRequestConsole`'s exported `SendRequestParams`/return contract (`src/components/FhirRequestConsole.tsx:22-30`) so it can be passed straight into that component's `sendRequest` prop.
- Consumes: `BaseApi` (`src/api/baseApi.ts`) — constructor `{ fhirUrl, setUserDetails, onRequest? }`, protected `streamRequest()`.

- [ ] **Step 1: Add the env var to `.env.example`**

Open `.env.example` and add this line directly after the existing
`REACT_APP_TOKEN_SERVICE_URL` line (currently the line starting
`# Aperture Token Service (ATS) base URL...`):

```
# Scheduling Service base URL, used by the /scheduling-console screen.
REACT_APP_SCHEDULING_SERVICE_URL='https://your-scheduling-service.example.com'
```

- [ ] **Step 2: Create `SchedulingApi`**

Create `src/api/schedulingApi.ts`:

```ts
import BaseApi from './baseApi';
import { HttpMethod } from '../context/LastRequestContext';

// Mirrors FhirApi.sendRequest (src/api/fhirApi.ts) exactly — same generic
// BaseApi-derived client shape as FhirApi/TokenServiceApi, just pointed at
// scheduling-service's base URL instead. Uses BaseApi's default
// handleUnauthorized (log out on 401): scheduling-service is called with this
// app's own session bearer token, so a 401 from it means this app's own
// session is invalid, same as a 401 from the FHIR server.
class SchedulingApi extends BaseApi {
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
            json = result.text
                ? JSON.parse(result.text)
                : result.errorMessage
                    ? { error: result.errorMessage }
                    : undefined;
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
}

export default SchedulingApi;
```

- [ ] **Step 3: Verify it compiles**

Run: `yarn tsc --noEmit`
Expected: no new errors introduced by `src/api/schedulingApi.ts`.

- [ ] **Step 4: Commit**

```bash
git add .env.example src/api/schedulingApi.ts
git commit -m "Add SchedulingApi client and REACT_APP_SCHEDULING_SERVICE_URL"
```

---

### Task 2: Scheduling destinations config

**Files:**
- Create: `src/constants/schedulingDestinations.ts`

**Interfaces:**
- Produces: `interface SchedulingDestination { slug: string; label: string; organizationReference: string }` and `export const SCHEDULING_DESTINATIONS: SchedulingDestination[]` — consumed by Task 3 (templates) and Task 4 (picker UI).

- [ ] **Step 1: Create the config file**

Create `src/constants/schedulingDestinations.ts`:

```ts
export interface SchedulingDestination {
    slug: string;
    label: string;
    // FHIR Organization reference (e.g. "Organization/abc123") that scheduling-service
    // resolves server-side to pick the vendor for $find/$hold/$book. This ID is specific to
    // whichever FHIR server this app's REACT_APP_FHIR_SERVER_URL points at — left blank here
    // deliberately; whoever deploys this app to an environment fills these in for that
    // environment's real Organization resources before this console is usable there. See
    // "Destinations" in docs/superpowers/specs/2026-08-09-scheduling-service-test-console-design.md.
    organizationReference: string;
}

export const SCHEDULING_DESTINATIONS: SchedulingDestination[] = [
    { slug: 'medstar-idx', label: 'MedStar — Primary Care (IDX)', organizationReference: '' },
    { slug: 'medstar-solv', label: 'MedStar — Urgent Care / E-Visit (Solv)', organizationReference: '' },
    { slug: 'thedacare-epic-open', label: 'Thedacare — Epic Open Scheduling', organizationReference: '' },
    { slug: 'walgreens-vaccine', label: 'Walgreens — Vaccine Scheduling', organizationReference: '' },
];
```

- [ ] **Step 2: Verify it compiles**

Run: `yarn tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/constants/schedulingDestinations.ts
git commit -m "Add static scheduling destinations config"
```

---

### Task 3: IHE request body templates

**Files:**
- Create: `src/utils/schedulingRequestTemplates.ts`

**Interfaces:**
- Consumes: `SchedulingDestination` (Task 2).
- Produces:
  - `export type SchedulingStepKey = 'find-location' | 'find-appointment' | 'hold-appointment' | 'book-appointment'`
  - `export const SCHEDULING_STEPS: { key: SchedulingStepKey; label: string; method: 'POST'; urlPath: string }[]`
  - `export function buildSchedulingRequestTemplate(step: SchedulingStepKey, destination: SchedulingDestination, personId: string): string` — returns a pretty-printed JSON string (matches `FhirRequestConsole`'s `resourceJson` prop, which is a plain string, not an object).

- [ ] **Step 1: Create the templates file**

Create `src/utils/schedulingRequestTemplates.ts`:

```ts
import { SchedulingDestination } from '../constants/schedulingDestinations';

export type SchedulingStepKey =
    | 'find-location'
    | 'find-appointment'
    | 'hold-appointment'
    | 'book-appointment';

export const SCHEDULING_STEPS: {
    key: SchedulingStepKey;
    label: string;
    method: 'POST';
    urlPath: string;
}[] = [
    { key: 'find-location', label: 'Find Locations', method: 'POST', urlPath: '/IHE/Location/$find' },
    { key: 'find-appointment', label: 'Find Appointments (ITI-115)', method: 'POST', urlPath: '/IHE/Appointment/$find' },
    { key: 'hold-appointment', label: 'Hold Appointment (ITI-116)', method: 'POST', urlPath: '/IHE/Appointment/$hold' },
    { key: 'book-appointment', label: 'Book Appointment (ITI-117)', method: 'POST', urlPath: '/IHE/Appointment/$book' },
];

// The `patient.reference` value below reuses this app's existing "Patient/person.<uuid>"
// convention (see getIPSLink in src/components/ResourceCard.tsx) rather than resolving the
// Person's linked Patient separately.
//
// Field names in each Parameters resource are a starting point based on the IHE PCC
// Scheduling profile's usual shape (organization/location/patient/appointment parts) — verify
// the exact parameter names scheduling-service expects against its
// ihe_scheduling/routes.py request schema before relying on these in a real environment (see
// design doc's Open Questions).
export const buildSchedulingRequestTemplate = (
    step: SchedulingStepKey,
    destination: SchedulingDestination,
    personId: string
): string => {
    const patientReference = `Patient/person.${personId}`;

    switch (step) {
        case 'find-location':
            return JSON.stringify(
                {
                    resourceType: 'Parameters',
                    parameter: [
                        { name: 'organization', valueReference: { reference: destination.organizationReference } },
                    ],
                },
                null,
                2
            );
        case 'find-appointment':
            return JSON.stringify(
                {
                    resourceType: 'Parameters',
                    parameter: [
                        { name: 'organization', valueReference: { reference: destination.organizationReference } },
                        { name: 'patient', valueReference: { reference: patientReference } },
                        { name: 'start', valueDateTime: '' },
                        { name: 'end', valueDateTime: '' },
                    ],
                },
                null,
                2
            );
        case 'hold-appointment':
            return JSON.stringify(
                {
                    resourceType: 'Appointment',
                    status: 'proposed',
                    // Paste the `Appointment` (or its reference) returned by the
                    // "Find Appointments" step's response here.
                    participant: [{ actor: { reference: patientReference }, status: 'accepted' }],
                },
                null,
                2
            );
        case 'book-appointment':
            return JSON.stringify(
                {
                    resourceType: 'Appointment',
                    status: 'booked',
                    // Paste the held `Appointment` (or its reference) returned by the
                    // "Hold Appointment" step's response here.
                    participant: [{ actor: { reference: patientReference }, status: 'accepted' }],
                },
                null,
                2
            );
    }
};
```

- [ ] **Step 2: Verify it compiles**

Run: `yarn tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/schedulingRequestTemplates.ts
git commit -m "Add IHE scheduling request body templates"
```

---

### Task 4: `SchedulingConsoleContent`

**Files:**
- Create: `src/components/SchedulingConsoleContent.tsx`

**Interfaces:**
- Consumes:
  - `SCHEDULING_DESTINATIONS` (Task 2), `SCHEDULING_STEPS`/`buildSchedulingRequestTemplate` (Task 3), `SchedulingApi` (Task 1).
  - `FhirRequestConsole`, `SendRequestParams` (`src/components/FhirRequestConsole.tsx`) — unmodified.
  - `UserContext` (`src/context/UserContext.tsx`) for `setUserDetails`, same as `ConnectionConsoleContent`.
- Produces: `SchedulingConsoleContent({ personId }: { personId: string })` default export, consumed by Task 5.

- [ ] **Step 1: Create the component**

Create `src/components/SchedulingConsoleContent.tsx`:

```tsx
import { useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Tab, Tabs, Typography } from '@mui/material';
import FhirRequestConsole, { SendRequestParams } from './FhirRequestConsole';
import SchedulingApi from '../api/schedulingApi';
import UserContext from '../context/UserContext';
import { SCHEDULING_DESTINATIONS } from '../constants/schedulingDestinations';
import {
    SCHEDULING_STEPS,
    SchedulingStepKey,
    buildSchedulingRequestTemplate,
} from '../utils/schedulingRequestTemplates';
import { HttpMethod } from '../context/LastRequestContext';

interface SchedulingConsoleContentProps {
    personId: string;
}

type StepState = { method: HttpMethod; resourceJson: string };

const buildInitialStepState = (destinationSlug: string, personId: string): Record<SchedulingStepKey, StepState> => {
    const destination = SCHEDULING_DESTINATIONS.find((d) => d.slug === destinationSlug) ?? SCHEDULING_DESTINATIONS[0];
    const entries = SCHEDULING_STEPS.map((step) => {
        const seeded = buildSchedulingRequestTemplate(step.key, destination, personId);
        return [step.key, { method: step.method as HttpMethod, resourceJson: seeded }] as const;
    });
    return Object.fromEntries(entries) as Record<SchedulingStepKey, StepState>;
};

const SchedulingConsoleContent = ({ personId }: SchedulingConsoleContentProps) => {
    const { setUserDetails } = useContext(UserContext);
    const schedulingServiceUrl = import.meta.env.REACT_APP_SCHEDULING_SERVICE_URL;

    const [destinationSlug, setDestinationSlug] = useState<string>(SCHEDULING_DESTINATIONS[0]?.slug ?? '');
    const [activeStep, setActiveStep] = useState<SchedulingStepKey>(SCHEDULING_STEPS[0].key);
    const [stepState, setStepState] = useState<Record<SchedulingStepKey, StepState>>(() =>
        buildInitialStepState(destinationSlug, personId)
    );

    const destination = useMemo(
        () => SCHEDULING_DESTINATIONS.find((d) => d.slug === destinationSlug) ?? null,
        [destinationSlug]
    );

    const handleDestinationChange = (slug: string) => {
        setDestinationSlug(slug);
        // Re-seeds every step's template for the new destination. Any step whose body was
        // hand-edited away from its last-seeded template loses that edit here — accepted as the
        // simpler v1 behavior (see design doc's Open Questions).
        setStepState(buildInitialStepState(slug, personId));
    };

    const updateStep = (key: SchedulingStepKey, patch: Partial<StepState>) => {
        setStepState((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    };

    const sendRequest = useCallback(
        (params: SendRequestParams) =>
            new SchedulingApi({ fhirUrl: schedulingServiceUrl, setUserDetails }).sendRequest(params),
        [schedulingServiceUrl, setUserDetails]
    );

    if (!schedulingServiceUrl) {
        return (
            <Typography color="error">
                Scheduling Service is not configured (missing REACT_APP_SCHEDULING_SERVICE_URL).
            </Typography>
        );
    }

    return (
        <>
            <Alert severity="info" sx={{ mb: 2 }}>
                Testing scheduling for Person {personId}
            </Alert>

            <FormControl size="small" sx={{ minWidth: 280, mb: 2 }}>
                <InputLabel>Destination</InputLabel>
                <Select
                    value={destinationSlug}
                    label="Destination"
                    onChange={(e) => handleDestinationChange(e.target.value)}
                >
                    {SCHEDULING_DESTINATIONS.map((d) => (
                        <MenuItem key={d.slug} value={d.slug} disabled={!d.organizationReference}>
                            {d.label}
                            {!d.organizationReference ? ' (not configured for this environment)' : ''}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {!destination?.organizationReference && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This destination has no Organization reference configured for this environment
                    yet — requests will fail server-side resolution. See
                    src/constants/schedulingDestinations.ts.
                </Alert>
            )}

            <Tabs value={activeStep} onChange={(_, val) => setActiveStep(val)} sx={{ mb: 2 }}>
                {SCHEDULING_STEPS.map((step) => (
                    <Tab key={step.key} value={step.key} label={step.label} />
                ))}
            </Tabs>

            {SCHEDULING_STEPS.map(
                (step) =>
                    step.key === activeStep && (
                        <Box key={step.key}>
                            <FhirRequestConsole
                                method={stepState[step.key].method}
                                onMethodChange={(method) => updateStep(step.key, { method })}
                                urlSuffix={step.urlPath}
                                onUrlSuffixChange={() => {
                                    /* fixed per step — not editable */
                                }}
                                resourceJson={stepState[step.key].resourceJson}
                                onResourceJsonChange={(resourceJson) => updateStep(step.key, { resourceJson })}
                                requestPathPlaceholder={step.urlPath}
                                baseUrlForDisplay={schedulingServiceUrl}
                                sendRequest={sendRequest}
                                splitPaneHeight="calc(100vh - 380px)"
                            />
                        </Box>
                    )
            )}
        </>
    );
};

export default SchedulingConsoleContent;
```

- [ ] **Step 2: Verify it compiles**

Run: `yarn tsc --noEmit`
Expected: no new errors. If `onUrlSuffixChange` being a required prop causes friction, confirm
against `FhirRequestConsoleProps` in `src/components/FhirRequestConsole.tsx:34-48` — it's
declared required there, so the no-op above satisfies the type; the request path field will
still render as editable text in the UI even though this component ignores edits to it (a
pre-existing `FhirRequestConsole` limitation, not something to fix here — out of scope).

- [ ] **Step 3: Lint**

Run: `yarn lint`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SchedulingConsoleContent.tsx
git commit -m "Add SchedulingConsoleContent with four IHE step tabs"
```

---

### Task 5: `SchedulingConsolePage` + route

**Files:**
- Create: `src/pages/SchedulingConsolePage.tsx`
- Modify: `src/routes/fhirRoutes.tsx`

**Interfaces:**
- Consumes: `SchedulingConsoleContent` (Task 4).
- Produces: route `/scheduling-console` (search param `personId`), consumed by Task 6's link.

- [ ] **Step 1: Create the page**

Create `src/pages/SchedulingConsolePage.tsx`:

```tsx
import { useSearchParams } from 'react-router';
import { Box, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SchedulingConsoleContent from '../components/SchedulingConsoleContent';

const SchedulingConsolePage = () => {
    const [searchParams] = useSearchParams();
    const personId = searchParams.get('personId') || undefined;

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {personId ? (
                        <SchedulingConsoleContent key={personId} personId={personId} />
                    ) : (
                        <Typography color="text.secondary">
                            Open this page from a Person&apos;s resource card (&quot;Test
                            Scheduling&quot; link) to test scheduling for that person.
                        </Typography>
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default SchedulingConsolePage;
```

- [ ] **Step 2: Register the route**

In `src/routes/fhirRoutes.tsx`, add the lazy import after line 14
(`const ConnectionConsolePage = lazy(() => import('../pages/ConnectionConsolePage'));`):

```ts
const SchedulingConsolePage = lazy(() => import('../pages/SchedulingConsolePage'));
```

Then add the route after line 18
(`<Route key="connections" path="/connections/:serviceSlug?" element={<ConnectionConsolePage />} />,`):

```tsx
<Route key="schedulingConsole" path="/scheduling-console" element={<SchedulingConsolePage />} />,
```

- [ ] **Step 3: Verify it compiles**

Run: `yarn tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Manual check**

Run: `yarn dev`, navigate to `http://localhost:5051/scheduling-console` with no `personId` —
confirm the "Open this page from a Person's resource card" message renders (no console, no
crash). Then navigate to `http://localhost:5051/scheduling-console?personId=test-123` — confirm
the destination picker and four tabs render (the "not configured for this environment" warning
is expected until Task 2's blanks are filled in for a real environment).

- [ ] **Step 5: Commit**

```bash
git add src/pages/SchedulingConsolePage.tsx src/routes/fhirRoutes.tsx
git commit -m "Add /scheduling-console route and page"
```

---

### Task 6: Entry point on Person resource cards

**Files:**
- Modify: `src/components/ResourceCard.tsx`

**Interfaces:**
- Consumes: nothing new — reuses this file's existing `uuid` variable (`ResourceCard.tsx:217-218`) and `personOnlyResourceTypes` list (`ResourceCard.tsx:215`).

- [ ] **Step 1: Add the link helper**

In `src/components/ResourceCard.tsx`, add a new helper directly after
`getTestConnectionsLink` (currently ending at line 115):

```tsx
const getTestSchedulingLink = ({ personId }: { personId: string }) => {
    return (
        <Tooltip title="Test scheduling for this person">
            <Link
                to={`/scheduling-console?personId=${encodeURIComponent(personId)}`}
                target="_blank"
                rel="noopener noreferrer"
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
                    Test Scheduling
                </Typography>
                <OpenInNewIcon color="primary" fontSize="small" />
            </Link>
        </Tooltip>
    );
};
```

(Opens in a new tab, unlike `getTestConnectionsLink` which navigates in-place — matching
`getIPSLink`/`getCompositionSummaryLink`'s `target="_blank"` convention instead, since testing
scheduling is a side-task you'd want open alongside the resource browser, not a replacement for
it.)

- [ ] **Step 2: Render it on Person cards**

In the `action` box (`ResourceCard.tsx:227-254`), add this block directly after the existing
`getTestConnectionsLink` block (currently lines 247-252):

```tsx
{resource.resourceType &&
    personOnlyResourceTypes.includes(resource.resourceType.toString()) &&
    uuid &&
    getTestSchedulingLink({ personId: uuid.toString() })}
```

This reuses the existing `personOnlyResourceTypes` gate (`ResourceCard.tsx:215`) already
defined for the Connections link — both features key on the same Person-level identifier, and
neither is gated by `canUseServiceAuth` for this new link (see Global Constraints above).

- [ ] **Step 3: Verify it compiles**

Run: `yarn tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Lint**

Run: `yarn lint`
Expected: 0 errors (matching the existing baseline — PR #225's own test plan noted "6
pre-existing warnings, unchanged baseline"; don't introduce new ones).

- [ ] **Step 5: Manual check**

Run: `yarn dev`, browse to any `Person` resource (e.g. via `/4_0_0/Person/_search`), expand a
card, confirm a "Test Scheduling" link appears next to "Test Connections", and clicking it opens
`/scheduling-console?personId=<that person's uuid>` in a new tab.

- [ ] **Step 6: Commit**

```bash
git add src/components/ResourceCard.tsx
git commit -m "Add Test Scheduling entry point to Person resource cards"
```

---

## Post-implementation (not part of this plan's tasks — deployment-time work)

- Fill in real `organizationReference` values in `src/constants/schedulingDestinations.ts` for
  each environment this app is deployed to, by looking up the real Organization resources on
  that environment's FHIR server.
- Verify the `Parameters`/`Appointment` field names in
  `src/utils/schedulingRequestTemplates.ts` against `scheduling-service`'s actual
  `ihe_scheduling/routes.py` request schema, and correct them if scheduling-service expects
  different parameter names — this plan's templates are a best-effort starting point, not a
  confirmed contract (see Task 3, Step 1's comment).
