import { act, render, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useBaileyThemeBridge } from './useBaileyThemeBridge';
import { useTheme, ThemeContextProvider } from '../context/ThemeContext';
import { brandColors } from '../theme/brandColors';

describe('useBaileyThemeBridge', () => {
    it('sets the light-mode variables by default', () => {
        renderHook(() => useBaileyThemeBridge(), { wrapper: ThemeContextProvider });

        const root = document.documentElement;
        expect(root.style.getPropertyValue('--color-bailey-accent')).toBe(brandColors.blue);
        expect(root.style.getPropertyValue('--color-bailey-text')).toBe(brandColors.darkGray);
        expect(root.style.getPropertyValue('--color-bailey-tooltip-text')).toBe(brandColors.white);
    });

    it('updates the variables when dark mode is toggled', () => {
        function Harness() {
            useBaileyThemeBridge();
            const { toggleDarkMode } = useTheme();
            return (
                <button type="button" onClick={toggleDarkMode}>
                    toggle
                </button>
            );
        }

        const { getByRole } = render(
            <ThemeContextProvider>
                <Harness />
            </ThemeContextProvider>
        );

        act(() => getByRole('button').click());

        const root = document.documentElement;
        expect(root.style.getPropertyValue('--color-bailey-accent')).toBe(brandColors.lilac);
        expect(root.style.getPropertyValue('--color-bailey-text')).toBe(brandColors.white);
        expect(root.style.getPropertyValue('--color-bailey-surface')).toBe(brandColors.darkModePaper);
    });
});
