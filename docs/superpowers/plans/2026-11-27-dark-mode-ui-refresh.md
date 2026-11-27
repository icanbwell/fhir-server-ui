# Dark mode readability + UI refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dark mode readable (AA contrast) with a modest UI polish, and show one loading bar instead of two on the resource list page.

**Architecture:** Add dark-mode colour tokens to `brandColors.ts` (additive only), consume them per-mode in `ThemeContext.tsx` so every `color="primary"` usage is fixed centrally, mirror them as CSS variables in `index.css` for plain-CSS consumers, then fix the few hardcoded colours and the duplicate progress bar.

**Tech Stack:** React 19, MUI 9 (`@mui/material/styles`: `createTheme`, `getContrastRatio`, `lighten`, `darken`, `alpha`), Vitest + Testing Library + jest-axe, Vite.

**Spec:** `docs/superpowers/specs/2026-11-27-dark-mode-ui-refresh-design.md`

## Global Constraints

- Branch `SG-DCON-000`; every commit message starts with `DCON-000 ` (bare key, no `SG-`, no conventional-commit prefix). No AI attribution trailers.
- `brandColors.ts` changes are additive only: never rename or remove an existing token (ag-grid theme, Bailey bridge and CSS files read them).
- Light-mode palette values are unchanged: `primary.main === brandColors.blue`, `background.default === brandColors.lightGray`.
- Dark text/icon colours must be >= 4.5:1 on all three dark surfaces: page `#14162E`, card `#1E2150`, raised `#262A63`.
- No new dependencies. No changes to fetching, `useResourceCount`, `ReferenceLink`, `ReverseReferenceLink`.
- Verification commands: `yarn vitest run <file>`, `yarn lint`, `yarn test`, `yarn build`.

## Review Focus

- Filled buttons/chips in dark mode: `contrastText` must be readable on both `primary.main` and `primary.dark` (hover) — Task 1.
- Plain `<a>` links (react-router `Link`, raw anchors) in dark mode including `:visited` and `:hover`, which `index.css` currently hardcodes to navy — Task 2.
- MUI's dark-mode elevation overlay (`backgroundImage`) lightens papers away from the token colours, silently invalidating the contrast maths — Task 2.
- Loading state before any bytes arrive, and the `_format=json` branch: exactly one progress bar each — Task 3.
- Loading finished: zero progress bars — Task 3.

---

### Task 1: Dark palette tokens + per-mode palette

**Files:**
- Modify: `src/theme/brandColors.ts` (add tokens)
- Modify: `src/context/ThemeContext.tsx` (palette block, lines ~80-116)
- Create: `src/theme/darkPalette.test.ts`
- Modify: `src/context/ThemeContext.test.tsx` (add dark-palette probe test)

**Interfaces:**
- Produces (new `brandColors` keys, all `string`): `darkModePrimary '#9BA3FF'`, `darkModePrimaryHover '#C3C8FF'`, `darkModeSecondary '#9A90FF'`, `darkModeInfo '#8FB4FF'`, `darkModeError '#FF8A80'`, `darkModeWarning '#FF8F73'`, `darkModeRaised '#262A63'`, `darkModeDivider '#3D4290'`.
- Produces: in dark mode `theme.palette.{primary,secondary,info,error,warning}.main` use the tokens above, `primary.dark = darken(darkModePrimary, 0.15)`, `palette.divider = darkModeDivider`. Light mode unchanged.

- [ ] **Step 1: Write the failing tests** in `src/theme/darkPalette.test.ts` using `getContrastRatio` from `@mui/material/styles`:
  - `test.each` over `[primary, primaryHover, secondary, info, error, warning]` tokens × `[darkModeBackground, darkModePaper, darkModeRaised]`: `getContrastRatio(fg, bg) >= 4.5`.
  - `darkModeDivider` vs `darkModePaper` `>= 1.5`.
  - Build the real dark theme by rendering `ThemeContextProvider` with `localStorage.darkMode='true'` and a probe (pattern in `ThemeContext.test.tsx:120`); assert `primary.main === darkModePrimary`, `secondary.main`/`info.main`/`error.main`/`warning.main` equal their tokens, `getContrastRatio(primary.contrastText, primary.main) >= 4.5` and the same against `primary.dark`, and likewise `contrastText` vs `error.main`, `secondary.main`.
  - Light mode (no persisted value): `primary.main === brandColors.blue`, `error.main === brandColors.errorRed`, `secondary.main === brandColors.lilac`.
- [ ] **Step 2:** Run `yarn vitest run src/theme/darkPalette.test.ts` — expected FAIL (tokens undefined).
- [ ] **Step 3:** Add the eight tokens to `brandColors.ts` (comment: dark-mode-only, contrast-checked against the three dark surfaces).
- [ ] **Step 4:** In `ThemeContext.tsx` make `primary/secondary/info/error/warning` and `divider` mode-dependent (dark → tokens; light → existing values). Compute `primary.dark` for dark via `darken`. Let MUI derive `contrastText`; if the assertion in Step 1 fails for any colour, set `contrastText` explicitly to `brandColors.darkModeBackground`.
- [ ] **Step 5:** Run `yarn vitest run src/theme/darkPalette.test.ts src/context` — expected PASS (existing ThemeContext tests included).
- [ ] **Step 6: Commit** `git add docs src/theme src/context && git commit -m "DCON-000 add contrast-checked dark palette tokens"` (this also commits the spec and plan under `docs/`).

