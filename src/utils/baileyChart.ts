export type BaileyChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter';

export interface BaileyChartDataset {
    label: string;
    data: number[] | Array<{ x: number; y: number }>;
}

export interface BaileyChartSpec {
    type: BaileyChartType;
    title?: string;
    data: {
        labels?: string[];
        datasets: BaileyChartDataset[];
    };
}

const CHART_TYPES: BaileyChartType[] = ['bar', 'line', 'pie', 'doughnut', 'scatter'];
const MAX_DATASETS = 8;
const MAX_LABELS = 50;
const MAX_PIE_LABELS = 12;
const MAX_SCATTER_POINTS = 500;

const isPoint = (value: unknown): value is { x: number; y: number } =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { x: unknown }).x === 'number' &&
    typeof (value as { y: unknown }).y === 'number';

// Accepts Chart.js's own native config shape ({type, data: {labels, datasets}}) rather than a
// bespoke schema, and validates it defensively — this is untrusted model output, not our own
// serialized state. Any options/colors on the incoming JSON are ignored entirely: BaileyChart
// owns styling from the app's theme, not Bailey.
export const parseBaileyChartSpec = (raw: string): BaileyChartSpec | null => {
    let json: unknown;
    try {
        json = JSON.parse(raw);
    } catch {
        return null;
    }

    if (typeof json !== 'object' || json === null) {
        return null;
    }
    const obj = json as Record<string, unknown>;

    if (typeof obj.type !== 'string' || !CHART_TYPES.includes(obj.type as BaileyChartType)) {
        return null;
    }
    const type = obj.type as BaileyChartType;

    if (obj.title !== undefined && typeof obj.title !== 'string') {
        return null;
    }
    const title = obj.title as string | undefined;

    if (typeof obj.data !== 'object' || obj.data === null) {
        return null;
    }
    const data = obj.data as Record<string, unknown>;

    if (!Array.isArray(data.datasets) || data.datasets.length < 1 || data.datasets.length > MAX_DATASETS) {
        return null;
    }
    if ((type === 'pie' || type === 'doughnut') && data.datasets.length !== 1) {
        return null;
    }

    for (const rawDataset of data.datasets) {
        if (
            typeof rawDataset !== 'object' ||
            rawDataset === null ||
            typeof (rawDataset as Record<string, unknown>).label !== 'string' ||
            !Array.isArray((rawDataset as Record<string, unknown>).data)
        ) {
            return null;
        }
    }
    const datasets = data.datasets as Array<{ label: string; data: unknown[] }>;

    if (type === 'scatter') {
        for (const dataset of datasets) {
            if (
                dataset.data.length < 1 ||
                dataset.data.length > MAX_SCATTER_POINTS ||
                !dataset.data.every(isPoint)
            ) {
                return null;
            }
        }
        return { type, title, data: { datasets: datasets as BaileyChartDataset[] } };
    }

    if (!Array.isArray(data.labels) || !data.labels.every((l) => typeof l === 'string')) {
        return null;
    }
    const labels = data.labels as string[];
    const maxLabels = type === 'pie' || type === 'doughnut' ? MAX_PIE_LABELS : MAX_LABELS;
    if (labels.length < 1 || labels.length > maxLabels) {
        return null;
    }

    for (const dataset of datasets) {
        if (dataset.data.length !== labels.length || !dataset.data.every((v) => typeof v === 'number')) {
            return null;
        }
    }

    return { type, title, data: { labels, datasets: datasets as BaileyChartDataset[] } };
};
