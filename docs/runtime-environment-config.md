# Runtime environment configuration

By default, `REACT_APP_*` config (FHIR server URL, auth provider settings, etc.) is
baked into the JS bundle at `yarn build` time via Vite's `import.meta.env` - the
standard approach, and what you want for a static build deployed to something like
S3/CloudFront. This doc covers an optional second path: reading that same config at
container **start** instead, so one built image can be deployed unchanged across
multiple environments rather than rebuilt per environment.

## Where it lives

| Concern | File |
|---|---|
| Runtime config read, with build-time fallback | `src/runtimeEnv.ts` |
| Script tag loading the config before the app bundle | `index.html` |
| Checked-in empty-object fallback | `public/env-config.js` |

## How it works

All app code reads config through `APP_ENV` (`src/runtimeEnv.ts`) instead of
`import.meta.env` directly:

```ts
export const APP_ENV: Record<string, string> = {
  ...(import.meta.env as unknown as Record<string, string>),
  ...window.__ENV__,
};
```

`window.__ENV__` is populated by `public/env-config.js`, loaded via a `<script>` tag
in `index.html` before the app bundle. The checked-in copy just sets
`window.__ENV__ = {}` - contributing nothing, so `APP_ENV` falls back entirely to the
build-time `import.meta.env` values. That's the fallback used by `yarn dev`, and by
any static build (e.g. served from S3/CDN) that never touches this file after `yarn
build` runs.

## Using it in a container

If you deploy this app in a container, have your entrypoint (something that runs
before your web server starts) overwrite `/usr/share/nginx/html/env-config.js` (or
wherever your build output is served from) with the real values from that
container's environment, for example:

```sh
#!/bin/sh
OUT=/usr/share/nginx/html/env-config.js
{
  printf 'window.__ENV__ = {\n'
  env | grep '^REACT_APP_' | while IFS='=' read -r key val; do
    printf '  "%s": %s,\n' "$key" "$(printf '%s' "$val" | jq -Rs .)"
  done
  printf '};\n'
} > "$OUT"
```

(Using `jq -Rs .` to JSON-encode each value is deliberate - a hand-rolled string
escaper is easy to get wrong for values containing quotes or backslashes, e.g. some
client keys/tokens.)

With that in place, you can build one image without any environment-specific
`REACT_APP_*` values at all, and supply them however your deployment tooling passes
environment variables to the container (plain `docker run -e`, a Kubernetes
Deployment's `env:`, etc.) - the same image works for every environment.
