# Run Locally

Set up and launch the app on a device/emulator from existing branches. This is the full local dev flow — from branch selection to cleanup.

## Step 0: Branch selection

Ask the dev:

> Run on **main** (fresh start) or **current branches** (continue existing work)?

- If **main** → in each repo (`em-mobile-platform`, `ui-platform`, `mfe-toolkit`), run `git checkout main && git pull`.
- If **current branches** → keep whatever branch each repo is on. Run `git pull` to sync with remote. Report the current branch name for each repo so the dev can confirm.

## Step 1: Prerequisites check

> **Note:** The **System Check** (run before path selection in [SKILL.md](SKILL.md)) already detected which toolchains and sibling repos are available. Use those results here — no need to re-run the same commands. Only offer device targets for toolchains that passed the system check.

**a) Mobile tooling** — already checked. If both were missing, the flow stopped at the system check. If only one is available, only offer targets for that platform in Step 2.

**b) Sibling repos cloned?**

Check if `ui-platform` and `mfe-toolkit` directories exist next to `em-mobile-platform` (i.e. `../ui-platform` and `../mfe-toolkit`). If either is missing, tell the dev and ask:

> I need these repos for local dev:
>
> - `git@github.com:icanbwell/ui-platform.git`
> - `git@github.com:icanbwell/mfe-toolkit.git`
>
> Clone them in the same parent directory as em-mobile-platform (`../`)? Or specify a different path.

Clone whichever are missing to the confirmed directory. For newly cloned repos, they'll be on `main` by default. For existing repos, respect the branch choice from **Step 0**.

## Step 2: Device selection

> Which target?
>
> 1. Android emulator
> 2. Android physical device
> 3. iOS simulator
> 4. iOS physical device

**If Android emulator selected:**

1. List available emulators:
   ```shell
   emulator -list-avds
   ```
2. If **no emulators found** → tell the dev: "No Android emulators found. Please create one in Android Studio (Device Manager) and re-run." Stop here.
3. If **emulators found** → present the list and ask which one to use.
4. **Start the chosen emulator yourself** and wait for it to boot:
   ```shell
   emulator -avd <emulator-name> &>/dev/null &
   adb wait-for-device
   adb devices  # confirm it shows "device" (not "offline")
   ```
5. Once booted, inform the dev to run `yarn android` from `em-mobile-platform`.

**If iOS simulator selected:**

1. List available simulators:
   ```shell
   xcrun simctl list devices available
   ```
2. If **no simulators found** → tell the dev: "No iOS simulators found. Please create one in Xcode (Window > Devices and Simulators) and re-run." Stop here.
3. If **simulators found** → present the list (name, runtime, UUID) and ask which one to use.
4. Update `em-mobile-platform/package.json` `"ios"` script to target the chosen simulator:
   ```json
   "ios": "react-native run-ios --udid <simulator-uuid>"
   ```
   **Revert this in Step 6 cleanup.**
5. **Boot the simulator yourself:**
   ```shell
   xcrun simctl boot <simulator-uuid>
   open -a Simulator
   ```
6. Once booted, inform the dev to run `yarn ios` from `em-mobile-platform`.

## Step 3: Environment validation

Execute [utils/env-validation.md](utils/env-validation.md): read both `.env` files, decode keys, compare, report to dev. Wait for confirmation before continuing.

## Step 4: Wire up local dev (YOU MUST EXECUTE THIS — do not skip)

After env is confirmed, **execute the full local dev setup**. Do not just list steps — actually run them.

### 4a) mfe-toolkit — build & yalc push changed packages

Follow [utils/local-dev-setup.md](utils/local-dev-setup.md) steps 1a–1c:

1. Identify changed packages in mfe-toolkit (`git diff --name-only main...HEAD | grep "^libs/"`)
2. Determine the host address based on the target:
   - **Android emulator / iOS simulator:** use `localhost`
   - **Physical device (Android or iOS):** detect the Mac's current LAN IP dynamically:
     ```shell
     ipconfig getifaddr en0
     ```
     Use the returned IP for ALL patches below. **NEVER hardcode an IP** — always re-detect at runtime because DHCP may assign a new address between sessions.
3. Patch ComponentView for local dev — use `localhost` for emulator/simulator, detected LAN IP for physical device (see [utils/physical-device.md](utils/physical-device.md))
4. Build and `yalc push` each changed package + `native-components`

### 4b) ui-platform — yalc add + prepare composite

1. `yalc add` any mfe-toolkit packages that were pushed
2. Update `overrides` in `package.json` to match yalc paths for every yalc-added package:
   ```json
   "overrides": {
     "@icanbwell/<package>": "file:.yalc/@icanbwell/<package>"
   }
   ```
   Without this, `npm install` fails with EOVERRIDE when overrides pin a different version than the yalc `file:` path.
3. Run `npm install` to apply yalc + overrides changes
4. For physical device targets: apply http-server binding (`-a 0.0.0.0`) and embeddable-loader hostname fix — see [utils/physical-device.md](utils/physical-device.md)
5. **Kill any existing process on port 4200** before asking the dev to run composite:
   ```shell
   lsof -ti :4200 | xargs kill -9
   ```