---

### Task 2: Surfaces, shape, focus, links, scrollbars

**Files:**
- Modify: `src/context/ThemeContext.tsx` (`shape`, `components`)
- Modify: `src/index.css` (dark-mode variables + `.dark-mode a` rules)
- Create: `src/theme/cssTokens.test.ts`
- Modify: `src/context/ThemeContext.test.tsx` (theme-shape probe tests)

**Interfaces:**
- Consumes: Task 1 tokens (`darkModeRaised`, `darkModeDivider`, `darkModePrimary`, `darkModePrimaryHover`).
- Produces: `index.css` variables `--bwell-dark-mode-<kebab-case token suffix>` for **every** `darkMode*` key of `brandColors` (existing `background`, `paper`, `border` plus `text-secondary`, `primary`, `primary-hover`, `secondary`, `info`, `error`, `warning`, `raised`, `divider`).

- [ ] **Step 1: Write the failing tests.**
  - `src/theme/cssTokens.test.ts`: read `src/index.css` with `node:fs`; for each `brandColors` key starting `darkMode`, derive the variable name (`darkModeTextSecondary` → `--bwell-dark-mode-text-secondary`) and assert the file declares it with a value equal (case-insensitive) to the token (`test.each`). Also assert the file contains a rule beginning `.dark-mode a:not(.MuiButton-root):not(.MuiButtonBase-root)` for the base, `:visited` and `:hover` states, each referencing `var(--bwell-dark-mode-primary)` / `var(--bwell-dark-mode-primary-hover)` (regex on the file text).
  - `ThemeContext.test.tsx`, probe-based: light and dark `shape.borderRadius === 8`; dark `components.MuiPaper.styleOverrides.root` (resolved with the theme) yields `backgroundImage: 'none'` and `borderRadius: 12`; dark `palette.background.paper === darkModePaper`.
