# Creating a New Customer (Mobile Build Pipeline)

## Overview

Adding a new customer to the mobile build pipeline involves wiring up GitHub Actions → Bitrise workflows so the client can be built for staging, client-sandbox, and eventually production.

## Prerequisites

Before starting, gather:

| Item                           | Where to get it                                                                | Notes                                             |
| ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| CLIENT_ID                      | Decided by team                                                                | Hyphenated lowercase, e.g. `healthie-nevada`      |
| CLIENT_KEY (staging)           | `https://web-playground.staging.bwell.zone/admin-tools/client-key-list`        | Base64-encoded JSON with `r`, `env`, `kid`        |
| CLIENT_KEY (sandbox)           | `https://web-playground.client-sandbox.bwell.zone/admin-tools/client-key-list` | Same format                                       |
| google-services.json (per env) | Firebase Console — requires Help Desk ticket for access                        | One file per environment (staging, sandbox, prod) |
| App icons                      | Design team / customer                                                         | iOS AppIcon set + Android mipmap resources        |
| Apple App Store listing        | Victoria / App Store Connect                                                   | Provides Bundle ID, SKU, Apple ID                 |
| Google Play listing            | Victoria / Play Console                                                        | Android package name                              |

## Important Notes

### BUNDLE_ID_ORG_NAMESPACE

New customers use `bwell` (NOT `icanbwell`):

```yaml
BUNDLE_ID_ORG_NAMESPACE: bwell
```

This produces bundle IDs like `com.bwell.<clientid>.<environment>`.

The old `icanbwell` namespace is legacy for existing clients (bwell-demo, bwell-employees, etc.).

### google-services.json

To get `google-services.json` files for a new customer:

1. Create a **Help Desk ticket** requesting Firebase project access for the new client
2. They will ask for project names and Android package names. Naming convention:
   - Project names: `<client-id>-staging`, `<client-id>-sandbox`, `<client-id>-prod` (e.g. `healthie-nevada-staging`)
   - Android package names: `com.bwell.<clientid_no_hyphens>.<environment>` (e.g. `com.bwell.healthienevada.staging`, `com.bwell.healthienevada.prod`)
3. Once access is granted, download `google-services.json` from Firebase Console for each environment
4. Place files in `assets/<CLIENT_ID>/<environment>/google-services.json`

### CLIENT_KEY

The CLIENT_KEY is a base64-encoded JSON:

```json
{ "r": "<resource_id>", "env": "<environment>", "kid": "<key_id>" }
```

You can decode to verify: `echo "<key>" | base64 -d`

## Steps

### Step 1 — GitHub Actions Workflow

**File:** `.github/workflows/build-clients-lower-environments.yml`

1. Add boolean input under `workflow_dispatch.inputs`:

```yaml
<client-id>:
  type: boolean
  default: false
```

2. Add environment mapping in the `environments` array:

```json
{ "mapped_to": "<CLIENT_ENV_VAR>", "value": "${{github.event.inputs.<client-id>}}", "is_expand": false }
```

The `mapped_to` value is the client ID uppercased with hyphens replaced by underscores (e.g. `healthie-nevada` → `HEALTHIE_NEVADA`).

### Step 2 — Bitrise Workflows

**File:** `bitrise.yml`

Add 3 workflow blocks:

**a) Base env setup:**

```yaml
<client-id>-base-env-setup:
  envs:
    - opts:
        is_expand: false
      CLIENT_ID: <client-id>
```

**b) Staging workflow:**

```yaml
<client-id>-staging:
  before_run:
    - <client-id>-base-env-setup
  after_run:
    - initialize-and-build-and-release
  envs:
    - opts:
        is_expand: false
      CLIENT_KEY: <base64_staging_key>
    - opts:
        is_expand: false
      ENVIRONMENT: staging
    - opts:
        is_expand: false
      BUNDLE_ID_ORG_NAMESPACE: bwell
```

**c) Sandbox workflow:**

```yaml
<client-id>-sandbox:
  before_run:
    - <client-id>-base-env-setup
  after_run:
    - initialize-and-build-and-release
  envs:
    - opts:
        is_expand: false
      CLIENT_KEY: <base64_sandbox_key>
    - opts:
        is_expand: false
      ENVIRONMENT: sandbox
    - opts:
        is_expand: false
      BUNDLE_ID_ORG_NAMESPACE: bwell
    - opts:
        is_expand: false
      PASSKEY_DOMAIN: app.client-sandbox.icanbwell.com
```

### Step 3 — Register in Stages

**File:** `bitrise.yml` (bottom, under `stages:`)

Add to `staging-build.workflows`:

```yaml
- <client-id>-staging:
    run_if: '{{enveq "<CLIENT_ENV_VAR>" "true"}}'
```

Add to `sandbox-build.workflows`:

```yaml
- <client-id>-sandbox:
    run_if: '{{enveq "<CLIENT_ENV_VAR>" "true"}}'
```

### Step 4 — Assets Directory

Create:

```
assets/<client-id>/
├── staging/
│   └── google-services.json
├── sandbox/
│   └── google-services.json
└── shared/
    └── icons/
        ├── AppIcon.appiconset/   (iOS — multiple PNGs + Contents.json)
        ├── ic_launcher-playstore.png
        └── res/                   (Android)
            ├── drawable/
            │   └── ic_launcher_background.xml
            └── mipmap-*/
                ├── ic_launcher.png
                ├── ic_launcher_foreground.png
                └── ic_launcher_round.png
```

### Step 5 — Production (separate ticket, when ready)

Additional steps for prod:

1. Add to `.github/workflows/build-clients-production.yml`
2. Add `<client-id>-prod` workflow in `bitrise.yml` with `BUILD_VERSION`, Apple/Android signing secrets
3. Add to `scripts/utils/shared.ts` `CLIENT_BUILD_CONFIG` for version bumping
4. Upload signing credentials to Bitrise (Apple API Key `.p8`, Android keystore `.jks`)

## Bundle ID Auto-Generation

The system auto-generates bundle IDs via `scripts/utils/shared.ts`:

```
com.<namespace>.<clientid_no_hyphens>.<environment>
```

Example for `healthie-nevada` with `bwell` namespace:

- Staging: `com.bwell.healthienevada.staging`
- Sandbox: `com.bwell.healthienevada.sandbox`

## Reference PRs

- **PR #356** (ffbc24e) — Added `bwell-preview-public-prod` pipeline
- **PR #338** (84ac8d7) — Added `wellsense-prod`
- **PR #291** (599690e) — Added `bwell-payer` staging/sandbox

## Optional Workflow Env Vars

| Var              | Purpose                      | Default                              |
| ---------------- | ---------------------------- | ------------------------------------ |
| `PROJECT_NAME`   | Display name in app          | Derived from client ID + environment |
| `WEB_URL`        | Custom web domain            | None                                 |
| `PASSKEY_DOMAIN` | WebAuthn domain              | `app.<environment>.icanbwell.com`    |
| `BUNDLE_ID`      | Override full bundle ID      | Auto-generated                       |
| `PACKAGE_NAME`   | Split iOS/Android bundle IDs | Uses BUNDLE_ID                       |
