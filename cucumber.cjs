// Scenarios tagged @requires-e2e-credentials drive the real client-credentials login form and
// need E2E_CLIENT_ID/E2E_CLIENT_SECRET for a real dev-environment token endpoint. Excluded by
// default so `yarn e2e` works out of the box with no secrets configured; opt in explicitly with
// CUCUMBER_TAGS='@requires-e2e-credentials' once those env vars are set.
const DEFAULT_TAGS = 'not @requires-e2e-credentials';

module.exports = {
    default: {
        paths: ['e2e/features/**/*.feature'],
        import: ['e2e/steps/**/*.ts', 'e2e/support/**/*.ts'],
        format: [process.env.CI ? 'progress' : 'progress-bar', 'html:e2e-report.html'],
        publishQuiet: true,
        tags: process.env.CUCUMBER_TAGS || DEFAULT_TAGS,
        worldParameters: {
            baseURL: process.env.E2E_BASE_URL || 'http://localhost:5051',
        },
        // A borderline-timing scenario gets one automatic retry in CI before counting as a
        // real failure; local runs stay retry-free so a genuine regression fails immediately.
        retry: process.env.CI ? 1 : 0,
    },
};
