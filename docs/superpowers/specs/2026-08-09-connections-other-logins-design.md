# Connections Console: Support Other Logins via Person/Patient Entry Point — Design

## Problem

The Connections feature (`/connections/:serviceSlug?`, shipped in PR #220) only works for a
logged-in member browsing *their own* connections — every endpoint it calls derives identity
solely from the caller's own JWT. It only works with `bwellapp` logins in practice, since that's
the only identity provider whose session represents a real member with real connections.

There's a separate, real need: a staff member investigating a specific patient's data (already
browsing that Patient/Person resource in this app) wants to test that *specific* patient's FHIR
connections, without that patient logging in themselves. This requires looking up an arbitrary
Person's connections by ID — structurally impossible via the existing member-authenticated
endpoints, which can only ever return the caller's own connections, no matter what identity
provider was used to log in.

## Auth model research (resolved by reading `aperture_token_service` directly)

ATS has a separate, service-authenticated guard (`get_service_user`) that *can* look up an
arbitrary member's connections by parameter — but only certain frontend logins can ever produce
a token it accepts, and the details matter enough to spell out precisely (this took real
investigation to get right; an earlier draft of this reasoning was wrong on one point, corrected
below).

**Cognito and Descope: a hard technical wall.** `get_current_user` (used by every interactive
login) validates against `EXTERNAL_JWKS`; `get_service_user` validates against
`COGNITO_JWKS_ISSUER`/`DESCOPE_JWKS_ISSUER`. Verified directly against
`aperture_token_service/.helm/dev-ue1.values.yaml`: `EXTERNAL_JWKS` lists 13 distinct Cognito
user-pool JWKS URLs plus one Descope project JWKS URL; `COGNITO_JWKS_ISSUER` points at pool
`us-east-1_yzpNeeQKj` and `DESCOPE_JWKS_ISSUER` at project `P32s5eYMtGrER1V13L4zywZ7w6Ao` —
**neither appears in the `EXTERNAL_JWKS` list.** These are structurally separate identity systems
(different Cognito user pools, different Descope projects). No configuration change bridges them.
A `cognito`-login or `bwellapp`-login session token can never pass `get_service_user`, in any
environment.

**Okta is different — same issuer, blocked today by a second check.** `OKTA_JWKS_ISSUER`
(service-side, dev-ue1) is `https://icanbwell.okta.com` — the *same* Okta org this app's own
interactive Okta login already authenticates against (`REACT_APP_AUTH_OKTA_WELL_KNOWN_URL`
resolves to that same issuer). So member and service Okta tokens share an issuer, unlike
Cognito/Descope. But `JwtValidator._check_cid` additionally rejects any Okta token whose `cid`
claim isn't in `OKTA_EXPECTED_CIDS` (`dev-ue1.values.yaml`: `0oa11jf6h3ahEp8MT698`) — and this
app's own interactive Okta client id (`REACT_APP_AUTH_OKTA_CLIENT_ID`) is
`0oarf29h6x2DaWCkT697`, a *different* client. Today, an Okta-interactive session from this app
still fails that check. **And Okta service-auth is dev-only regardless** —
`USE_OKTA`/`OKTA_JWKS_ISSUER`/`OKTA_JWKS_URI`/`OKTA_EXPECTED_CIDS` are set only in
`dev-ue1.values.yaml`; `staging-ue1.values.yaml` and `prod-ue1.values.yaml` don't configure Okta
as a service-auth issuer at all.

**Decision (confirmed with the team):** design for both `clientcredentials` and `okta` as
qualifying logins. Making Okta actually work requires two backend/infra changes, tracked as
explicit dependencies of this feature (not application code, but real deployment work):
1. Add this app's Okta client id (`0oarf29h6x2DaWCkT697`) to `OKTA_EXPECTED_CIDS`.
2. Enable `USE_OKTA`/`OKTA_JWKS_ISSUER`/`OKTA_JWKS_URI`/`OKTA_EXPECTED_CIDS` in
   `staging-ue1.values.yaml` and `prod-ue1.values.yaml` (currently dev-only).

Widening `OKTA_EXPECTED_CIDS` to include this app's own interactive client id is a genuine
security-posture decision, not a bug fix: it means *any* staff member who can log into this
internal tool via Okta gains unrestricted, per-member-unchecked, unaudited access to look up any
Person's ATS connections (ATS enforces no per-member authorization on the service side at all —
see "Known gaps," below). This tradeoff is accepted for this design, but is called out explicitly
so it isn't a silent side effect discovered later.

