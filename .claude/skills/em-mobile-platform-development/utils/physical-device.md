# iOS Physical Device Setup

A physical iPhone **cannot** reach `localhost` — it resolves to the phone itself. All three repos need patching.

## Loading chain (understand before patching)

```
ComponentView (mfe-toolkit)
  → injects HTML with <script src="http://<IP>:4200/package/index.js">
  → sets baseUrl="http://<IP>:4200/" on WebView
  → this makes window.location.hostname = <IP> inside the WebView

App.embeddable-loader.ts (ui-platform, bundled in package/index.js)
  → calls createEmbeddableLoader({ src: `http://${window.location.hostname}:4200/remote/embeddable.federated.js` })
  → window.location.hostname inherits from baseUrl, so resolves to <IP> on device, "localhost" on desktop

http-server (ui-platform prod-local)
  → serves dist/apps/composite on port 4200
  → must bind 0.0.0.0 so physical device can reach it over LAN
```

## 0. Prerequisites

- Get your Mac's LAN IP: `ipconfig getifaddr en0`
- Use this IP as `<YOUR_IP>` everywhere below
- **iPhone:** Settings > Safari > Advanced > Web Inspector → ON (required for Safari debugging)

## 1. mfe-toolkit — ComponentView + URL validators

File: `libs/native-components/src/ComponentView/ComponentView.component.tsx`

**a) Change URLs to LAN IP:**

```javascript
script: `http://<YOUR_IP>:4200/package/index.js`,
baseUrl: `http://<YOUR_IP>:4200/`,
```

**b) Set WebView props:**

```javascript
originWhitelist={['*']}
webviewDebuggingEnabled={true}
```

**c) Allow LAN IPs in URL validators (3 places):**

1. `SECONDARY_WEBVIEW_WHITELIST` array — add `'http://192.168.*:*'`
2. `isValidSecondaryWebviewUri` function — add `|| /^192\.168\./.test(parsed.hostname)` to the `http:` check
3. `htmlTemplate.ts` → `isValidScriptUrl` function — same: add `|| /^192\.168\./.test(parsed.hostname)` to the `http:` check

**d) Build and yalc push:**

```shell
yarn nx run native-components:build --skip-nx-cache && yalc push dist/libs/native-components
```

## 2. ui-platform — embeddable loader + http-server

### a) App.embeddable-loader.ts (PERMANENT FIX)

File: `apps/composite/src/app/embeddable/App.embeddable-loader.ts`

Change the dev-mode `src` from hardcoded `localhost` to dynamic hostname:

Before:

```typescript
: `http://localhost:4200/remote/embeddable.federated.js`,
```

After:

```typescript
: `http://${window.location.hostname || 'localhost'}:4200/remote/embeddable.federated.js`,
```

**Why this works:** ComponentView sets `baseUrl` on the WebView, which makes `window.location.hostname` resolve to `<YOUR_IP>` on the device and `localhost` on desktop. Both paths work from the same build.

**This change is safe to commit.** Do NOT revert.

### b) project.json — http-server binding (TEMPORARY)

File: `apps/composite/project.json` → `prod-local` target

Add `-a 0.0.0.0` to the http-server command:

```json
"http-server ../../dist/apps/composite -p 4200 -a 0.0.0.0 -o -c-1"
```

Without this, the server only listens on loopback and the device cannot reach it.

### c) Build composite:

```shell
npx nx run composite:prod-local
```

## 3. em-mobile-platform — ATS + yalc

### a) Info.plist (TEMPORARY)

File: `ios/EmMobilePlatform/Info.plist`

iOS ATS blocks HTTP to LAN IPs. Set:

```xml
<key>NSAllowsArbitraryLoads</key>
<true/>
```

### b) Yalc add + install:

```shell
yalc add @icanbwell/native-components && yarn
```

If other mfe-toolkit packages changed, add those too (see [local-dev-setup.md](local-dev-setup.md) step 1a).

### c) Run:

```shell
yarn start
```

Then press **I** for iOS.

## 4. Debug

Safari > Develop > [Your iPhone name] > select the WebView page

## Revert checklist (before committing)

| File                          | What to revert                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `ComponentView.component.tsx` | script URL, baseUrl, originWhitelist, webviewDebuggingEnabled                  |
| `ComponentView.component.tsx` | `isValidSecondaryWebviewUri` LAN IP check, `SECONDARY_WEBVIEW_WHITELIST` entry |
| `htmlTemplate.ts`             | `isValidScriptUrl` LAN IP check                                                |
| `project.json`                | remove `-a 0.0.0.0` from http-server                                           |
| `Info.plist`                  | `NSAllowsArbitraryLoads` → `<false/>`                                          |

**Do NOT revert:** `App.embeddable-loader.ts` — the `window.location.hostname` change is permanent and works for all contexts.
