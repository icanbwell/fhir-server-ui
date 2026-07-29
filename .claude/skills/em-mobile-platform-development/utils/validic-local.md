# Validic Local Development

Debug the Connect Devices / Health Connect / HealthKit integration locally.

## Prerequisites

1. **Allowlisted client** — only these clients get Validic linked:

   - `bwell-preview` (any environment)
   - `bwell-demo` (`dev` only)

2. **NPM registry** — `.npmrc` must have the `@validic-mobile` artifactory token (already committed to repo)

3. **VALIDIC_ORG_ID** — add to `.env`:
   ```
   VALIDIC_ORG_ID="5cc9f4df2141970001ea1fe3"
   ```

## Bootstrap

The bootstrap script expects env vars in `process.env`, NOT from `.env` (no dotenv). Pass them inline:

```shell
CLIENT_ID=bwell-demo \
ENVIRONMENT=dev \
CLIENT_KEY=eyJyIjoiY2Zoa2h3ODZvNHdoNWFiOW9kaHgiLCJlbnYiOiJkZXYiLCJraWQiOiJid2VsbF9kZW1vLWRldiJ9 \
BUNDLE_ID=com.icanbwell.members.dev \
yarn bootstrap-whitelabel
```

### Known issues

| Issue                                           | Fix                                                                                                                                                                                           |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `envman` not found                              | Create a no-op shim: `mkdir -p ~/.local/bin && printf '#!/bin/sh\nexit 0\n' > ~/.local/bin/envman && chmod +x ~/.local/bin/envman` and prepend `PATH="$HOME/.local/bin:$PATH"` to the command |
| `.env` has leading whitespace after bootstrap   | The bootstrap `.env` template adds indentation. Manually trim or overwrite the `.env` with no leading spaces — `dotenv` can't parse indented keys                                             |
| Wrong bundle ID (`com.icanbwell.bwelldemo.dev`) | Pass `BUNDLE_ID=com.icanbwell.members.dev` explicitly — this is the ID registered in the Apple Developer portal                                                                               |

## iOS — Pod Install (CRITICAL)

`pod install` runs from `ios/` directory. The `react-native.config.js` uses `require('dotenv').config()` which looks for `.env` in CWD — since CWD is `ios/`, it can't find `../.env`. Result: `CLIENT_ID` is undefined, autolinking treats the client as non-allowlisted, and Validic pods are EXCLUDED.

**Fix:** export the vars before pod install:

```shell
CLIENT_ID=bwell-demo ENVIRONMENT=dev pod install
```

Or from the project root:

```shell
cd ios && CLIENT_ID=bwell-demo ENVIRONMENT=dev pod install && cd ..
```

### Verify Validic pods are linked

After `pod install`, confirm the Auto-linking output includes Validic:

```
Auto-linking React Native modules for target `bwelldemodev`: ..., react-native-inform-core, react-native-inform-healthkit, ...
```

If `inform-core` / `inform-healthkit` are missing, the CLIENT_ID wasn't set correctly.

## Android

- `minSdkVersion` is 29 (Android 10+) — required by Validic SDK
- `react-native-inform-healthconnect` requires the **Health Connect** app installed on device/emulator (package: `com.google.android.apps.healthdata`)
- No special env var export needed for Android — Gradle doesn't use `react-native.config.js` for native linking

## Running

```shell
# iOS simulator (compiles HealthKit but no real data)
yarn ios --simulator="iPhone 17 Pro"

# iOS physical device (full HealthKit data)
yarn ios --device

# Android
yarn android
```

## Physical device notes

- **iOS:** HealthKit APIs compile on simulator but return no data. To test actual health record sync, use a physical iPhone with Health app data.
- **Android:** Health Connect emulator support is limited. Best tested on a physical device running Android 14+.
- **Safari debugging:** Enable Web Inspector on iPhone (Settings > Safari > Advanced), then Safari > Develop > [device] on Mac.

## Allowlist location (3 places, must stay in sync)

| File                                          | Format                                       |
| --------------------------------------------- | -------------------------------------------- |
| `scripts/utils/healthPermissionsAllowlist.ts` | TypeScript — source of truth                 |
| `react-native.config.js`                      | Duplicated JS array (can't import .ts)       |
| `App.tsx`                                     | Imports from `healthPermissionsAllowlist.ts` |