- [ ] **Step 2:** Run both files — expected FAIL.
- [ ] **Step 3:** In `index.css` add the variables and the three `.dark-mode a…` rules (base/visited → primary var, hover → primary-hover var). Keep existing light rules untouched.
- [ ] **Step 4:** In `ThemeContext.tsx`:
  - `shape.borderRadius: 8`.
  - `MuiPaper`/`MuiCard`: `borderRadius: 12`, `backgroundImage: 'none'` (disables MUI's dark elevation overlay so surfaces stay on-token), dark-only `1px solid ${divider}` border; `MuiAccordion`: same radius/border and `'&:before': { display: 'none' }`.
  - `MuiPopover` paper slot (menus/popovers) uses `brandColors.darkModeRaised` in dark.
  - `MuiButtonBase` `'&.Mui-focusVisible'` and `MuiLink` `'&:focus-visible'`: `outline: 2px solid ${primary.main}`, `outlineOffset: 2`.
  - `MuiLink` hover: dark → `brandColors.darkModePrimaryHover`, light → existing `primary.dark`.
  - `getHeaderBackground` and `MuiTableRow` hover: dark → `darkModeRaised`; light unchanged.
  - `MuiCssBaseline.styleOverrides`: `color-scheme` per mode and mode-aware `scrollbar-color` (thumb `darkModeDivider`/track `darkModePaper` in dark; MUI grey in light) plus `::-webkit-scrollbar*` equivalents.
- [ ] **Step 5:** Run `yarn vitest run src/theme src/context src/test` (includes the axe smoke test) — expected PASS.
- [ ] **Step 6: Commit** `DCON-000 refresh dark-mode surfaces, focus states and links`.

---

### Task 3: Single loading indicator

**Files:**
- Modify: `src/components/StreamProgressIndicator.tsx`
- Modify: `src/pages/IndexPage.tsx` (`getBox()` lines ~54-71)
- Create: `src/components/StreamProgressIndicator.test.tsx`
- Create: `src/pages/IndexPage.test.tsx`

**Interfaces:**
- Produces: `StreamProgressIndicator` props become `{ progress: StreamProgressState; loading?: boolean }`. Behaviour: `progress.isStreaming` → unchanged (bar + caption); else `loading` → a bare indeterminate `LinearProgress`, no caption; else `null`. Existing callers pass no `loading` and are unchanged.

- [ ] **Step 1: Write the failing tests.**
  - `StreamProgressIndicator.test.tsx` (`test.each` over states, asserting `queryAllByRole('progressbar').length`): streaming w/o total → 1 bar + "Loading… 1.0 KB received"; streaming with total → 1 determinate bar (`aria-valuenow` 50) + caption with `(50%)`; not streaming, `loading` omitted → 0; not streaming, `loading` true → 1 bar and no caption text.
  - `IndexPage.test.tsx`: render `IndexPage` inside `MemoryRouter` at `/4_0_0/Patient`, wrapped in `EnvironmentContext`, `UserContext`, `LastRequestContext` providers, with `localStorage.identityProvider` set and `vi.mock('../api/fhirApi')` replacing `FhirApi.getBundleAsync` with a promise that stays pending (external boundary mocked, nothing internal). Assertions: while pending, `getAllByRole('progressbar')` has length exactly 1; at `?_format=json` also exactly 1; after the mock resolves with an empty Bundle (`{ resourceType: 'Bundle', entry: [] }`) and `waitFor`, there are 0.
- [ ] **Step 2:** Run both — expected FAIL (IndexPage renders 2 bars; `loading` prop unknown).
- [ ] **Step 3:** Implement the `loading` prop in `StreamProgressIndicator.tsx` per the behaviour above.
- [ ] **Step 4:** In `IndexPage.tsx` remove the bare `<LinearProgress />` from both `getBox()` branches (initial-load branch and the `{loading && …}` pair) and render `<StreamProgressIndicator progress={progress} loading={loading} />` once in each. Leave the `_format=json` branch's `LinearProgress` alone. Drop the `LinearProgress` import only if it becomes unused (it is still used by the json branch).
- [ ] **Step 5:** Run `yarn vitest run src/components/StreamProgressIndicator.test.tsx src/pages/IndexPage.test.tsx` — expected PASS.
- [ ] **Step 6: Commit** `DCON-000 show a single loading bar on the resource list page`.

---

### Task 4: Remove hardcoded colours that ignore the theme

**Files:**
- Modify: `src/admin/personMatch.tsx:216`, `src/admin/personOneToNMatch.tsx:209` (textarea inline border)
- Modify: `src/ObservationTimeline.tsx`, `src/PatientTimeline.tsx` (navy `#2E3586` card/arrow/icon colours)
- Modify: `src/ObservationGraph.tsx` (dataset colours; chart ticks/grid/legend colours)
- Create: `src/timelines.test.tsx`

**Interfaces:**
- Consumes: MUI `useTheme()` from `@mui/material/styles` (the app's own `useTheme` in `ThemeContext` returns only `{isDarkMode, toggleDarkMode}`); `theme.palette.divider`, `theme.palette.primary.main`, `theme.palette.brand.darkModeRaised`.

- [ ] **Step 1: Write the failing test** `src/timelines.test.tsx` (`test.each` over `ObservationTimeline`, `PatientTimeline`): render each inside `ThemeContextProvider` with `darkMode='true'` and assert no element's inline `style` contains `#2E3586` (case-insensitive; query `container.querySelectorAll('[style]')`), and that the timeline content background equals `brandColors.darkModeRaised` in dark and `brandColors.blue` in light (light: render without persisted value). Components are lazy-routed default exports; import them directly.
- [ ] **Step 2:** Run it — expected FAIL.
- [ ] **Step 3:** Timelines: derive `contentStyle` background, arrow border and `iconStyle` background from the MUI theme (dark → `darkModeRaised` with a `divider` border; light → `brandColors.blue`), keeping `color: '#fff'` text. Admin textareas: `border: 1px solid ${theme.palette.divider}`, plus `backgroundColor: theme.palette.background.paper` and `color: theme.palette.text.primary`. Graph: dataset `borderColor` = `primary.main`, `backgroundColor` = `alpha(primary.main, 0.2)`; chart options set `scales.*.ticks.color`/`grid.color` and `plugins.legend.labels.color` from the theme (`text.secondary`, `divider`, `text.primary`).
- [ ] **Step 4:** Run `yarn vitest run src/timelines.test.tsx` — expected PASS. The chart cannot be asserted in jsdom (canvas); it is covered by `yarn build` type-checking and the visual check in Task 5.
- [ ] **Step 5: Commit** `DCON-000 theme hardcoded timeline, chart and admin colours`.

---

### Task 5: Full verification

**Files:** none (fix-ups only if a check fails).

- [ ] **Step 1:** Run `yarn lint && yarn test && yarn build` — expected: all pass; fix anything introduced by Tasks 1-4.
- [ ] **Step 2:** Start `yarn dev`; with Playwright, load `/select-idp`, the About page and `/not-found` in light and dark (set `localStorage.darkMode`) and screenshot each. For authenticated pages (resource list, a single resource, `/admin`), stub the FHIR responses with Playwright route interception and a fake JWT in `localStorage` as `jwtParser` expects; screenshot light and dark. Also open an IPS view and a markdown-table view and, if their dark-mode colours in `IPSNarrative.css` / `MarkdownTable.css` are still below 4.5:1 after the palette change, adjust them (the spec makes this conditional). Check by eye: links, icons, outlined buttons, chips, `(10+)` counts, table headers, accordions, menus, loading bar (one only).
- [ ] **Step 3:** Report what was and wasn't visually verified (e.g. anything needing a real FHIR server). Adjust shades only if a screenshot shows a problem, keeping `darkPalette.test.ts` green.
- [ ] **Step 4: Commit** any fix-ups as `DCON-000 fix dark-mode visual issues`.
