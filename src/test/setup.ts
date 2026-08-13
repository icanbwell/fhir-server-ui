import { afterEach, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// @testing-library/react's own auto-cleanup only registers when it detects a global
// `afterEach` (i.e. Vitest's `globals: true`). This project keeps `globals` off so test
// files must explicitly import Vitest APIs, so cleanup is wired up here instead.
afterEach(() => {
    cleanup();
});
