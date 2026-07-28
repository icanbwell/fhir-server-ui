# Ask a Question About Mobile Development

Free-form Q&A mode. The dev asks anything about em-mobile-platform, mfe-toolkit, or ui-platform — architecture, patterns, how things work, how to do X, debugging, deployment, etc.

## How to Answer

1. **Start from the architecture map** — read [utils/architecture.md](utils/architecture.md) for the conceptual overview and key file pointers.
2. **Read actual source when needed** — architecture.md is a map, not a substitute for code. If the question requires specifics (current versions, exact function signatures, config values), grep/read the actual files across all 3 repos.
3. **Cross-repo awareness** — many questions span repos. Always think: does this touch mfe-toolkit, ui-platform, em-mobile-platform, or multiple?
4. **Be precise** — include file paths, line numbers, function names. Don't give vague answers when the code is right there.
5. **Link to related flows** — if the answer naturally leads to "and here's how to do it", point to the relevant skill flow (run-locally, ticket-based-development).

## Knowledge Sources (in order of priority)

1. **Live codebase** — read files in all 3 repos (`em-mobile-platform`, `../ui-platform`, `../mfe-toolkit`). This is always the source of truth.
2. **Architecture doc** — [utils/architecture.md](utils/architecture.md) for conceptual understanding, key file reference, and documented patterns (new client checklist, plugin system, WebView bridge, CI/CD).
3. **Other skill utils** — reference as needed:
   - [utils/env-validation.md](utils/env-validation.md) — CLIENT_KEY mechanics
   - [utils/local-dev-setup.md](utils/local-dev-setup.md) — local dev wiring
   - [utils/physical-device.md](utils/physical-device.md) — physical device setup
   - [utils/workflows.md](utils/workflows.md) — deployment chain, yalc, build commands
4. **Confluence** — [Embeddables | Mobile App Development](https://icanbwell.atlassian.net/wiki/spaces/ATHD/pages/4238573641/Embeddables+Mobile+App+Development) for official documentation.

## Common Question Categories

### "How do I add a new client/white-label app?"

→ See **Adding a New Client — Checklist** in [utils/architecture.md](utils/architecture.md). Walk through each step with the dev, reading actual files to show current patterns.

### "How does the WebView bridge work?"

→ See **WebView Bridge Mechanism** and **ComponentView Internals** in architecture.md. Read `ComponentView.component.tsx` and `htmlTemplate.ts` for specifics.

### "How do I add a new native plugin/capability?"

→ See **Native Plugin System (End-to-End)** in architecture.md. Show existing plugin examples from `mfe-toolkit/libs/native-plugins/src/definitions/`.

### "How does deployment/CI work?"

→ See **CI/CD Pipeline** in architecture.md. Read `bitrise.yml` and GH Actions workflows for current state.

### "How do I upgrade React Native?"

→ See **Updating em-mobile-platform** in architecture.md.

### "What version of X are we on?"

→ Read the actual `package.json` files. Don't guess.

### "Why is X broken on device?"

→ Likely a bridge/ComponentView/env issue. Check: is composite serving? Is the WebView pointing to the right URL? Are native modules injected? Is the CLIENT_KEY valid? Use [utils/env-validation.md](utils/env-validation.md) and debugging steps from [utils/workflows.md](utils/workflows.md#debug-webview-content).

## Response Style

- Lead with a direct answer, then provide supporting detail
- Show relevant code snippets from actual files (not architecture.md paraphrases)
- If the question requires action, ask if they want to proceed — then route to the appropriate flow
- If you're unsure about something, say so and suggest where to check (Confluence, Slack, a specific file)
