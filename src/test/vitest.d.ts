import 'vitest';

interface JestAxeMatchers<R = unknown> {
    toHaveNoViolations(): R;
}

declare module 'vitest' {
    interface Assertion<T = unknown> extends JestAxeMatchers<T> {}
    interface AsymmetricMatchersContaining extends JestAxeMatchers {}
}
