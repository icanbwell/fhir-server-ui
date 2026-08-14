import { useMemo } from 'react';
import { Box } from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    BarController,
    LineController,
    PieController,
    DoughnutController,
    ScatterController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import type { BaileyChartSpec } from '../utils/baileyChart';
import { useTheme } from '../context/ThemeContext';
import { brandColors } from '../theme/brandColors';

// Registration is additive/idempotent across modules (ObservationGraph.tsx registers its own
// overlapping set), so it's safe for both to declare what they need independently. Controllers
// are a distinct registerable category from elements/scales/plugins — without them, the generic
// <Chart type={...} /> below (unlike react-chartjs-2's typed <Line>/<Bar> exports, which
// self-register via createTypedChart) throws "'<type>' is not a registered controller" for
// every spec.type this component supports.
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    BarController,
    LineController,
    PieController,
    DoughnutController,
    ScatterController
);

// Colors always come from here, never from the incoming spec — keeps rendered charts on-brand
// and dark-mode-correct regardless of what Bailey's output contains.
const LIGHT_PALETTE = [
    brandColors.blue,
    brandColors.green,
    brandColors.lilac,
    brandColors.orange,
    brandColors.darkGray,
    brandColors.midGray,
    brandColors.darkBlue,
    brandColors.errorRed,
];
const DARK_PALETTE = [
    brandColors.lilac,
    brandColors.green,
    brandColors.yellow,
    brandColors.orange,
    brandColors.lightGray,
    brandColors.midGray,
    brandColors.white,
    brandColors.errorRed,
];

interface BaileyChartProps {
    spec: BaileyChartSpec;
}

const BaileyChart = ({ spec }: BaileyChartProps) => {
    const { isDarkMode } = useTheme();
    const palette = isDarkMode ? DARK_PALETTE : LIGHT_PALETTE;
    const isSliced = spec.type === 'pie' || spec.type === 'doughnut';

    const chartData = useMemo(
        () => ({
            labels: spec.data.labels,
            datasets: spec.data.datasets.map((dataset, index) => ({
                label: dataset.label,
                data: dataset.data,
                backgroundColor: isSliced
                    ? dataset.data.map((_, sliceIndex) => palette[sliceIndex % palette.length])
                    : palette[index % palette.length],
                borderColor: isSliced ? undefined : palette[index % palette.length],
            })),
        }),
        [spec, isSliced, palette]
    );

    const options = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: Boolean(spec.title), text: spec.title },
                legend: { display: spec.data.datasets.length > 1 || isSliced },
            },
        }),
        [spec.title, spec.data.datasets.length, isSliced]
    );

    return (
        <Box sx={{ my: 1, height: 300 }}>
            <Chart type={spec.type} data={chartData} options={options} />
        </Box>
    );
};

export default BaileyChart;
