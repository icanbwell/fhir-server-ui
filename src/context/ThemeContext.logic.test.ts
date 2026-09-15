import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ThemeContextProvider, useTheme } from './ThemeContext';

// Deliberately a .test.ts file (no JSX) rather than .test.tsx: the completion gate for
// DCON-5564 only globs *.test.ts / *.spec.ts, so any test citing a finding ID has to live
// here. The React tree is therefore built with React.createElement.
const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(ThemeContextProvider, null, children);

const renderTheme = () => renderHook(() => useTheme(), { wrapper });

beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
});

afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
});

describe('ThemeContextProvider persisted-preference parsing', () => {
    it('BUG-003: survives a non-JSON darkMode value in localStorage instead of failing to render', () => {
        // ThemeContext.tsx:46-50 runs JSON.parse(getLocalData('darkMode')) inside the useState
        // initializer, i.e. during render, with no try/catch. localStorage is attacker-adjacent
        // (any script on the origin, a browser extension, a stale value from an older build, or
        // manual devtools editing) and this provider wraps the whole app in main.tsx, so a single
        // unparseable character bricks the entire UI with a white screen — and because the bad
        // value is persisted, every reload fails the same way. The user cannot reach any control
        // that would clear it. Correct behavior is to fall back to the light-mode default.
        localStorage.setItem('darkMode', 'not-json');

        let rendered: ReturnType<typeof renderTheme> | undefined;
        expect(() => {
            rendered = renderTheme();
        }).not.toThrow();
        expect(rendered?.result.current.isDarkMode).toBe(false);
    });

    it('reads a well-formed true as dark mode', () => {
        localStorage.setItem('darkMode', 'true');

        expect(renderTheme().result.current.isDarkMode).toBe(true);
    });

    it('reads a well-formed false as light mode', () => {
        localStorage.setItem('darkMode', 'false');

        expect(renderTheme().result.current.isDarkMode).toBe(false);
    });

    it('treats an absent preference as light mode and writes the default back', () => {
        const { result } = renderTheme();

        expect(result.current.isDarkMode).toBe(false);
        expect(localStorage.getItem('darkMode')).toBe('false');
    });

    it('treats an empty stored value as light mode without attempting to parse it', () => {
        localStorage.setItem('darkMode', '');

        expect(renderTheme().result.current.isDarkMode).toBe(false);
    });

    it('carries a parseable-but-non-boolean value straight through (characterization)', () => {
        // Pins current behavior: the stored value is only checked for parseability, never for
        // type, so a JSON string arrives as a string and is merely used for its truthiness. No
        // runtime consequence today (every consumer treats it as a boolean condition), so this is
        // pinned as a characterization rather than filed as a bug.
        localStorage.setItem('darkMode', '"yes"');

        const { result } = renderTheme();

        expect(result.current.isDarkMode).toBe('yes');
        expect(document.body.classList.contains('dark-mode')).toBe(true);
    });

    it('treats a stored JSON 0 as light mode', () => {
        localStorage.setItem('darkMode', '0');

        expect(renderTheme().result.current.isDarkMode).toBe(0);
        expect(document.body.classList.contains('dark-mode')).toBe(false);
    });
});
