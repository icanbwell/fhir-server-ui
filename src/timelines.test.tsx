import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeContextProvider } from './context/ThemeContext';
import { brandColors } from './theme/brandColors';
import ObservationTimeline from './ObservationTimeline';
import PatientTimeline from './PatientTimeline';

// jsdom serialises inline colours as rgb(r, g, b), so compare in that form.
const toRgb = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return `rgb(${r}, ${g}, ${b})`;
};

const timelines = [
    ['ObservationTimeline', ObservationTimeline],
    ['PatientTimeline', PatientTimeline],
] as const;

const renderTimeline = (Timeline: ComponentType, darkMode?: 'true') => {
    if (darkMode) {
        localStorage.setItem('darkMode', darkMode);
    }
    return render(
        <ThemeContextProvider>
            <Timeline />
        </ThemeContextProvider>
    );
};

beforeEach(() => {
    localStorage.clear();
    // react-vertical-timeline-component observes element visibility; jsdom has no IntersectionObserver.
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            observe() {}
            unobserve() {}
            disconnect() {}
        }
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    document.body.classList.remove('dark-mode');
});

describe.each(timelines)('%s', (_name, Timeline) => {
    test('dark mode paints no element with the brand navy', () => {
        const { container } = renderTimeline(Timeline, 'true');

        const styled = Array.from(container.querySelectorAll('[style]'));
        expect(styled.length).toBeGreaterThan(0);
        styled.forEach((el) => {
            expect(el.getAttribute('style')?.toLowerCase()).not.toContain(toRgb(brandColors.blue));
        });
    });

    test.each([
        ['dark', 'true' as const, brandColors.darkModeRaised],
        ['light', undefined, brandColors.blue],
    ])('%s mode card and icon use the themed surface', (_mode, persisted, expected) => {
        const { container } = renderTimeline(Timeline, persisted);

        const content = container.querySelector<HTMLElement>('.vertical-timeline-element-content');
        const icon = container.querySelector<HTMLElement>('.vertical-timeline-element-icon');
        expect(content?.style.background).toBe(toRgb(expected));
        expect(icon?.style.background).toBe(toRgb(expected));
        expect(content?.style.color).toBe('rgb(255, 255, 255)');
    });
});
