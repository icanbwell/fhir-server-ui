## fhir-server-ui

UI to display FHIR resources in a web browser

## Prerequisites

1. Docker Desktop: https://docs.docker.com/desktop/mac/install/
2. Node.js >= 24.2.0 (see `.nvmrc`)
3. [Corepack](https://nodejs.org/api/corepack.html) (ships with Node 16+)

## Local Development Setup

### macOS

1. Install [Homebrew](https://brew.sh/) if not already installed:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Install nvm:
   ```bash
   brew install nvm
   ```
3. Add the nvm shell integration into `~/.zshrc` as suggested by the install output, then restart your terminal
4. Install and use the correct Node version:
   ```bash
   nvm install
   nvm use
   ```
5. Enable Corepack (this activates the correct Yarn version from `packageManager` in package.json):
   ```bash
   corepack enable
   ```
6. Install dependencies:
   ```bash
   yarn install
   ```

Or simply run `make init` to perform all the above steps.

### Package Management (Yarn 4 PnP)

This project uses **Yarn 4** with [Plug'n'Play (PnP)](https://yarnpkg.com/features/pnp). There is no `node_modules/` directory — packages are stored as zip archives in Yarn's global cache and resolved at runtime via `.pnp.cjs`.

| Task | Command |
|------|---------|
| Add a dependency | `yarn add <package>` |
| Add a dev dependency | `yarn add -D <package>` |
| Remove a dependency | `yarn remove <package>` |
| Upgrade all packages | `make upgrade_packages` |
| Regenerate lockfile | `make update` |
| Run a binary | `yarn <binary>` (e.g., `yarn jest`, `yarn eslint`) |

> **Important:** All packages you `require()` or `import` must be explicitly listed in `package.json`. PnP enforces strict dependency resolution — packages cannot rely on hoisting from transitive dependencies. If you see a "Cannot find module" error at runtime, add the missing package as a direct dependency.

### Editor Setup

#### VS Code (recommended)

PnP requires editor configuration for Go to Definition, IntelliSense, and linting to work with packages stored in zip archives.

1. **Install the [ZipFS extension](https://marketplace.visualstudio.com/items?itemName=arcanis.vscode-zipfs)** — allows VS Code to open source files inside zip archives

2. **Generate the editor SDK** (one-time setup):
   ```bash
   yarn dlx @yarnpkg/sdks vscode
   ```

3. **Select the workspace TypeScript version:**
   - Open any `.ts` or `.tsx` file
   - `Cmd+Shift+P` → "TypeScript: Select TypeScript Version" → "Use Workspace Version"

4. **Reload the window:** `Cmd+Shift+P` → "Developer: Reload Window"

#### Other Editors

For WebStorm, Vim, Neovim, Emacs, etc., see the [Yarn Editor SDKs documentation](https://yarnpkg.com/getting-started/editor-sdks).

## Running FHIR Server UI

To run the FHIR Server UI in a local environment:
1. Run `make up` to start the server in Docker.
2. Access the UI at http://localhost:5051

## Stopping the Server

To stop the server:
1. Run `make down`.

## Common Developer Processes

### Linting

To check linting of the code:
```bash
make lint
```

### Running Tests

```bash
make tests
```

### Update Packages

To add a new package or update version of a package, edit `package.json` and then run `make update` to regenerate `yarn.lock`.

### Upgrade Packages

To upgrade all packages to their latest versions:
```bash
make upgrade_packages
```

### Generating Types & Components

To generate components:
```bash
make generate_components
```

To generate types:
```bash
make generate_types
```

## Terminal Warning
When running the application, you might encounter the following warning in the terminal `Failed to parse source map`.
This warning occurs because the `graphiql` package references a source map file (`graphiql.css.map`) that is not present in the package. Source maps are used by development tools to map minified code back to the original source code, which can be useful for debugging. However, the absence of this source map file does not affect the functionality of the application.
- **No Functional Impact**: The warning does not impact the behavior or performance of the application. It is safe to ignore.
- **Development Environment Only**: This issue is typically only present during development and does not affect production builds.
