# Dark mode readability + UI refresh, single loading indicator (DCON-000)

Status: draft, awaiting approval. Size: small-to-medium (theme-level change, ~6 files).

## Intent and why

Dark mode is hard to read in places. `primary` is brand navy `#2E3586` in both modes, which is
1.4–1.7:1 against the dark surfaces (`#14162E`, `#1E2150`) — roughly invisible. About 40 usages
(links, outlined buttons, `color="primary"` icons/labels, reverse-reference counts, chips) inherit
this. Error red (~3:1), `info` (~3.6:1) and dividers (~1.5:1) are also weak. Separately, the resource
list page (`IndexPage`) shows two stacked loading bars. The user also invited a broader UI polish
("option B") while keeping the colour theme approximately the same.

## Goals

- Every dark-mode text/icon colour token reaches WCAG AA (>= 4.5:1) on all three dark surfaces.
- Dark palette stays in the existing blue/lilac family; light mode colours are unchanged.
- Modest UI refresh: layered dark surfaces, rounder cards with a thin border, consistent hover and
  `:focus-visible` states, tidier table headers, mode-aware scrollbars.
- One loading indicator on `IndexPage` (progress bar + byte-count caption).

## Non-goals / anti-goals

- No change to FHIR fetching, count requests (`useResourceCount`, `ReferenceLink`,
  `ReverseReferenceLink`), caching or concurrency. Explicitly out of scope per the user.
- No new dependencies, no MUI CSS-variables migration, no extraction of the theme into a new module.
- Do not change light-mode appearance beyond the shared shape/focus polish.
- Do not make dark mode a different brand (no neutral greys, no new hues).

## Constraints

- No PHI/tenant/event-contract/public-API surface is touched. Theme and presentation only.
- `.dark-mode` body class and CSS variables in `src/index.css`, `IPSNarrative.css` and
  `MarkdownTable.css` must keep working; the ag-grid theme (`useAgGridBrandTheme`) and Bailey bridge
  (`useBaileyThemeBridge`) read `brandColors`, so renamed/removed tokens would break them. Only add
  tokens; do not rename existing ones.
- Existing tests assert `primary.main === brandColors.blue` in light mode and
  `background.default === brandColors.darkModeBackground` in dark mode; both stay true.

## Approaches considered

1. **Theme-only, tokens in `brandColors` (chosen).** Edit `ThemeContext.tsx` + `brandColors.ts`;
   per-mode `primary.main` fixes the ~40 usages with no edits to those files. Trade-off:
   `ThemeContext.tsx` grows to ~400 lines.
2. Same but extract `src/theme/appTheme.ts`. More testable, bigger diff that moves existing code;
   deferred to a possible follow-up.
3. MUI CSS variables / `colorSchemes`. No flash on load, but touches ag-grid, Bailey bridge and the
   CSS files; too large and risky for "keep the theme similar".

## Design

**Tokens (`brandColors.ts`, additive only)** — dark-mode values, contrast checked against
`#14162E` / `#1E2150` / `#262A63`:

| Token | Value | Contrast on page / card / raised |
|---|---|---|
| darkModePrimary | `#9BA3FF` | 7.7 / 6.5 / 5.7 |
| darkModeSecondary (lilac tint) | `#9A90FF` | 6.6 / 5.6 / 4.9 |
| darkModeInfo | `#8FB4FF` | 8.6 / 7.3 / 6.4 |
| darkModeError | `#FF8A80` | 7.8 / 6.6 / 5.8 |
| darkModeWarning | `#FF8F73` | 8.0 / 6.8 / 5.9 |
| darkModeRaised (new surface) | `#262A63` | — |
| darkModeBorder (existing) | `#2A2E63`, brightened for dividers to about `#3D4290` | non-text, ~1.7–2:1 |

Final values may shift by a shade after visual check, but the test below is the gate.

**`ThemeContext.tsx`**
- Per-mode `primary`, `secondary`, `info`, `error`, `warning` (dark uses the tokens above; `dark`
  variants derived with MUI helpers). MUI picks `contrastText` automatically (navy on periwinkle
  buttons, 7.7:1).
- `shape.borderRadius: 8`; `MuiCard`/`MuiPaper`: 12px radius, 1px divider border in dark, no heavy
  shadow; `MuiAccordion` same.
- Dark surfaces: page `#14162E`, card `#1E2150`, raised (menus, popovers, hovered rows) `#262A63`.
- Shared `:focus-visible` ring on buttons, icon buttons, links, inputs (2px, primary tint).
- `MuiTableHead`/`MuiTableCell.head`: slightly stronger header surface and uppercase-free, semibold
  label; row hover uses the raised surface.
- `MuiChip`, `MuiButton` (outlined/contained) get explicit dark hover states.
- `MuiCssBaseline` styleOverrides for `color-scheme` and scrollbar colours per mode.
- Collapse the duplicated `MuiTextField`/`MuiFormControl` override blocks only if it's a trivial
  de-dup; otherwise leave as is (minimal diff).

**Hardcoded colours to theme**
- `admin/personMatch.tsx`, `admin/personOneToNMatch.tsx`: `rgba(0,0,0,0.23)` border -> `divider`.
- `PatientTimeline.tsx`, `ObservationTimeline.tsx`, `ObservationGraph.tsx`: navy `#2E3586`
  card/line colours -> theme primary (readable in dark mode).
- `MarkdownTable.css`, `IPSNarrative.css`: only if a dark-mode value is still sub-AA after the
  palette change.

**Single loading indicator (`IndexPage.tsx`, `StreamProgressIndicator.tsx`)**
- Remove the bare `<LinearProgress />` in both `getBox()` branches; keep `StreamProgressIndicator`
  (it owns the bar and the "Loading… X of Y" caption).
- Edge case: `loading` is true before `startProgress()`'s state lands / when `isStreaming` is false,
  in which `StreamProgressIndicator` returns null and nothing would show. Make the indicator
  fall back to an indeterminate bar with no caption in that gap, so there is always exactly one bar.
- The `$format=json` branch keeps its own single `LinearProgress` (already one bar).

## Testing

- New parameterized test (`test.each`) over every dark foreground token x every dark surface
  asserting contrast >= 4.5:1, plus light-mode unchanged assertions. A tiny contrast helper lives in
  the test file.
- Extend `ThemeContext.test.tsx`: dark `primary.main` is the dark token, light stays `brandColors.blue`.
- `StreamProgressIndicator` / `IndexPage`: one `progressbar` role present while loading (before and
  after bytes arrive), none when done.
- Run `yarn lint`, `yarn test`, `yarn build`; verify visually in both modes at the end.

## Left to the builder

Exact shades (within the AA gate), exact radius/border/shadow values, which table/chip micro-styles
are worth touching, and whether to de-dup the TextField/FormControl overrides.

## Process notes

Branch `SG-DCON-000`. Placeholder ticket key `DCON-000` was supplied by the user; commit messages
start with `DCON-000`. This doc is not committed yet.
