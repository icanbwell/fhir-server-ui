# API Console: Free-Form Request Path — Design

## Problem

`APIConsolePage.tsx` (route `/api-console`) builds its request URL from a guided set of
controls — a `selectedResourceType` autocomplete, an `operation` dropdown, an `id` field,
and a `params` field — that compose into `/4_0_0/<resourceType>/<id>/<operation>?<params>`.
A free-text field exists (`urlSuffix`), but it's only usable as the *entire* path when
`selectedResourceType` is left blank; otherwise it's appended as a suffix onto the guided
prefix. This means the guided controls aren't just a convenience — they're a gate a user
has to work around, and the resulting URL is limited to shapes the controls know how to
express (e.g. no arbitrary operation the `OPERATIONS` list doesn't contain, no path that
doesn't fit the `<resourceType>/<id>/<operation>` shape at all).

## Goal

Replace the guided resourceType/operation/id/params controls with a single free-text
"Request Path" field that is always the literal, complete request path — no composition,
no gating on other fields being empty. The Method dropdown stays as-is.

## Non-goals

- **Migrating old bookmarked URLs.** `/api-console` links using the old
  `?resourceType=&operation=&id=&params=&smartMerge=` query-param scheme stop being read;
  there's no shim to translate them into the new `?method=&urlSuffix=` scheme. Confirmed
  via `grep -rn "api-console?" src` that the only other place in the codebase that builds a
  link into this page is `Header.tsx`'s "Open in API Console" button (added in
  `feature/open-in-api-console`, already merged), which already uses `?method=&urlSuffix=`
  — the scheme this design keeps, not the one being dropped. Nothing else needs updating.
- **Any assistance in the new field** (autocomplete, syntax highlighting, validation). It's
  a plain text field.
- **Changing the request-body editor, custom headers editor, response viewer, or
  streaming behavior.** All untouched.
- **Changing the `ResourceCard` → "Edit Resource" → `$merge` route or `IndexPage.tsx`'s
  handling of it.** `IndexPage.tsx` still renders `<APIConsolePage />` in place when
  `operation === '$merge'`, passing the same route params via `useParams()`. Untouched.

## Design

### 1. State

Remove entirely: `selectedResourceType`, `operation`, `resourceId`, `params`,
`smartMerge`, the `Operation` type, the `OPERATIONS` constant, and `RESOURCE_NAMES`
(derived from `resourceDefinitions`, which becomes unused here).

Keep `method` unchanged. Keep `urlSuffix` as both the state variable name and the
`?urlSuffix=` query-param name — even though it's no longer ever a "suffix," renaming it
would mean also updating `Header.tsx`'s `handleOpenInConsole`, which already builds
`?method=&urlSuffix=` links against this exact contract. Keeping the name means that
button needs zero changes.

### 2. `requestUrl`

Today's memo (`APIConsolePage.tsx:123-151`) has two branches: one for when
`selectedResourceType` is empty (just normalize `urlSuffix` to have a leading slash) and
one that composes `resourceType`/`operation`/`id`/`params` together. Delete the second
branch entirely — the first branch's logic is *all* `requestUrl` needs now:

```ts
const requestUrl = useMemo(() => {
    if (!urlSuffix) {
        return '';
    }
    return urlSuffix.startsWith('/') ? urlSuffix : `/${urlSuffix}`;
}, [urlSuffix]);
```

The Send button's `disabled` condition (`loading || fetching || !requestUrl`) is already
correct and needs no change.

### 3. Search-param sync

The sync effect (`APIConsolePage.tsx:93-120`) currently writes up to seven possible query
params. It collapses to two:

```ts
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
```

### 4. UI

The Controls bar (`APIConsolePage.tsx:319-472`) reduces to: the Method `<Select>`
(unchanged, including `getMethodColor`), one full-width `TextField` labeled "Request Path"
(placeholder `Full path, e.g. /4_0_0/Patient/123 or /version`, always shown, never
conditional) bound to `urlSuffix`, and the Send `Button` (unchanged). Delete the Resource
Type `Autocomplete`, both branches of the `operation ? (...) : (...)` block (ID field,
Operation `<Select>`, params field, smartMerge `Checkbox`/`Tooltip`), and their associated
imports (`Autocomplete`, `Checkbox`, `FormControlLabel`, `Tooltip` — `Tooltip` has no other
use in this file today, confirmed by reading the full file).

Everything below the Controls bar — the Request Headers editor, the URL preview line, the
split-pane Request Body / Response viewer — is unchanged; the URL preview line already
just renders `{method} {requestUrl}` and needs no modification.

### 5. Redirect flow (`ResourceCard` → "Edit Resource" → `$merge`)

`isFromRedirect`'s definition (`Boolean(routeId && routeResourceType && routeOperation)`)
and the auto-fetch effect that prefills the Request Body editor
(`APIConsolePage.tsx:186-209`, reads `routeId`/`routeResourceType` directly, not any
guided-builder state) are both unchanged.

What changes: today, arriving via redirect disables the Method/ResourceType/ID/Operation
controls (`disabled={isFromRedirect}` on each) so the URL is locked to exactly what the
route params specify. With the guided controls gone, there's nothing left to lock —
`urlSuffix`'s initial value becomes the composed path so the field starts pre-filled
correctly, and both it and Method are freely editable from there, same as the standalone
route:

```ts
const [method, setMethod] = useState<HttpMethod>(
    (searchParams.get('method') as HttpMethod) || (isFromRedirect ? 'POST' : 'GET')
);
const [urlSuffix, setUrlSuffix] = useState<string>(
    isFromRedirect && routeResourceType && routeId && routeOperation
        ? `/4_0_0/${routeResourceType}/${routeId}/${routeOperation}`
        : searchParams.get('urlSuffix') || ''
);
```

(`routeOperation` is used directly rather than hardcoding `$merge`, even though today it's
always `$merge` in practice — `IndexPage.tsx` only ever forwards this redirect for that
operation — since the value is already available and this way nothing has to change here
if that ever expands.)

## Testing

Manual only, matching this repo's convention (no automated test framework):

- `yarn lint` / `yarn tsc --noEmit` clean.
- Standalone `/api-console`: type a full path (e.g. `/version`), confirm Send works exactly
  as before.
- Type a path with a method other than GET (e.g. switch Method to POST, path to
  `/4_0_0/Patient/123/$merge`, add a body): confirm it sends correctly.
- Refresh the page after typing a path: confirm `method`/`urlSuffix` restore from the URL
  bar (search-param sync still works with the reduced param set).
- `ResourceCard` → "Edit Resource" → `$merge`: confirm the Request Path field arrives
  pre-filled with `/4_0_0/<resourceType>/<id>/$merge`, Method arrives as `POST`, the
  Request Body editor auto-fills with the current resource's JSON (unchanged), and both
  Method and the path are now editable (not locked, per this design).
- `Header.tsx`'s "Open in API Console" button (from `feature/open-in-api-console`): confirm
  it still opens the console correctly prefilled — this exercises the exact
  `?method=&urlSuffix=` contract this design preserves.
