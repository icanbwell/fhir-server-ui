declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

// Falls back to the build-time `import.meta.env` (populated by `yarn dev`/`yarn build`)
// so nothing changes for local development or a static build (e.g. an S3/CDN deploy).
// If you run this app in a container, have your entrypoint write a small script to
// public/env-config.js (loaded by index.html before the app bundle) that sets
// `window.__ENV__` from real environment variables - it overrides import.meta.env here,
// letting one built image be deployed unchanged across environments instead of
// rebuilding per environment. See docs/runtime-environment-config.md.
export const APP_ENV: Record<string, string | undefined> = {
  ...(import.meta.env as unknown as Record<string, string | undefined>),
  ...window.__ENV__,
};
