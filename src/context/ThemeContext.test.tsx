import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, renderHook, act, screen } from '@testing-library/react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { ThemeContextProvider, useTheme } from './ThemeContext';
import { getLocalData } from '../utils/localData.utils';
import { brandColors } from '../theme/brandColors';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeContextProvider>{children}</ThemeContextProvider>
);

beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
});

afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
});

describe('useTheme', () => {
    it('refuses to be used outside a ThemeContextProvider', () => {
        expect(() => renderHook(() => useTheme())).toThrow(
            'useTheme must be used within a ThemeProvider'
        );
    });

    it('starts in light mode when nothing has been persisted', () => {
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.isDarkMode).toBe(false);
    });

    it('restores a persisted dark-mode preference on mount', () => {
        localStorage.setItem('darkMode', 'true');

        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.isDarkMode).toBe(true);
    });

    it('restores a persisted light-mode preference on mount', () => {
        localStorage.setItem('darkMode', 'false');

        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current.isDarkMode).toBe(false);
    });

    it('toggles the mode and persists the new value', () => {
        const { result } = renderHook(() => useTheme(), { wrapper });

        act(() => result.current.toggleDarkMode());

        expect(result.current.isDarkMode).toBe(true);
        expect(getLocalData('darkMode')).toBe('true');

        act(() => result.current.toggleDarkMode());

        expect(result.current.isDarkMode).toBe(false);
        expect(getLocalData('darkMode')).toBe('false');
    });

    it('persists the initial light-mode default even before any toggle', () => {
        renderHook(() => useTheme(), { wrapper });

        expect(getLocalData('darkMode')).toBe('false');
    });

    it('mirrors the mode onto the body element so non-MUI CSS can follow it', () => {
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(document.body.classList.contains('dark-mode')).toBe(false);

        act(() => result.current.toggleDarkMode());
        expect(document.body.classList.contains('dark-mode')).toBe(true);

        act(() => result.current.toggleDarkMode());
        expect(document.body.classList.contains('dark-mode')).toBe(false);
    });

    it('applies the dark-mode body class on mount when dark mode was persisted', () => {
        localStorage.setItem('darkMode', 'true');

        renderHook(() => useTheme(), { wrapper });

        expect(document.body.classList.contains('dark-mode')).toBe(true);
    });
});

describe('ThemeContextProvider rendering', () => {
    it('renders its children', () => {
        render(
            <ThemeContextProvider>
                <span>child content</span>
            </ThemeContextProvider>
        );

        expect(screen.getByText('child content')).toBeInTheDocument();
    });

    it('supplies the brand primary color to descendants through the MUI theme', () => {
        let seen: string | undefined;
        const Probe = () => {
            // Reads the MUI theme the provider installed, not the ThemeContext value.
            seen = useMuiTheme().palette.primary.main;
            return null;
        };

        render(
            <ThemeContextProvider>
                <Probe />
            </ThemeContextProvider>
        );

        expect(seen).toBe(brandColors.blue);
    });

    it('switches the MUI palette mode to dark when dark mode was persisted', () => {
        localStorage.setItem('darkMode', 'true');
        let mode: string | undefined;
        let background: string | undefined;
        const Probe = () => {
            const muiTheme = useMuiTheme();
            mode = muiTheme.palette.mode;
            background = muiTheme.palette.background.default;
            return null;
        };

        render(
            <ThemeContextProvider>
                <Probe />
            </ThemeContextProvider>
        );

        expect(mode).toBe('dark');
        expect(background).toBe(brandColors.darkModeBackground);
    });
});
