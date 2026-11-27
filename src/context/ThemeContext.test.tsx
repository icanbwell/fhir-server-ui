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

    it('uses the contrast-checked dark primary and divider when dark mode was persisted', () => {
        localStorage.setItem('darkMode', 'true');
        let primary: string | undefined;
        let divider: string | undefined;
        const Probe = () => {
            const muiTheme = useMuiTheme();
            primary = muiTheme.palette.primary.main;
            divider = muiTheme.palette.divider;
            return null;
        };

        render(
            <ThemeContextProvider>
                <Probe />
            </ThemeContextProvider>
        );

        expect(primary).toBe(brandColors.darkModePrimary);
        expect(divider).toBe(brandColors.darkModeDivider);
    });

    it.each([
        ['light', false],
        ['dark', true],
    ])('uses an 8px base corner radius in %s mode', (_label, dark) => {
        localStorage.setItem('darkMode', JSON.stringify(dark));
        let radius: number | string | undefined;
        const Probe = () => {
            radius = useMuiTheme().shape.borderRadius;
            return null;
        };

        render(
            <ThemeContextProvider>
                <Probe />
            </ThemeContextProvider>
        );

        expect(radius).toBe(8);
    });

    it('keeps dark surfaces on-token: no elevation overlay, rounded, bordered paper', () => {
        localStorage.setItem('darkMode', 'true');
        let paperRoot: Record<string, unknown> | undefined;
        let paperBackground: string | undefined;
        const Probe = () => {
            const muiTheme = useMuiTheme();
            const root = muiTheme.components?.MuiPaper?.styleOverrides?.root;
            paperRoot = typeof root === 'function' ? (root({ theme: muiTheme } as never) as Record<string, unknown>) : undefined;
            paperBackground = muiTheme.palette.background.paper;
            return null;
        };

        render(
            <ThemeContextProvider>
                <Probe />
            </ThemeContextProvider>
        );

        expect(paperBackground).toBe(brandColors.darkModePaper);
        expect(paperRoot).toMatchObject({
            backgroundImage: 'none',
            borderRadius: 12,
            border: `1px solid ${brandColors.darkModeDivider}`,
        });
    });

    it.each([
        ['light', false, { square: false }, { borderRadius: 12 }, ['border']],
        ['light', false, { square: true }, { backgroundImage: 'none' }, ['borderRadius', 'border']],
        ['dark', true, { square: false }, { borderRadius: 12, border: `1px solid ${brandColors.darkModeDivider}` }, []],
        ['dark', true, { square: true }, { backgroundImage: 'none' }, ['borderRadius', 'border']],
    ])('resolves the Paper override in %s mode for %j', (_label, dark, ownerState, expected, absent) => {
        localStorage.setItem('darkMode', JSON.stringify(dark));
        let paperRoot: Record<string, unknown> | undefined;
        const Probe = () => {
            const muiTheme = useMuiTheme();
            const root = muiTheme.components?.MuiPaper?.styleOverrides?.root;
            paperRoot = typeof root === 'function' ? (root({ theme: muiTheme, ownerState } as never) as Record<string, unknown>) : undefined;
            return null;
        };

        render(
            <ThemeContextProvider>
                <Probe />
            </ThemeContextProvider>
        );

        expect(paperRoot).toMatchObject(expected);
        absent.forEach((key) => expect(paperRoot).not.toHaveProperty(key));
    });
});