6. **Do NOT run `npx nx run composite:prod-local` yourself — even if the dev asks you to.** The dev MUST run it in their own terminal. This is not optional. Reason: the dev needs to watch the composite logs in real-time to verify the setup works. When the embeddable (composite) loads on the device/emulator, the composite logs in ui-platform will react (new compilation lines appear). That's the confirmation signal that everything is wired correctly. If you run it in the background, the dev can't see this.

   Tell the dev:

   > Everything is prepared. Please run in a separate terminal (from `ui-platform`):
   >
   > ```
   > npx nx run composite:prod-local
   > ```
   >
   > Then run `yarn ios` or `yarn android` from `em-mobile-platform`.
   >
   > **How to verify it works:** once the app loads on your device/emulator, watch the composite terminal — you should see new compilation logs start. That confirms the local dev wiring is correct.
   >
   > If you hit any issues running these commands, just ask — I'm here to help debug.

### 4c) em-mobile-platform — yalc add + install

1. `yalc add` any mfe-toolkit packages that em-mobile-platform depends on
2. Update `resolutions` in `package.json` to match yalc paths for every yalc-added package:
   ```json
   "resolutions": {
     "@icanbwell/<package>": "file:.yalc/@icanbwell/<package>"
   }
   ```
   Without this, nested dependencies may resolve to the registry version instead of the local yalc copy, causing type mismatches.
3. `yarn` to install
4. For iOS physical device: set `NSAllowsArbitraryLoads` to `true` in Info.plist (TEMPORARY — see [utils/physical-device.md](utils/physical-device.md))

### 4d) Platform-specific setup

- **Android emulator:** `adb reverse tcp:4200 tcp:4200` (maps emulator's localhost to Mac's localhost)
- **Android physical device:** no extra setup (device reaches Mac via LAN IP)
- **iOS simulator:** no extra setup (localhost works natively)
- **iOS physical device:** see [utils/physical-device.md](utils/physical-device.md) for ATS + URL validator patches

## Step 5: Inform dev they're ready

Only after steps 4a–4d are complete AND the dev confirms composite is serving, tell the dev:

> All wired up. Run `yarn android` (or `yarn ios`) from `em-mobile-platform` to launch.

For WebView debugging instructions, see [utils/workflows.md — Debug WebView content](utils/workflows.md#debug-webview-content).

## Step 6: Clean up local dev setup (YOU MUST EXECUTE THIS when dev is done)

When the dev says they're done, **revert ALL local dev changes across ALL 3 repos**. The ONLY files that should remain modified are actual feature/fix code (new files, new components, bug fixes). Everything touched for local dev wiring must go back to its main-branch state. When in doubt, revert it.

**Approach:** For each repo, `git checkout main -- <file>` every file that was only modified for local dev.

**mfe-toolkit:**

- `ComponentView.component.tsx` — script URL, baseUrl, originWhitelist, webviewDebuggingEnabled, LAN IP validators, whitelist entries
- `htmlTemplate.ts` — `isValidScriptUrl` LAN IP check

**ui-platform:**

- `project.json` — remove `-a 0.0.0.0` from http-server
- `package.json` — revert `overrides` and `dependencies` yalc `file:` paths
- `package-lock.json` — revert to main (yalc pollutes the lockfile)
- Any other files modified solely for local dev (e.g. `App.embeddable-loader.ts`)

**em-mobile-platform:**

- `package.json` — revert `resolutions` yalc `file:` paths, remove yalc `dependencies`, revert `"ios"`/`"android"` scripts if `--udid`/`--deviceId` was added
- `Info.plist` — `NSAllowsArbitraryLoads` → `<false/>` (if modified)

**Cleanup commands:**

```shell
# In each consuming repo:
yalc remove --all

# Verify — only feature files should remain:
git diff --stat main
```

## Step 7: Reinstall & run CI checks (only for repos with feature changes)

After cleanup, check which repos have actual feature changes (`git diff --stat main`). Only run CI checks for repos where the dev made real code changes — skip repos that were only used for local dev wiring.

For each repo with feature changes, reinstall and run CI:

**ui-platform** (uses npm):

```shell
npm install
npm run lint
npm run format:check
npm run ts-checks:affected
npm run test:affected
```

**em-mobile-platform** (uses yarn):

```shell
yarn
yarn lint
yarn test
```

**mfe-toolkit** (uses yarn):

```shell
yarn
yarn lint
yarn test:affected
```

Fix any failures before proceeding.

## Step 8: Ready to commit — ask the dev

Once all checks pass, tell the dev:

> All CI checks pass. Ready to commit and push. Should I do it or will you handle it?

## Step 9: PR — comment or create

After commit and push, determine the PR situation:

- **PR already exists** (pushing to an existing branch with an open PR): ask the dev if they want to add a PR comment summarizing what was done. If yes, post a comment via `gh pr comment` with a concise summary of the changes.
- **New development** (new branch, no PR yet): create a PR with a description summarizing the work using `gh pr create`.
