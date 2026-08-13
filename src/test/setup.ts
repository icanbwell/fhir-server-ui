import { afterEach, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock fetch globally to prevent EnvironmentContext.ts's module-level FhirApi.getVersion()
// call from failing in jsdom environment. This avoids unhandled rejections in test output.
vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('4.0.0', { status: 200 })));

// @testing-library/react's own auto-cleanup only registers when it detects a global
// `afterEach` (i.e. Vitest's `globals: true`). This project keeps `globals` off so test
// files must explicitly import Vitest APIs, so cleanup is wired up here instead.
afterEach(() => {
    cleanup();
});
