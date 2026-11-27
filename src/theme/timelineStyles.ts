import { Theme } from '@mui/material/styles';

// Timeline cards keep the brand navy in light mode; in dark mode navy would sink into the page,
// so they sit on the raised dark surface with a hairline divider border. Text stays white
// (>= 4.5:1 on both surfaces). The library's white spine, white icon ring and card shadow are
// also swapped for on-token values in dark mode; light mode keeps the library defaults.
export const getTimelineStyles = (theme: Theme) => {
    const isDark = theme.palette.mode === 'dark';
    const surface = isDark ? theme.palette.brand.darkModeRaised : theme.palette.brand.blue;
    return {
        lineColor: isDark ? theme.palette.divider : undefined,
        contentStyle: {
            background: surface,
            color: '#fff',
            ...(isDark ? { border: `1px solid ${theme.palette.divider}`, boxShadow: 'none' } : {}),
        },
        contentArrowStyle: { borderRight: `7px solid ${surface}` },
        iconStyle: {
            background: surface,
            color: '#fff',
            ...(isDark ? { boxShadow: `0 0 0 4px ${theme.palette.background.default}` } : {}),
        },
    };
};

export type TimelineStyles = ReturnType<typeof getTimelineStyles>;
