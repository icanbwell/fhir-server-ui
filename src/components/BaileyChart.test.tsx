import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const chartPropsSpy = vi.fn();

// react-chartjs-2 renders to a <canvas> 2D context, which jsdom doesn't implement and which
// wouldn't be assertable via RTL queries even if it did (canvas output is pixels, not DOM).
// Mocked at the module boundary, same as ag-grid in BaileyTable.test.tsx — this tests the data/
// color/options BaileyChart constructs, not react-chartjs-2's own rendering.
vi.mock('react-chartjs-2', () => ({
    Chart: (props: unknown) => {
        chartPropsSpy(props);
        return null;
    },
}));

import BaileyChart from './BaileyChart';
import { ThemeContextProvider } from '../context/ThemeContext';
import type { BaileyChartSpec } from '@icanbwell/baileyai-chat-ui';

const lastCallProps = () => chartPropsSpy.mock.calls[chartPropsSpy.mock.calls.length - 1][0] as {
    type: string;
    data: { labels?: string[]; datasets: Array<{ label: string; data: unknown; backgroundColor: unknown }> };
    options: { plugins?: { title?: { display: boolean; text?: string } } };
};

describe('BaileyChart', () => {
    it('passes the chart type, labels, and dataset values through unchanged', () => {
        const spec: BaileyChartSpec = {
            type: 'bar',
            data: { labels: ['Jan', 'Feb'], datasets: [{ label: 'Systolic', data: [120, 118] }] },
        };

        render(
            <ThemeContextProvider>
                <BaileyChart spec={spec} />
            </ThemeContextProvider>
        );

        const props = lastCallProps();
        expect(props.type).toBe('bar');
        expect(props.data.labels).toEqual(['Jan', 'Feb']);
        expect(props.data.datasets[0].label).toBe('Systolic');
        expect(props.data.datasets[0].data).toEqual([120, 118]);
    });

    it('assigns a different color per dataset for a multi-series bar chart', () => {
        const spec: BaileyChartSpec = {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb'],
                datasets: [
                    { label: 'Systolic', data: [120, 118] },
                    { label: 'Diastolic', data: [80, 78] },
                ],
            },
        };

        render(
            <ThemeContextProvider>
                <BaileyChart spec={spec} />
            </ThemeContextProvider>
        );

        const props = lastCallProps();
        const [first, second] = props.data.datasets;
        expect(first.backgroundColor).not.toEqual(second.backgroundColor);
    });

    it('assigns one color per slice for a pie chart, not one color per dataset', () => {
        const spec: BaileyChartSpec = {
            type: 'pie',
            data: {
                labels: ['Lab', 'Vitals', 'Imaging'],
                datasets: [{ label: 'Encounters', data: [3, 7, 2] }],
            },
        };

        render(
            <ThemeContextProvider>
                <BaileyChart spec={spec} />
            </ThemeContextProvider>
        );

        const props = lastCallProps();
        const backgroundColor = props.data.datasets[0].backgroundColor as string[];
        expect(Array.isArray(backgroundColor)).toBe(true);
        expect(backgroundColor).toHaveLength(3);
        expect(new Set(backgroundColor).size).toBe(3);
    });

    it('never uses colors from the incoming spec, only from the theme', () => {
        const spec = {
            type: 'bar',
            data: {
                labels: ['Jan'],
                datasets: [{ label: 'x', data: [1], backgroundColor: 'hotpink' }],
            },
        } as unknown as BaileyChartSpec;

        render(
            <ThemeContextProvider>
                <BaileyChart spec={spec} />
            </ThemeContextProvider>
        );

        const props = lastCallProps();
        expect(props.data.datasets[0].backgroundColor).not.toBe('hotpink');
    });

    it('enables the chart title plugin when a title is provided', () => {
        const spec: BaileyChartSpec = {
            type: 'line',
            title: 'BP readings',
            data: { labels: ['Jan'], datasets: [{ label: 'x', data: [1] }] },
        };

        render(
            <ThemeContextProvider>
                <BaileyChart spec={spec} />
            </ThemeContextProvider>
        );

        const props = lastCallProps();
        expect(props.options.plugins?.title).toEqual({ display: true, text: 'BP readings' });
    });
});
