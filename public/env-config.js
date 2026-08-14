// Fallback only. A containerized deploy can regenerate this file at container start
// from real env vars (see docs/runtime-environment-config.md); keep this checked-in
// copy empty so window.__ENV__ existing (but contributing nothing) is the safe default
// for local dev and static builds. src/runtimeEnv.ts falls back to the build-time
// import.meta.env when a key is absent here.
window.__ENV__ = {};
