import { describe, expect, it } from 'vitest';
import { parseBaileyChartSpec } from './baileyChart';

describe('parseBaileyChartSpec', () => {
    it('parses a valid bar chart spec', () => {
        const spec = parseBaileyChartSpec(
            JSON.stringify({
                type: 'bar',
                title: 'BP readings',
                data: {
                    labels: ['Jan', 'Feb'],
                    datasets: [{ label: 'Systolic', data: [120, 118] }],
                },
            })
        );

        expect(spec).toEqual({
            type: 'bar',
            title: 'BP readings',
            data: {
                labels: ['Jan', 'Feb'],
                datasets: [{ label: 'Systolic', data: [120, 118] }],
            },
        });
    });

    it('parses a valid line chart spec with multiple datasets', () => {
        const spec = parseBaileyChartSpec(
            JSON.stringify({
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar'],
                    datasets: [
                        { label: 'Systolic', data: [120, 118, 122] },
                        { label: 'Diastolic', data: [80, 78, 79] },
                    ],
                },
            })
        );

        expect(spec?.type).toBe('line');
        expect(spec?.data.datasets).toHaveLength(2);
    });

    it('parses a valid pie chart spec with exactly one dataset', () => {
        const spec = parseBaileyChartSpec(
            JSON.stringify({
                type: 'pie',
                data: {
                    labels: ['Lab', 'Vitals'],
                    datasets: [{ label: 'Encounters', data: [3, 7] }],
                },
            })
        );

        expect(spec?.type).toBe('pie');
    });

    it('parses a valid scatter chart spec with {x,y} points', () => {
        const spec = parseBaileyChartSpec(
            JSON.stringify({
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: 'Weight vs BP',
                            data: [
                                { x: 150, y: 120 },
                                { x: 160, y: 125 },
                            ],
                        },
                    ],
                },
            })
        );

        expect(spec?.type).toBe('scatter');
    });

    it('returns null for malformed JSON', () => {
        expect(parseBaileyChartSpec('{not valid json')).toBeNull();
    });

    it('returns null for an unsupported chart type', () => {
        expect(
            parseBaileyChartSpec(
                JSON.stringify({ type: 'radar', data: { labels: ['a'], datasets: [{ label: 'x', data: [1] }] } })
            )
        ).toBeNull();
    });

    it('returns null when a pie chart has more than one dataset', () => {
        expect(
            parseBaileyChartSpec(
                JSON.stringify({
                    type: 'pie',
                    data: {
                        labels: ['a', 'b'],
                        datasets: [
                            { label: 'x', data: [1, 2] },
                            { label: 'y', data: [3, 4] },
                        ],
                    },
                })
            )
        ).toBeNull();
    });

    it('returns null when a dataset length does not match labels length', () => {
        expect(
            parseBaileyChartSpec(
                JSON.stringify({
                    type: 'bar',
                    data: { labels: ['a', 'b', 'c'], datasets: [{ label: 'x', data: [1, 2] }] },
                })
            )
        ).toBeNull();
    });

    it('returns null when there are more than 8 datasets', () => {
        const datasets = Array.from({ length: 9 }, (_, i) => ({ label: `s${i}`, data: [1] }));
        expect(
            parseBaileyChartSpec(JSON.stringify({ type: 'bar', data: { labels: ['a'], datasets } }))
        ).toBeNull();
    });

    it('returns null when a bar/line chart has more than 50 labels', () => {
        const labels = Array.from({ length: 51 }, (_, i) => `l${i}`);
        const data = labels.map(() => 1);
        expect(
            parseBaileyChartSpec(JSON.stringify({ type: 'bar', data: { labels, datasets: [{ label: 'x', data }] } }))
        ).toBeNull();
    });

    it('returns null when a pie/doughnut chart has more than 12 labels', () => {
        const labels = Array.from({ length: 13 }, (_, i) => `l${i}`);
        const data = labels.map(() => 1);
        expect(
            parseBaileyChartSpec(
                JSON.stringify({ type: 'doughnut', data: { labels, datasets: [{ label: 'x', data }] } })
            )
        ).toBeNull();
    });

    it('returns null when a scatter dataset does not contain {x,y} points', () => {
        expect(
            parseBaileyChartSpec(
                JSON.stringify({ type: 'scatter', data: { datasets: [{ label: 'x', data: [1, 2, 3] }] } })
            )
        ).toBeNull();
    });

    it('returns null when title is present but not a string', () => {
        expect(
            parseBaileyChartSpec(
                JSON.stringify({
                    type: 'bar',
                    title: 42,
                    data: { labels: ['a'], datasets: [{ label: 'x', data: [1] }] },
                })
            )
        ).toBeNull();
    });
});
