import { useLayoutEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { brandColors } from '../theme/brandColors';

// The package's CSS custom properties all default to light-mode values (e.g.
// --color-bailey-text: #000000), so every variable must be mapped here — one left unmapped
// becomes a dark-mode contrast bug (e.g. black text on a dark surface) rather than a visible gap.
const THEME_VARIABLES: Record<string, { light: string; dark: string }> = {
    '--color-bailey-accent': { light: brandColors.blue, dark: brandColors.lilac },
    '--color-bailey-bubble-bg': { light: brandColors.lightGray, dark: brandColors.darkModePaper },
    '--color-bailey-error': { light: brandColors.errorRed, dark: brandColors.errorRed },
    '--color-bailey-border': { light: brandColors.lightGray, dark: brandColors.darkModeBorder },
    '--color-bailey-surface': { light: brandColors.white, dark: brandColors.darkModePaper },
    '--color-bailey-surface-muted': { light: brandColors.lightGray, dark: brandColors.darkModeBackground },
    '--color-bailey-text': { light: brandColors.darkGray, dark: brandColors.white },
    '--color-bailey-text-secondary': { light: brandColors.midGray, dark: brandColors.darkModeTextSecondary },
    '--color-bailey-tooltip-bg': { light: brandColors.darkGray, dark: brandColors.darkModePaper },
    '--color-bailey-tooltip-text': { light: brandColors.white, dark: brandColors.white },
};

// Writes brand colors onto the package's CSS custom properties so BaileyChatPanel's Tailwind
// classes (bg-bailey-accent, text-bailey-text, etc.) pick up this app's theme instead of the
// package's own light-mode defaults.
export function useBaileyThemeBridge(): void {
    const { isDarkMode } = useTheme();

    // useLayoutEffect (not useEffect) so these overrides land before the browser paints — the
    // package's stylesheet bakes light-mode defaults into :root, and a passive effect would let
    // one frame paint with those defaults before this hook's dark-mode values ever apply.
    useLayoutEffect(() => {
        const root = document.documentElement;
        Object.entries(THEME_VARIABLES).forEach(([name, { light, dark }]) => {
            root.style.setProperty(name, isDarkMode ? dark : light);
        });
    }, [isDarkMode]);
}
