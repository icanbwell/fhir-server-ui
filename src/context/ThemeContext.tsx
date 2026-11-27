import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { alpha, createTheme, darken, lighten, Theme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { getLocalData, setLocalData } from '../utils/localData.utils';
import { brandColors } from '../theme/brandColors';

// b.well Brand Style Guide, section 3.1: Quicksand for display/headings, Open Sans for everything else.
const openSansStack = '"Open Sans", "Helvetica Neue", Arial, sans-serif';
const quicksandStack = '"Quicksand", "Open Sans", "Helvetica Neue", Arial, sans-serif';

declare module '@mui/material/styles' {
    interface Palette {
        brand: typeof brandColors;
    }
    interface PaletteOptions {
        brand?: typeof brandColors;
    }
}

// Both MuiTableHead.root and MuiTableCell.head paint the same visual surface
// (the header row and its cells); derive the shared background once so they
// can't silently diverge on a future style tweak.
const getHeaderBackground = (theme: Theme) =>
    theme.palette.mode === 'dark' ? theme.palette.brand.darkModeRaised : theme.palette.brand.lightGray;

// Rounded surface shared by Paper/Card/Accordion. `backgroundImage: 'none'` disables MUI's
// dark-mode elevation overlay so surfaces stay on the dark-mode tokens; dark surfaces also get
// a hairline divider border since shadows are invisible on dark backgrounds.
// Square papers (AppBar, Drawer, ...) keep their square edges and get no extra border.
const getSurfaceShape = (theme: Theme, square = false) => ({
    backgroundImage: 'none',
    ...(square ? {} : { borderRadius: 12 }),
    ...(theme.palette.mode === 'dark' && !square ? { border: `1px solid ${theme.palette.divider}` } : {}),
});

const getFocusRing = (theme: Theme) => ({
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
});

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeContextProviderProps {
    children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Get initial theme from localStorage or default to false (light mode)
        const savedTheme = getLocalData('darkMode');
        if (!savedTheme) {
            return false;
        }
        try {
            return JSON.parse(savedTheme);
        } catch {
            // localStorage is attacker-adjacent (any script on the origin, an extension, a stale
            // value from an older build, manual devtools editing). An unparseable value must not
            // throw here — the persisted bad value would white-screen the app on every reload,
            // with no reachable control to clear it. Fall back to the light-mode default.
            return false;
        }
    });

    useEffect(() => {
        // Save theme preference to localStorage whenever it changes
        setLocalData('darkMode', JSON.stringify(isDarkMode));

        // Add or remove dark-mode class from body element
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode((prev: boolean) => !prev);
    };

    // Create Material-UI theme based on isDarkMode
    const theme = createTheme({
        palette: {
            mode: isDarkMode ? 'dark' : 'light',
            primary: isDarkMode
                ? { main: brandColors.darkModePrimary, dark: darken(brandColors.darkModePrimary, 0.15) }
                : { main: brandColors.blue, dark: brandColors.darkBlue },
            secondary: {
                main: isDarkMode ? brandColors.darkModeSecondary : brandColors.lilac,
            },
            success: {
                main: brandColors.green,
            },
            warning: {
                main: isDarkMode ? brandColors.darkModeWarning : brandColors.orange,
            },
            error: {
                main: isDarkMode ? brandColors.darkModeError : brandColors.errorRed,
            },
            // Not a distinct brand color; the guide has no "info" swatch, so this is a
            // lightened tint of brand Blue to stay in-family rather than MUI's stock blue.
            info: {
                main: isDarkMode ? brandColors.darkModeInfo : lighten(brandColors.blue, 0.25),
            },
            ...(isDarkMode ? { divider: brandColors.darkModeDivider } : {}),
            background: {
                default: isDarkMode ? brandColors.darkModeBackground : brandColors.lightGray,
                paper: isDarkMode ? brandColors.darkModePaper : brandColors.white,
            },
            text: {
                primary: isDarkMode ? brandColors.lightGray : brandColors.darkGray,
                // midGray (#7F7F7F) alone is ~4.0:1 on white, short of WCAG AA's 4.5:1 for
                // normal text; darken it slightly so descriptive/secondary text stays AA-safe
                // without losing the lighter-than-primary hierarchy midGray was chosen for.
                secondary: isDarkMode ? brandColors.darkModeTextSecondary : darken(brandColors.midGray, 0.15),
            },
            brand: brandColors,
        },
        shape: {
            borderRadius: 8,
        },
        typography: {
            fontFamily: openSansStack,
            fontWeightLight: 300,
            fontWeightRegular: 400,
            fontWeightMedium: 600,
            fontWeightBold: 700,
            h1: { fontFamily: quicksandStack, fontWeight: 700 },
            h2: { fontFamily: quicksandStack, fontWeight: 700 },
            h3: { fontFamily: quicksandStack, fontWeight: 700 },
            h4: { fontFamily: quicksandStack, fontWeight: 600 },
            h5: { fontFamily: quicksandStack, fontWeight: 600 },
            h6: { fontFamily: quicksandStack, fontWeight: 600 },
            subtitle1: { fontFamily: quicksandStack, fontWeight: 400 },
            subtitle2: { fontFamily: quicksandStack, fontWeight: 400 },
            button: { fontWeight: 600, textTransform: 'none' },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: (theme) => {
                    const isDark = theme.palette.mode === 'dark';
                    const thumb = isDark ? theme.palette.brand.darkModeDivider : theme.palette.grey[400];
                    const track = isDark ? theme.palette.brand.darkModePaper : theme.palette.grey[100];
                    return {
                        html: {
                            colorScheme: theme.palette.mode,
                            scrollbarColor: `${thumb} ${track}`,
                        },
                        '*::-webkit-scrollbar': { width: 12, height: 12, backgroundColor: track },
                        '*::-webkit-scrollbar-track': { backgroundColor: track },
                        '*::-webkit-scrollbar-thumb': {
                            backgroundColor: thumb,
                            borderRadius: 8,
                            border: `2px solid ${track}`,
                        },
                        '*::-webkit-scrollbar-corner': { backgroundColor: track },
                    };
                },
            },
            // Customize components for better dark mode support
            MuiAppBar: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.primary.main,
                    }),
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                        ...getSurfaceShape(theme),
                    }),
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: ({ theme, ownerState }) => ({
                        backgroundColor: theme.palette.background.paper,
                        ...getSurfaceShape(theme, ownerState?.square),
                    }),
                },
            },
            MuiAccordion: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        ...getSurfaceShape(theme),
                        '&:before': { display: 'none' },
                    }),
                },
            },
            MuiPopover: {
                styleOverrides: {
                    paper: ({ theme }) => ({
                        ...(theme.palette.mode === 'dark' ? { backgroundColor: theme.palette.brand.darkModeRaised } : {}),
                    }),
                },
            },
            MuiButtonBase: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        '&.Mui-focusVisible': getFocusRing(theme),
                    }),
                },
            },
            MuiTableContainer: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                    }),
                },
            },
            MuiTableHead: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundColor: getHeaderBackground(theme),
                    }),
                },
            },
            MuiTableRow: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        '&:nth-of-type(odd)': {
                            backgroundColor: alpha(theme.palette.text.primary, 0.03),
                        },
                        '&:hover': {
                            backgroundColor:
                                theme.palette.mode === 'dark'
                                    ? theme.palette.brand.darkModeRaised
                                    : alpha(theme.palette.text.primary, 0.06),
                        },
                    }),
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        color: theme.palette.text.primary,
                    }),
                    head: ({ theme }) => ({
                        backgroundColor: getHeaderBackground(theme),
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                    }),
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: theme.palette.background.paper,
                            '& fieldset': {
                                borderColor: theme.palette.divider,
                            },
                            '&:hover fieldset': {
                                borderColor: theme.palette.text.secondary,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: theme.palette.primary.main,
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: theme.palette.text.primary,
                        },
                        '& .MuiOutlinedInput-input': {
                            color: theme.palette.text.primary,
                        },
                    }),
                },
            },
            MuiFormControl: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: theme.palette.background.paper,
                            '& fieldset': {
                                borderColor: theme.palette.divider,
                            },
                            '&:hover fieldset': {
                                borderColor: theme.palette.text.secondary,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: theme.palette.primary.main,
                            },
                        },
                        '& .MuiInputLabel-root': {
                            color: theme.palette.text.primary,
                        },
                        '& .MuiOutlinedInput-input': {
                            color: theme.palette.text.primary,
                        },
                    }),
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        '&.MuiButton-outlined': {
                            borderColor: theme.palette.divider,
                            color: theme.palette.primary.main,
                            '&:hover': {
                                borderColor: theme.palette.text.secondary,
                                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            },
                        },
                    }),
                },
            },
            MuiLink: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        color: theme.palette.primary.main,
                        textDecoration: 'underline',
                        '&:visited': {
                            color: theme.palette.primary.main,
                        },
                        '&:hover': {
                            color: theme.palette.mode === 'dark' ? theme.palette.brand.darkModePrimaryHover : theme.palette.primary.dark,
                        },
                        '&:focus-visible': getFocusRing(theme),
                    }),
                },
            },
        },
    });

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
