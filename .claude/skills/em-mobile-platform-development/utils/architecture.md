# Architecture Overview

**Source of truth:** [Embeddables | Mobile App Development](https://icanbwell.atlassian.net/wiki/spaces/ATHD/pages/4238573641/Embeddables+Mobile+App+Development)

## Three-Repo Dependency Chain

```
mfe-toolkit (packages) → ui-platform (composite) → em-mobile-platform (RN host app)
```

### em-mobile-platform

- **What:** React Native host app. Renders `<Composite>` component inside a WebView.
- **Key file:** `App.tsx` — entry point, injects native modules into Composite.
- **Native modules injected:** storage, cameraRoll, geolocation, biometrics, documentPicker, permissions, fileSystem, print, pushNotifications, androidLocationEnabler.
- **Multi-client/white-label:** Single codebase, multiple variants (bwell-demo, bwell-employees, bwell-payer, bwell-preview, wellsense). Controlled via CLIENT_ID, ENVIRONMENT, CLIENT_KEY env vars.
- **CI/CD:** `bitrise.yml` — builds per client/environment. Triggered via GitHub Actions workflows.

### mfe-toolkit

- **What:** Nx monorepo with 16+ @icanbwell packages.
- **Key packages for mobile:**
  - `native-components` — React Native UI components, includes `ComponentView` (the WebView wrapper)
  - `native-plugins` — plugin definitions (biometrics, camera, storage, geolocation, etc.)
  - `native-bridge` — web-to-mobile bridge via `react-native-webview-invoke`
- **Plugin pattern:** `definePluginsMethods(invoke, nativeModules)` — conditionally defines methods based on available native modules.
- **Web code is hybrid:** checks `window['ReactNativeWebView']` to decide native vs web path.

### ui-platform

- **What:** Composite/MFE web code. Builds `@icanbwell/composite` package.
- **Composite versions published to:** `github.com/icanbwell/ui-platform/pkgs/npm/composite/versions`
- **em-mobile-platform depends on:** `@icanbwell/composite` (check current version in package.json)

---

## Deep Architecture

### WebView Bridge Mechanism

The RN app doesn't render React UI — it hosts a WebView that loads the composite web app. Communication between native and web sides uses `react-native-webview-invoke`.

```
Native (RN)                              Web (Composite inside WebView)
─────────────                             ──────────────────────────────
App.tsx                                   App.embeddable-loader.ts
  → <Composite nativeModules={...} />       → createEmbeddableLoader({ src: ... })
  → ComponentView.component.tsx               → loads remote/embeddable.federated.js
    → WebView with injected HTML              → Module Federation entry
    → react-native-webview-invoke             → web calls bridge → native modules
```

**Key files:**

- `em-mobile-platform/App.tsx` — passes `nativeModules` prop to `<Composite>`
- `mfe-toolkit/libs/native-components/src/ComponentView/ComponentView.component.tsx` — creates WebView, injects HTML template with `<script>` pointing to composite
- `mfe-toolkit/libs/native-components/src/ComponentView/htmlTemplate.ts` — HTML template injected into WebView, includes `isValidScriptUrl` validator
- `mfe-toolkit/libs/native-bridge/` — `react-native-webview-invoke` bindings
- `mfe-toolkit/libs/native-plugins/src/definitions/` — each plugin file defines methods exposed to web
- `ui-platform/apps/composite/src/app/embeddable/App.embeddable-loader.ts` — dynamic script loader on web side

### ComponentView Internals

`ComponentView.component.tsx` is the heart of the native-web bridge:

1. Builds an HTML string (`htmlTemplate`) with a `<script src="...">` pointing to composite's `package/index.js`
2. Sets `baseUrl` on the WebView — determines `window.location.hostname` inside the web context
3. Manages `originWhitelist` for allowed URLs
4. Has URL validators: `isValidSecondaryWebviewUri` and `SECONDARY_WEBVIEW_WHITELIST` for secondary navigation
5. `htmlTemplate.ts` has its own `isValidScriptUrl` for script injection safety

**Prod:** script URL and baseUrl point to the published composite CDN.
**Local dev:** overridden to `http://localhost:4200/` (emulator/simulator) or `http://<LAN_IP>:4200/` (physical device).

### Native Plugin System (End-to-End)

A plugin connects a web capability to native device APIs:

1. **Define the plugin** — `mfe-toolkit/libs/native-plugins/src/definitions/<plugin>.ts`
   - Exports method signatures and `definePluginsMethods()` function
2. **Bridge binding** — `mfe-toolkit/libs/native-bridge/` registers methods with `react-native-webview-invoke`
3. **Native module implementation** — `em-mobile-platform/` (Swift for iOS, Kotlin/Java for Android)
4. **Inject in App.tsx** — add to `nativeModules` prop on `<Composite>`
5. **Web calls it** — composite web code calls the plugin method, bridge routes to native

**Existing plugins:** biometrics, cameraRoll, storage, geolocation, documentPicker, permissions, fileSystem, print, pushNotifications, androidLocationEnabler.

### Module Federation / Composite Loading

ui-platform uses Webpack Module Federation:

1. `composite` app is built with `nx run composite:prod-local` (local) or CI (production)
2. Exposes `remote/embeddable.federated.js` as the federation entry
3. `App.embeddable-loader.ts` dynamically loads this entry via `createEmbeddableLoader({ src: ... })`
4. On device, `window.location.hostname` is inherited from ComponentView's `baseUrl`, so the loader resolves to the correct host automatically

**Local dev:** composite serves at `localhost:4200` via http-server. Physical device needs `0.0.0.0` binding and LAN IP in baseUrl.

### White-Label / Multi-Client System

Single RN codebase supports multiple branded apps. Each client is a variant with its own:

| Artifact         | Location                                                    | Purpose                                                         |
| ---------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| Icons (iOS)      | `assets/<client-id>/shared/icons/AppIcon.appiconset/`       | iOS app icons (all required sizes + `Contents.json`)            |
| Icons (Android)  | `assets/<client-id>/shared/icons/res/`                      | Android adaptive icons (`mipmap-*`, `drawable/`, `values/`)     |
| Play Store icon  | `assets/<client-id>/shared/icons/ic_launcher-playstore.png` | 512x512 Play Store listing icon                                 |
| Firebase config  | `assets/<client-id>/<env>/google-services.json`             | Per-environment Firebase/push config                            |
| Bitrise workflow | `bitrise.yml` → `<client>-<env>` workflow                   | Build config: CLIENT_KEY, ENVIRONMENT, BUNDLE_ID, WEB_URL, etc. |
| GH Actions input | `.github/workflows/build-clients-*.yml`                     | Boolean toggle + env mapping for CI trigger                     |
| Version bumps    | `scripts/utils/shared.ts` → `CLIENT_BUILD_CONFIG`           | Controls which clients get automated version bumps              |

**The bootstrap script** (`scripts/bootstrapWhitelabel.ts`):

1. Validates required env vars: `CLIENT_ID`, `ENVIRONMENT`, `CLIENT_KEY`
2. Renames project via `react-native-rename` with bundle ID from `getBundleId()` (format: `com.{namespace}.{clientId}.{environment}`)
3. Copies client assets using `assets/copy-config.json` template rules (icons → Xcode/Android, google-services.json → Android)
4. Runs optional client-specific scripts from `scripts/{CLIENT_ID}/index.ts` if they exist
5. Configures app links via `configureLinks()`
6. Generates `.env` with client credentials

**Asset copy config:** `assets/copy-config.json` defines file mapping rules. It copies from `assets/<client>/<env>/` (with fallback to `assets/<client>/shared/`) into iOS/Android project directories.

**Environment matrix:** Each client can have some or all of: `dev`, `staging`, `sandbox`, `prod`. Not all clients support all envs (e.g., bwell-employees has no sandbox, bwell-preview has no staging). Validation rules in GH Actions workflows enforce this.

### Adding a New Client — Checklist (derived from PRs #276, #291, #298, #310, #338)

Every new client PR follows this pattern:

1. **`assets/<client-id>/`** — create directory tree:

   - `shared/icons/AppIcon.appiconset/` — iOS icons (all sizes) + `Contents.json`
   - `shared/icons/res/` — Android adaptive icons (`mipmap-*dpi/`, `drawable/`, `values/ic_launcher_background.xml`)
   - `shared/icons/ic_launcher-playstore.png` — 512x512
   - `<env>/google-services.json` — one per environment (staging, sandbox, prod)

2. **`bitrise.yml`** — add workflows:

   - `<client>-base-env-setup` — sets `CLIENT_ID: <client-id>`
   - Per-env workflow (e.g. `<client>-staging`, `<client>-prod`) — inherits base, adds CLIENT_KEY, ENVIRONMENT, BUNDLE_ID, BUILD_VERSION, and optionally WEB_URL, PROJECT_NAME, PASSKEY_DOMAIN, BUNDLE_ID_ORG_NAMESPACE

3. **`bitrise.yml` → pipelines/stages** — register each workflow in the appropriate stage:

   - `staging-build` stage → `<client>-staging` with `run_if: '{{enveq "CLIENT_VAR" "true"}}'`
   - `sandbox-build` stage → `<client>-sandbox` (same pattern)
   - `prod-build` stage → `<client>-prod`

4. **`.github/workflows/build-clients-lower-environments.yml`** — add:

   - Input boolean under `on.workflow_dispatch.inputs`
   - Env mapping in the Bitrise trigger payload: `{"mapped_to":"CLIENT_VAR","value":"${{github.event.inputs.client-name}}","is_expand":false}`
   - Optional validation rule (if client doesn't support certain envs)

5. **`.github/workflows/build-clients-production.yml`** — same pattern as above for prod trigger

6. **`scripts/utils/shared.ts`** — add to `CLIENT_BUILD_CONFIG` object for automated version bumps

7. **`assets/copy-config.json`** — verify existing copy rules handle the new client (usually no change needed — rules use `{clientId}` interpolation). If the new client has a non-standard asset layout, add rules here.

8. **`scripts/<client-id>/index.ts`** (optional) — only needed if client requires custom setup logic beyond standard bootstrap

9. **External prerequisites** (not in codebase):
   - Firebase project per environment → download `google-services.json`
   - App Store Connect / Google Play Console app entries
   - CLIENT_KEY from admin tools (dev/staging/prod)
   - Bundle ID decided and registered

**Reference PRs:**

- Simple prod-only addition: PR #338 (wellsense-prod)
- Full staging+sandbox: PR #298 (wellsense staging+sandbox)
- Full new client: PR #276 (bwell-employees), PR #291 (bwell-payer), PR #310 (bwell-preview)

### Updating em-mobile-platform (React Native Upgrade)

Upgrading React Native is a major operation touching native iOS/Android configs.

**Process (derived from PR #286 — RN 0.75.1 → 0.79.2):**

1. **Use the upgrade helper:** `https://react-native-community.github.io/upgrade-helper/?from=<current>&to=<target>`
2. Apply diff changes across:
   - `package.json` — RN version + dependency updates
   - `android/` — Gradle config, build files, manifests
   - `ios/` — Xcode project, Podfile, build settings
   - Root configs — Metro, Babel, etc.
3. `yarn` + `cd ios && pod install`
4. Test on both platforms
5. Verify Bitrise builds succeed

**Key risk:** native code changes can break the bootstrap/rename script. PR #310 noted removing `fixAppDelegateModuleName` after a `react-native-rename` update. Always test bootstrap after RN upgrades.

### CI/CD Pipeline

```
GitHub Actions (trigger)
  → Bitrise API (build)
    → pipeline: build-<env>-clients
      → stage: <env>-build
        → workflows: <client>-<env> (conditional via run_if)
          → bootstrapWhitelabel (rename + icons)
          → build (iOS + Android)
          → release (TestFlight / Play Console)
```

**Version management:** `scripts/bumpVersion.ts` handles automated version bumps. `CLIENT_BUILD_CONFIG` in `scripts/utils/shared.ts` controls which clients participate.

### Key Files Quick Reference

| File                                                                   | Repo               | Purpose                                                     |
| ---------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------- |
| `App.tsx`                                                              | em-mobile-platform | Main entry, Composite + native modules                      |
| `package.json`                                                         | em-mobile-platform | `@icanbwell/composite` version                              |
| `bitrise.yml`                                                          | em-mobile-platform | CI/CD build config                                          |
| `.env` / `.env.example`                                                | em-mobile-platform | CLIENT_KEY, ENVIRONMENT                                     |
| `scripts/bootstrapWhitelabel.ts`                                       | em-mobile-platform | White-label setup (rename + icons)                          |
| `scripts/utils/shared.ts`                                              | em-mobile-platform | CLIENT_BUILD_CONFIG, version utils                          |
| `.github/workflows/build-clients-*.yml`                                | em-mobile-platform | CI triggers                                                 |
| `assets/<client>/`                                                     | em-mobile-platform | Per-client icons + Firebase configs                         |
| `apps/composite/package.json`                                          | ui-platform        | `native-components` version (bump after mfe-toolkit merge!) |
| `apps/composite/src/app/embeddable/App.embeddable-loader.ts`           | ui-platform        | Dynamic script loader                                       |
| `apps/composite/project.json`                                          | ui-platform        | Build targets incl. `prod-local`                            |
| `libs/native-components/src/ComponentView/ComponentView.component.tsx` | mfe-toolkit        | WebView wrapper component                                   |
| `libs/native-components/src/ComponentView/htmlTemplate.ts`             | mfe-toolkit        | HTML injected into WebView                                  |
| `libs/native-plugins/src/definitions/`                                 | mfe-toolkit        | Plugin definitions                                          |
| `libs/native-bridge/`                                                  | mfe-toolkit        | Web-to-mobile bridge                                        |
