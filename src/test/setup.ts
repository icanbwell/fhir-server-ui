import { afterEach, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock fetch globally to suppress the unhandled rejection from EnvironmentContext.ts's
// module-level FhirApi.getVersion() call, which fails in jsdom when REACT_APP_FHIR_SERVER_URL
// is undefined. This is narrowly scoped: only provides a minimal response to prevent URL
// construction failures during module initialization. Individual tests that need actual
// fetch behavior or streaming must provide their own explicit mocks (as already done with
// BaseApi.prototype.getData via vi.spyOn).
vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"version":"4.0.0"}', { status: 200 })));

// @testing-library/react's own auto-cleanup only registers when it detects a global
// `afterEach` (i.e. Vitest's `globals: true`). This project keeps `globals` off so test
// files must explicitly import Vitest APIs, so cleanup is wired up here instead.
afterEach(() => {
    cleanup();
});
