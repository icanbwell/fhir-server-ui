---
name: em-mobile-platform-development
description: Mobile dev guide for em-mobile-platform. Use when working on mobile features, plugins, local dev setup, or debugging across mfe-toolkit/ui-platform/em-mobile-platform.
when_to_use: >
  Trigger when: "run the app", "set up local dev", "debug on device", "launch emulator/simulator",
  "wire up yalc", "run on physical device", "start mobile dev", "ticket DCON-*", "plan a ticket",
  "how does X work", "ask about mobile", "question about the app", "how to add a client",
  working with ComponentView, native-components, native-plugins, or composite.
argument-hint: '[run | ticket <TICKET-KEY> | ask <QUESTION>]'
effort: high
allowed-tools:
  - Bash(git *)
  - Bash(yarn *)
  - Bash(npm *)
  - Bash(npx *)
  - Bash(yalc *)
  - Bash(adb *)
  - Bash(emulator *)
  - Bash(xcrun *)
  - Bash(xcodebuild *)
  - Bash(ipconfig *)
  - Bash(lsof *)
  - Bash(open *)
  - Bash(ls *)
  - Bash(cd *)
  - Bash(cat *)
  - Bash(echo *)
  - Bash(grep *)
  - Bash(kill *)
  - Read
  - Edit
  - Glob
  - Grep
---

# Embeddables Mobile Platform Development

## Environment (auto-detected)

```!
PROJECT_ROOT="$(cd "${CLAUDE_SKILL_DIR}/../../.." && pwd)"
PARENT_DIR="$(dirname "$PROJECT_ROOT")"
echo "=== Xcode ===" && (xcodebuild -version 2>&1 | head -2 || echo "NOT FOUND")
echo "=== Android SDK ===" && ([ -d ~/Library/Android/sdk ] && echo "SDK: found" || echo "SDK: MISSING") && (which emulator 2>/dev/null && echo "emulator: found" || echo "emulator: MISSING") && (which adb 2>/dev/null && echo "adb: found" || echo "adb: MISSING")
echo "=== Ruby ===" && (ruby -v 2>&1 || echo "NOT FOUND")
echo "=== Sibling repos ===" && ([ -d "$PARENT_DIR/ui-platform" ] && echo "ui-platform: found" || echo "ui-platform: MISSING") && ([ -d "$PARENT_DIR/mfe-toolkit" ] && echo "mfe-toolkit: found" || echo "mfe-toolkit: MISSING")
```

## On Invocation

**Parse the environment block above** and present findings as a status table:

> | Component   | Status                          |
> | ----------- | ------------------------------- |
> | Xcode       | ✅ / ❌ (version or "missing")  |
> | Android SDK | ✅ / ❌ (emulator + adb status) |
> | Ruby        | ✅ / ❌ (version or "missing")  |
> | ui-platform | ✅ / ❌                         |
> | mfe-toolkit | ✅ / ❌                         |

**Important: No check result is a blocker for using this skill.** The skill can answer questions, plan tickets, and explore architecture regardless of what's installed. Missing tools only matter when you actually need to build or run the app.

- If **Xcode and/or Android SDK are missing** → note which are missing, but reassure the dev: _"This won't block us — I can help with questions, planning, and code exploration right now. We'll install these together when you're ready to build and run the app."_
- If **Ruby is missing or < 3.2.0** → note it's only needed for iOS (CocoaPods / `bundle install`). _"Not needed right now — we can set it up later when you do iOS work."_
- If **sibling repos (ui-platform / mfe-toolkit) are missing** from the parent directory → ask the dev: _"I don't see `<repo>` next to em-mobile-platform. Do you have it cloned elsewhere?"_
  - If **yes** → ask for the path so you can reference it.
  - If **no** → reassure: _"No problem — we can clone it when needed. I'll guide you through it."_
  - When a dev's request requires a missing sibling repo (e.g., running locally, yalc linking, editing shared components), advise cloning it into the same parent directory as em-mobile-platform and walk the dev through it.

**Then route based on `$ARGUMENTS`:**

- `run` → jump to [run-locally.md](run-locally.md)
- `ticket <KEY>` or a ticket key like `DCON-1234` → jump to [ticket-based-development.md](ticket-based-development.md)
- `ask <question>` or a question about mobile dev → jump to [ask-question.md](ask-question.md)
- Other text → infer intent; if unclear, show the prompt below

**If no arguments or unclear intent**, show:

> Pick one:
>
> 1. **Run locally** — pull main or your existing branches of mfe-toolkit, ui-platform, em-mobile-platform and launch the app right away
> 2. **Ticket first** — provide a Jira ticket, I'll build an implementation plan (posted as a Jira comment + saved as an `.md` plan file for me to follow step-by-step)
> 3. **Ask a question** — ask anything about mobile development (architecture, how things work, how to add a client, debugging, deployment, etc.) — I'll use my deep knowledge of all 3 repos to answer

## Flow Resumption (applies to ALL paths)

When the dev hits an issue mid-flow (build failure, disk space, permission error, etc.):

1. **Remember the current step** — note which step was in progress or which question was pending before the issue surfaced.
2. **Fix the issue** — help the dev resolve it.
3. **Resume the flow** — once fixed, explicitly tell the dev which step you're returning to and continue from there. If the fix invalidated a prior step (e.g. emulator wipe clears `adb reverse`), re-run that step before continuing.

> Example: Dev is at Step 4d, emulator runs out of space. After wiping the emulator, re-run `adb reverse` (Step 4d) before telling the dev to run `yarn android` (Step 5).

**Never silently skip back to where you were.** Always say: _"Issue resolved. Resuming from Step X."_

## Reference Files

Utility references live in `utils/`:

- [Ask a Question](ask-question.md) — free-form Q&A flow for mobile dev questions
- [Architecture](utils/architecture.md) — 3-repo dependency chain, deep architecture, new-client checklist, RN upgrade guide
- [Env Validation](utils/env-validation.md) — CLIENT_KEY / NX_CLIENT_KEY decode, compare, swap
- [Local Dev Setup](utils/local-dev-setup.md) — E2E local dev across all 3 repos, simulator setup
- [Physical Device Setup](utils/physical-device.md) — LAN IP config, ATS, URL validators, revert checklist
- [Workflows & Reference](utils/workflows.md) — deployment chain, yalc, common workflows, build commands
- [Create New Customer](utils/create-new-customer.md) — full pipeline setup for a new client (GitHub Actions, Bitrise, Firebase, assets)
- [Validic Local Dev](utils/validic-local.md) — set up and debug Connect Devices / HealthKit / Health Connect locally (allowlist, pod install gotcha, physical device)