The endpoint that makes an arbitrary-member lookup possible today, `GET
/all-tokens/{ch_service_id}/` (service-authenticated, optional `member_id`/
`bwell_fhir_person_id`/`client_fhir_person_id` query params), returns a materially different,
more internal response shape than the existing member endpoint — a list, keyed `fhir_url` not
`url`, including internal fields like `token_payload` (the connection's own decoded OAuth token —
a real info-disclosure risk if ever forwarded to a UI), a non-tz-aware `expiry`, and no
de-duplication/most-recent sort. **Decision (confirmed with the team): request new,
purpose-built backend endpoints mirroring the existing member endpoints' exact contracts,
parameterized by person id, rather than remapping `/all-tokens/{slug}/`'s raw shape client-side.**
This repeats the two-repo dependency pattern the original Connections feature already had with
PR #1143 — see the companion backend design,
`docs/superpowers/specs/2026-08-09-person-connection-endpoints-design.md` in
`aperture_token_service`.

## Identifier assumption

The Patient/Person resource being viewed in fhir-server-ui carries a FHIR `id` that is
**assumed to be `client_fhir_person_id`** for the purposes of this design (not `bwell_fhir_person_id`
— a materially different identifier ATS also supports). This assumption is unverified against
the actual FHIR data model and is the single biggest correctness risk in this design: if wrong,
lookups will silently return zero connections (a "looks like it works but never finds anything"
failure, not a loud error). Flagged here and in the testing plan; the implementation plan should
allocate a real verification step (checking a live Patient/Person resource against a live
connection's stored `client_fhir_person_id`) as gate zero, before dependent code is written.

## Goal

Add a "Test Connections" entry point to Patient/Person resource cards, visible only to sessions
that can actually use it, which opens the existing Connections console pre-scoped to that
specific person's connections instead of the logged-in caller's own.

## Non-goals

- **No scope/permission differentiation on the new backend endpoints beyond `get_service_user`.**
  ATS has no scope-checking infrastructure today (the `scope` JWT claim is parsed but never
  compared anywhere in the codebase) — building one from scratch is a larger, separate effort.
  The new endpoints inherit ATS's existing "any valid service token from an allow-listed issuer
  may call this" posture. Flagged as a recommended follow-up, not built here.
- **No change to the existing "my own connections" flow's endpoints, guards, or behavior.**
  `TokenServiceApi.listConnections()`/`getConnectionToken()` and the member-authenticated ATS
  endpoints they call are untouched.
- **No automatic detection of whether a resource's `id` is actually a valid
  `client_fhir_person_id`.** If the identifier assumption above is wrong, this ships a feature
  that silently returns empty results for everyone — see "Identifier assumption."
- **No Okta staging/prod enablement or `OKTA_EXPECTED_CIDS` change in this design's own
  implementation plan.** These are infra/Helm changes tracked as external dependencies (like the
  aperture_token_service endpoint itself), not code this plan produces.

## Design

### Frontend entry point (`src/components/ResourceCard.tsx`)

`summaryResourceTypes = ['Patient', 'Person']` (`ResourceCard.tsx:185`) already gates the
existing "IPS" link. A new conditional link, "Test Connections," renders alongside it under the
same `resourceType` check, further gated on `getLocalData('identityProvider')` being
`'cognitocc'`, `'descopecc'` (both reached via this app's "Login with Client Credentials" flow,
`ClientCredentialsLogin.tsx` — the literal string `'clientcredentials'` is never actually stored
as `identityProvider`, only used as the top-level menu option name in `REACT_APP_AUTH_PROVIDERS`),
or `'okta'` — the only providers that can ever produce a token ATS's
`get_service_user` guard accepts (per the auth model research above). For any other identity
provider (including `bwellapp`), the link simply doesn't render — there's no login for which
attempting the lookup could ever succeed, so there's nothing useful to show.

Clicking it navigates to `/connections?personId=${resource.id}` — no `serviceSlug`, since the
point is to browse *that person's* connections from scratch, not jump into one specific
connection.

### Mode switch on `ConnectionConsolePage.tsx`

`personId` is read via `useSearchParams` (a query param, orthogonal to the existing
`:serviceSlug` route param — the two compose independently: `/connections/foo?personId=bar` is a
valid, meaningful URL, meaning "person bar's `foo` connection").

When `personId` is present, every data-fetching call in the subtree switches from the
member-authenticated path to the new person-parameterized path:

- `useConnections()` gains an optional `personId?: string` parameter. Internally, exactly one of
  `tokenServiceApi.listConnections()` (no `personId`) or a new
  `tokenServiceApi.listConnectionsForPerson({ clientPersonId: personId })` (`personId` present)
  is called — never both, and switching between them is a full hook re-run (see the `key`-based
  reset below, not a branch inside one long-lived effect).
- `ConnectionRequestConsole` gains an optional `personId?: string` prop. Its `fetchToken`
  calls exactly one of `tokenServiceApi.getConnectionToken({ serviceSlug })` or a new
  `tokenServiceApi.getConnectionTokenForPerson({ serviceSlug, clientPersonId: personId })`.
  Both return the *same* `ConnectionToken` shape — this is the payoff of requesting a
  purpose-built backend endpoint instead of remapping `/all-tokens/{slug}/`'s shape client-side:
  everything downstream of the token fetch (the info bar, `FhirRequestConsole` composition, the
  read-only connection-header rows) is completely unaware which mode produced the token.

**Safeguard 1 — full state reset on mode change.** The content area below `Header` is rendered
with `key={personId ?? 'self'}`. Changing `personId` (including switching into or out of
on-behalf-of mode entirely) fully unmounts and remounts `ConnectionPicker` and
`ConnectionRequestConsole`, the same pattern already used for connection switches within one
mode. This is a hard guarantee — not a convention someone has to remember to uphold — that no
state from "my own connections" can survive into an on-behalf-of render, or from one person's
on-behalf-of session into another's.

**Safeguard 2 — visible mode indicator.** Whenever `personId` is set, an
`Alert severity="info"` reading `Testing connections for Person ${personId} (service session)`
renders above `ConnectionPicker`, so which mode is active is never ambiguous to whoever's looking
at the screen.

**Safeguard 3 — client-side identity guard, defense in depth.** Before attempting any
on-behalf-of API call, the page checks `getLocalData('identityProvider')` is
`'cognitocc'`/`'descopecc'`/`'okta'`; if not, it renders "This view requires a service-authenticated
login" instead of attempting the call. This is a UX improvement, not the actual security
boundary — a bypassed client-side check (e.g. a crafted URL under a `bwellapp` session) still
hits ATS's own `get_service_user` guard server-side and gets a 401, not real unauthorized data
access. The guard exists so a legitimate mismatch (wrong login for this feature) produces a clear
message instead of a confusing generic network error.

### Data layer (`src/api/tokenServiceApi.ts`)

Two new methods, parallel to the existing pair. Both existing and new methods gain a "when to
use" comment so the choice is discoverable from either side, not just documented once here:

```ts
// Use for the logged-in member's own connections (a member-authenticated session, e.g.
// bwellapp). Use listConnectionsForPerson instead to look up an arbitrary person's
// connections from a service-authenticated session.
async listConnections(): Promise<{
    status: number | undefined;
    connections: ConnectionEntry[];
}>

// Use for the logged-in member's own connection token. Use getConnectionTokenForPerson
// instead to look up an arbitrary person's connection token from a service-authenticated
// session.
async getConnectionToken({ serviceSlug }: { serviceSlug: string }): Promise<{
    status: number | undefined;
    connectionToken: ConnectionToken | null;
}>

// Use from a service-authenticated session (clientcredentials/okta) to look up an
// arbitrary person's connections by client_fhir_person_id — e.g. staff testing a
// specific patient's connections. Use listConnections instead for the logged-in
// member's own connections.
async listConnectionsForPerson({ clientPersonId }: { clientPersonId: string }): Promise<{
    status: number | undefined;
    connections: ConnectionEntry[];
}>
// GET /get-client-person-connections/?client_fhir_person_id={clientPersonId}
// Same response mapping as listConnections() — {value, display, category, status, expired,
// is_direct, number_of_resources} -> ConnectionEntry, per the new backend endpoint's contract
// (see companion aperture_token_service design), which mirrors /get-member-connections exactly.

// Use from a service-authenticated session to look up an arbitrary person's connection
// token by client_fhir_person_id. Use getConnectionToken instead for the logged-in
// member's own connection token.
async getConnectionTokenForPerson({ serviceSlug, clientPersonId }: {
    serviceSlug: string;
    clientPersonId: string;
}): Promise<{
    status: number | undefined;
    connectionToken: ConnectionToken | null;
}>
// GET /get-client-person-connection-token/{serviceSlug}/?client_fhir_person_id={clientPersonId}
// Same response shape as getConnectionToken() — the new backend endpoint mirrors
// /get-member-connection-token/{slug}/ exactly.
```

Both still go through `TokenServiceApi`'s inherited `BaseApi` machinery (the session's own bearer
token — whatever `clientcredentials`/`okta` session is active — attached automatically,
`handleUnauthorized` still fires on a 401 exactly as it does for the existing methods). No new
auth plumbing needed on the frontend; only new URLs and query params.

