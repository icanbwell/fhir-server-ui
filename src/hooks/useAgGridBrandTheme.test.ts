import { renderHook } from '@testing-library/react';
import { themeBalham } from 'ag-grid-community';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { brandColors } from '../theme/brandColors';
import { useAgGridBrandTheme } from './useAgGridBrandTheme';

// ag-grid resolves a theme's parameter overrides onto the base theme's defaults; reading the
// `$default` mode back off the produced theme is how we assert on the hook's actual output
// rather than only on what it asked for.
const resolvedParams = (theme: unknown): Record<string, unknown> =>
    (theme as { _getModeParams: () => Record<string, Record<string, unknown>> })._getModeParams()['$default'];

const renderThemeHook = (isDarkMode: boolean) =>
    renderHook(({ isDarkMode: dark }: { isDarkMode: boolean }) => useAgGridBrandTheme(dark), {
        initialProps: { isDarkMode },
    });

describe('useAgGridBrandTheme', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('builds the light theme from themeBalham with the brand blue as the accent colour', () => {
        const withParams = vi.spyOn(themeBalham, 'withParams');

        const { result } = renderThemeHook(false);

        expect(withParams).toHaveBeenCalledTimes(1);
        expect(withParams).toHaveBeenCalledWith({ accentColor: brandColors.blue });
        expect(result.current).not.toBe(themeBalham);
        expect(resolvedParams(result.current).accentColor).toBe(brandColors.blue);
    });

    it('leaves the light theme surface colours at themeBalham defaults (accentColor is the only override)', () => {
        const withParams = vi.spyOn(themeBalham, 'withParams');

        const { result } = renderThemeHook(false);

        expect(Object.keys(withParams.mock.calls[0][0] as object)).toEqual(['accentColor']);
        const params = resolvedParams(result.current);
        expect(params.backgroundColor).not.toBe(brandColors.darkModePaper);
        expect(params.foregroundColor).not.toBe(brandColors.lightGray);
        expect(params.borderColor).not.toBe(brandColors.darkModeBorder);
    });

    it('builds the dark theme from the dark-mode brand surface, text, border and accent colours', () => {
        const withParams = vi.spyOn(themeBalham, 'withParams');

        const { result } = renderThemeHook(true);

        expect(withParams).toHaveBeenCalledTimes(1);
        expect(withParams).toHaveBeenCalledWith({
            backgroundColor: brandColors.darkModePaper,
            foregroundColor: brandColors.lightGray,
            borderColor: brandColors.darkModeBorder,
            accentColor: brandColors.lilac,
        });

        const params = resolvedParams(result.current);
        expect(params.backgroundColor).toBe(brandColors.darkModePaper);
        expect(params.foregroundColor).toBe(brandColors.lightGray);
        expect(params.borderColor).toBe(brandColors.darkModeBorder);
        expect(params.accentColor).toBe(brandColors.lilac);
    });

    it('memoizes on isDarkMode so a re-render with the same value keeps the identical theme object', () => {
        const withParams = vi.spyOn(themeBalham, 'withParams');

        const { result, rerender } = renderThemeHook(false);
        const first = result.current;

        rerender({ isDarkMode: false });
        rerender({ isDarkMode: false });

        expect(result.current).toBe(first);
        expect(withParams).toHaveBeenCalledTimes(1);
    });

    it('rebuilds with the dark params when isDarkMode flips to true', () => {
        const withParams = vi.spyOn(themeBalham, 'withParams');

        const { result, rerender } = renderThemeHook(false);
        const lightTheme = result.current;

        rerender({ isDarkMode: true });

        expect(result.current).not.toBe(lightTheme);
        expect(withParams).toHaveBeenCalledTimes(2);
        expect(withParams).toHaveBeenLastCalledWith({
            backgroundColor: brandColors.darkModePaper,
            foregroundColor: brandColors.lightGray,
            borderColor: brandColors.darkModeBorder,
            accentColor: brandColors.lilac,
        });
        const params = resolvedParams(result.current);
        expect(params.backgroundColor).toBe(brandColors.darkModePaper);
        expect(params.accentColor).toBe(brandColors.lilac);
    });

    it('rebuilds a light theme (not a stale dark one) when isDarkMode flips back to false', () => {
        const withParams = vi.spyOn(themeBalham, 'withParams');

        const { result, rerender } = renderThemeHook(true);
        const darkTheme = result.current;

        rerender({ isDarkMode: false });

        expect(result.current).not.toBe(darkTheme);
        expect(withParams).toHaveBeenCalledTimes(2);
        expect(withParams).toHaveBeenLastCalledWith({ accentColor: brandColors.blue });
        const params = resolvedParams(result.current);
        expect(params.accentColor).toBe(brandColors.blue);
        expect(params.backgroundColor).not.toBe(brandColors.darkModePaper);
    });
});
