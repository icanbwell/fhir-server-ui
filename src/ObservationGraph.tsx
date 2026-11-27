import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { alpha, Theme, useTheme } from '@mui/material/styles';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const observations = [
  {
    date: 'May 26, 2022',
    category: 'Laboratory',
    code: 'Total score [DAST-10] (LOINC code: 82667-7)',
    value: 2,
  },
  {
    date: 'May 9, 2019',
    category: 'Laboratory',
    code: 'Total score [DAST-10] (LOINC code: 82667-7)',
    value: 1,
  },
  {
    date: 'May 3, 2018',
    category: 'Laboratory',
    code: 'Total score [DAST-10] (LOINC code: 82667-7)',
    value: 2,
  },
];
const getChartData = (theme: Theme) => ({
  labels: observations.map((obs) => obs.date),
  datasets: [
    {
      label: 'DAST-10 Scores',
      data: observations.map((obs) => obs.value),
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
  ],
});

const getChartOptions = (theme: Theme) => ({
  scales: {
    x: {
      ticks: { color: theme.palette.text.secondary },
      grid: { color: theme.palette.divider },
    },
    y: {
      beginAtZero: true,
      ticks: { color: theme.palette.text.secondary },
      grid: { color: theme.palette.divider },
    },
  },
  plugins: {
    legend: { labels: { color: theme.palette.text.primary } },
  },
});

const ObservationGraph = () => {
  const theme = useTheme();
  return <Line data={getChartData(theme)} options={getChartOptions(theme)} />;
};

export default ObservationGraph;
