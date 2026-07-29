# Local Development Setup

> Also see: `em-mobile-platform/docs/GettingStarted.md`

## Prerequisites

- Node 22+ (check `.nvmrc`)
- Yarn 1.22.22
- NPM registry auth for @icanbwell (GitHub Packages)
- Xcode (iOS) / Android Studio (Android)
- All 3 repos cloned: mfe-toolkit, ui-platform, em-mobile-platform (run-locally.md Step 1b handles this)

## Step-by-step E2E Local Dev

### Repo 1: mfe-toolkit

#### 1a. Identify changed packages

Find every mfe-toolkit package that changed and that ui-platform or em-mobile-platform depends on:

```shell
git diff --name-only main...HEAD | grep "^libs/" | sed 's|libs/\([^/]*\)/.*|\1|' | sort -u
```

Common packages: `types`, `native-bridge`, `native-plugins`, `native-components`, `embeddable-core`.

#### 1b. Patch ComponentView for local dev

File: `libs/native-components/src/ComponentView/ComponentView.component.tsx`

1. Change loader script URL to local:
   ```javascript
   script: `http://localhost:4200/package/index.js`,
   ```
2. Change `baseUrl`:
   ```javascript
   baseUrl: `http://localhost:4200/`,
   ```
3. Set `originWhitelist` on WebView:
   ```javascript
   originWhitelist={['*']}
   ```
4. Enable WebView debugging:
   ```javascript
   webviewDebuggingEnabled={true}
   ```

#### 1c. Build & yalc push

For each changed package + native-components:

```shell
yarn nx run <package>:build --skip-nx-cache && yalc push dist/libs/<package>
```

For the full yalc workflow (first-time setup, resolutions, rebuild chain), see [workflows.md — Post-Change Yalc Workflow](workflows.md#post-change-yalc-workflow-mandatory).

### Repo 2: ui-platform

1. If mfe-toolkit packages changed, yalc add them.
2. Build composite locally:
   ```shell
   npx nx run composite:prod-local
   ```
   Serves at `localhost:4200`.

### Repo 3: em-mobile-platform

1. Yalc add any changed packages:
   ```shell
   yalc add @icanbwell/native-components && yarn
   ```
   Add others if needed (`native-plugins`, `native-bridge`, `types`).

## Platform: Android Emulator

1. Use `localhost` in ComponentView patches (not LAN IP).
2. `adb reverse tcp:4200 tcp:4200` — maps emulator's localhost to Mac's localhost.
3. Start: `yarn android` from `em-mobile-platform`

## Platform: Android Physical Device

1. Use detected LAN IP in ComponentView patches — see [physical-device.md](physical-device.md).
2. No `adb reverse` needed — device reaches Mac via LAN IP.
3. Start: `yarn android` from `em-mobile-platform`

## Platform: iOS Simulator

1. Ensure `webviewDebuggingEnabled={true}` in ComponentView.
2. Start: `yarn start` → press **I**

## Debugging

See [workflows.md — Debug WebView content](workflows.md#debug-webview-content).

## Cleanup (when dev is done)

See **run-locally.md Step 6** — revert ALL local dev changes before committing. Applies to all targets.
