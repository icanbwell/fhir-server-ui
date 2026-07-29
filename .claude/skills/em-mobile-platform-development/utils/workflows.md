# Workflows & Reference

## Deployment Chain (for plugin/component changes)

**Order matters. Follow strictly:**

1. **mfe-toolkit** — fix/create plugin or component → PR → review → merge.

   - On merge: package version bumps automatically via CI (labels: major/minor/patch).

2. **ui-platform** — update the changed package version in `apps/composite/package.json`.

   - **CRITICAL:** `@icanbwell/native-components` version must match the newly published mfe-toolkit version. This is the bridge between mfe-toolkit and em-mobile-platform — composite's `dependencies` pull RN-side packages (`native-components` → `native-plugins`) into em-mobile-platform's `node_modules`. If you skip this bump, em-mobile-platform gets stale `native-plugins` and new plugin methods (e.g. `startSession`) will be undefined at runtime.
   - Files to update (3 locations):
     1. `apps/composite/package.json` → `dependencies` → `"@icanbwell/native-components": "<new-version>"`
     2. `package.json` → `dependencies` → `"@icanbwell/native-components": "<new-version>"`
     3. `package.json` → second `@icanbwell/native-components` entry (overrides/peerDependencies block, ~line 197)
   - Then run `npm install` to update `package-lock.json`
   - PR → review → merge.
   - New composite version appears at GitHub packages.

3. **em-mobile-platform** — update `@icanbwell/composite` version in `package.json`.
   - PR → review → merge.
   - Build the app via `bitrise.yml`.

## Post-Change Yalc Workflow (MANDATORY)

**Based on:** [Confluence E2E Local Development](https://icanbwell.atlassian.net/wiki/spaces/ATHD/pages/4238573641/Embeddables+Mobile+App+Development#E2E-Local-Development)

After ANY code change in mfe-toolkit or ui-platform, Claude Code MUST:

1. **Identify affected packages** — which `@icanbwell/*` package was modified?
2. **Build & yalc push** from mfe-toolkit:
   ```shell
   cd <mfe-toolkit> && yarn nx run <package-name>:build && yalc push dist/libs/<package-name>
   ```
   Common packages: `native-plugins`, `native-components`, `native-bridge`, `types`.
3. **First-time setup only** (if package not yet linked in consuming repo):
   ```shell
   # In em-mobile-platform or ui-platform
   yalc add @icanbwell/<package-name> && yarn
   ```
   And pin in `package.json` resolutions:
   ```json
   "resolutions": {
     "**/@icanbwell/<package-name>": "file:.yalc/@icanbwell/<package-name>"
   }
   ```
   After initial `yalc add`, subsequent `yalc push` auto-propagates to linked repos.
4. **Inform the dev** that yalc is done and they need to rebuild:
   - **ui-platform:** `npx nx run composite:prod-local` (rebuilds composite with updated packages, serves at localhost:4200)
   - **em-mobile-platform:** `yarn ios` or `yarn android` (rebuilds the RN app)

**Why:** The 3-repo chain (`mfe-toolkit → ui-platform → em-mobile-platform`) means local changes don't propagate automatically. Yalc push updates `node_modules` in consuming repos, but the consuming apps still need a rebuild to pick up the changes.

**Always think:** "Did my change touch a package that ui-platform or em-mobile-platform depends on? If yes → yalc push + tell dev to rebuild."

## Common Workflows

### Fix a bug in a native plugin

1. Identify which plugin in `mfe-toolkit/libs/native-plugins/src/definitions/`
2. Fix → test locally via yalc into em-mobile-platform
3. PR on mfe-toolkit → merge → version bumps
4. **Bump `@icanbwell/native-components` in `ui-platform/apps/composite/package.json`** to pick up new native-plugins → PR → merge
5. Update `@icanbwell/composite` in em-mobile-platform → PR → merge → Bitrise build

### Add a new native capability

1. Create plugin definition in `mfe-toolkit/libs/native-plugins/src/definitions/`
2. Add bridge binding in `native-bridge`
3. Add native module in em-mobile-platform (iOS: Swift, Android: Kotlin/Java)
4. Inject module in `App.tsx` nativeModules prop
5. Follow deployment chain above

### Debug WebView content

- Android: `chrome://inspect/#devices` after `adb reverse tcp:4200 tcp:4200` (localhost only — NOT needed when using LAN IP for physical devices)
- iOS Simulator: Safari → Developer → select simulator → localhost
- iOS Physical Device: Safari → Develop → [device name] → `<YOUR_IP>`
- Both require `webviewDebuggingEnabled={true}` in ComponentView

## Key Files Reference

| File                                                                   | Repo               | Purpose                                                     |
| ---------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------- |
| `App.tsx`                                                              | em-mobile-platform | Main entry, Composite + native modules                      |
| `package.json`                                                         | em-mobile-platform | `@icanbwell/composite` version                              |
| `bitrise.yml`                                                          | em-mobile-platform | CI/CD build config                                          |
| `.env.example`                                                         | em-mobile-platform | Environment template                                        |
| `scripts/bootstrapWhitelabel.ts`                                       | em-mobile-platform | White-label setup                                           |
| `apps/composite/package.json`                                          | ui-platform        | `native-components` version (bump after mfe-toolkit merge!) |
| `libs/native-components/src/ComponentView/ComponentView.component.tsx` | mfe-toolkit        | WebView wrapper component                                   |
| `libs/native-plugins/src/definitions/`                                 | mfe-toolkit        | Plugin definitions                                          |
| `libs/native-bridge/`                                                  | mfe-toolkit        | Web-to-mobile bridge                                        |

## Build & Scripts

### em-mobile-platform

- `yarn android` / `yarn ios` — run dev
- `yarn start` — Metro bundler
- `yarn bootstrap-whitelabel` — configure client variant
- `yarn lint` / `yarn test`

### mfe-toolkit

- `yarn nx run <lib>:build` — build specific package
- `yarn nx run <lib>:yalc-dev` — watch mode with yalc push
- `yarn nx run <lib>:test` — test specific package
- `yarn build:affected` — build changed packages only