### Error handling

- Wrong login (not `clientcredentials`/`okta`) while `personId` is set → Safeguard 3's message,
  no API call attempted.
- ATS 401 (session itself invalid) → unchanged, existing `handleUnauthorized` logout.
- ATS 403 — the new endpoints don't apply `restrict_delegated_user_rest` (that guard is specific
  to member JWTs with an `act` claim; it's meaningless for a service token) — but should still
  handle an unexpected 403 (e.g. a future scope check landing per the Non-goals note) as a
  generic "not available" message, matching the existing pattern's shape without assuming the
  specific delegated-account wording applies.
- No connections found for that person (successful call, empty list) → `ConnectionPicker`'s
  existing "No connections found." empty state, unchanged.
- Malformed/nonexistent `personId` → same empty-list behavior; ATS returns an empty list rather
  than an error for an unrecognized `client_fhir_person_id` (per the mirrored member endpoint's
  own behavior for an unrecognized caller identity).

## Testing

No automated test framework in this repo — manual verification only, plus `yarn lint`/
`yarn tsc --noEmit`:

- **Gate zero, before any other testing:** verify the identifier assumption — confirm a live
  Patient or Person resource's FHIR `id` actually matches the `client_fhir_person_id` stored on
  at least one real ATS connection document for that same person. If it doesn't, stop and revisit
  "Identifier assumption" before continuing.
- The "Test Connections" link appears on Patient/Person cards only when logged in via
  `clientcredentials`/`okta`, and is absent for `bwellapp`/`cognito` sessions.
- Clicking it navigates to `/connections?personId=<id>` and the mode-indicator banner renders
  immediately.
- The picker shows that person's connections (via the new list endpoint), not the caller's own.
- Selecting a connection fetches a token via the new per-person token endpoint; the rest of the
  console (info bar, request/response, headers) behaves identically to the existing "my own
  connections" flow.
- Switching `personId` (e.g. testing a second patient from a different card) fully resets all
  console state — no stale token, response, or picker selection from the first person.
- Removing `personId` from the URL (browser back, or manually editing the URL) returns to the
  normal "my own connections" mode with no residual on-behalf-of state.
- A `bwellapp`/`cognito` session that somehow reaches `/connections?personId=<id>` directly (e.g.
  a shared URL) sees Safeguard 3's message, not a confusing error or, worse, a silent fallback to
  showing the caller's own connections instead of the intended person's.
