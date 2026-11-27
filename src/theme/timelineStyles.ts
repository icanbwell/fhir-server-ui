import { Theme } from '@mui/material/styles';

// Timeline cards keep the brand navy in light mode; in dark mode navy would sink into the page,
// so they sit on the raised dark surface with a hairline divider border. Text stays white
// (>= 4.5:1 on both surfaces).
export const getTimelineStyles = (theme: Theme) => {
  const isDark = theme.palette.mode === 'dark';
  const surface = isDark ? theme.palette.brand.darkModeRaised : theme.palette.brand.blue;
  return {
    contentStyle: {
      background: surface,
      color: '#fff',
      ...(isDark ? { border: `1px solid ${theme.palette.divider}` } : {}),
    },
    contentArrowStyle: { borderRight: `7px solid ${surface}` },
    iconStyle: { background: surface, color: '#fff' },
  };
};
