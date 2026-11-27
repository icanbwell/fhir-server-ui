import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { getContrastRatio, Palette, useTheme as useMuiTheme } from '@mui/material/styles';
import { ThemeContextProvider } from '../context/ThemeContext';
import { brandColors } from './brandColors';

const AA_NORMAL_TEXT = 4.5;

const readPalette = (darkMode: boolean): Palette => {
    if (darkMode) {
        localStorage.setItem('darkMode', 'true');
    }
    let palette: Palette | undefined;
    const Probe = () => {
        palette = useMuiTheme().palette;
        return null;
    };
    render(createElement(ThemeContextProvider, null, createElement(Probe)));
    if (!palette) {
        throw new Error('palette was not captured');
    }
    return palette;
};

beforeEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
});

afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-mode');
});

describe('dark palette tokens', () => {
    const foregrounds = {
        darkModePrimary: brandColors.darkModePrimary,
        darkModePrimaryHover: brandColors.darkModePrimaryHover,
        darkModeSecondary: brandColors.darkModeSecondary,
        darkModeInfo: brandColors.darkModeInfo,
        darkModeError: brandColors.darkModeError,
        darkModeWarning: brandColors.darkModeWarning,
    };
    const surfaces = {
        darkModeBackground: brandColors.darkModeBackground,
        darkModePaper: brandColors.darkModePaper,
        darkModeRaised: brandColors.darkModeRaised,
    };
    const cases = Object.entries(foregrounds).flatMap(([fgName, fg]) =>
        Object.entries(surfaces).map(([bgName, bg]) => [fgName, bgName, fg, bg] as const)
    );

    it.each(cases)('%s on %s meets WCAG AA (4.5:1)', (_fgName, _bgName, fg, bg) => {
        expect(getContrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });

    it('keeps the divider distinguishable from the card surface', () => {
        expect(getContrastRatio(brandColors.darkModeDivider, brandColors.darkModePaper)).toBeGreaterThanOrEqual(1.5);
    });
});

describe('dark theme palette', () => {
    it('uses the dark tokens for the main colours and divider', () => {
        const palette = readPalette(true);

        expect(palette.primary.main).toBe(brandColors.darkModePrimary);
        expect(palette.secondary.main).toBe(brandColors.darkModeSecondary);
        expect(palette.info.main).toBe(brandColors.darkModeInfo);
        expect(palette.error.main).toBe(brandColors.darkModeError);
        expect(palette.warning.main).toBe(brandColors.darkModeWarning);
        expect(palette.divider).toBe(brandColors.darkModeDivider);
    });

    it.each([
        ['primary.main', (p: Palette) => [p.primary.contrastText, p.primary.main]],
        ['primary.dark', (p: Palette) => [p.primary.contrastText, p.primary.dark]],
        ['error.main', (p: Palette) => [p.error.contrastText, p.error.main]],
        ['secondary.main', (p: Palette) => [p.secondary.contrastText, p.secondary.main]],
    ] as const)('contrastText is readable on %s', (_name, pick) => {
        const [fg, bg] = pick(readPalette(true));

        expect(getContrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    });
});

describe('light theme palette', () => {
    it('keeps the brand colours unchanged', () => {
        const palette = readPalette(false);

        expect(palette.primary.main).toBe(brandColors.blue);
        expect(palette.error.main).toBe(brandColors.errorRed);
        expect(palette.secondary.main).toBe(brandColors.lilac);
        expect(palette.background.default).toBe(brandColors.lightGray);
    });
});
