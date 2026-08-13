import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { alpha, createTheme, lighten, ThemeProvider } from '@mui/material/styles';
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
        return savedTheme ? JSON.parse(savedTheme) : false;
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
            primary: {
                main: brandColors.blue,
                dark: brandColors.darkBlue,
            },
            secondary: {
                main: brandColors.lilac,
            },
            success: {
                main: brandColors.green,
            },
            warning: {
                main: brandColors.orange,
            },
            error: {
                main: brandColors.errorRed,
            },
            // Not a distinct brand color; the guide has no "info" swatch, so this is a
            // lightened tint of brand Blue to stay in-family rather than MUI's stock blue.
            info: {
                main: lighten(brandColors.blue, 0.25),
            },
            background: {
                default: isDarkMode ? '#14162E' : brandColors.lightGray,
                paper: isDarkMode ? '#1E2150' : brandColors.white,
            },
            text: {
                primary: isDarkMode ? brandColors.lightGray : brandColors.darkGray,
                secondary: isDarkMode ? '#A9ACC4' : brandColors.midGray,
            },
            brand: brandColors,
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
                    }),
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
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
                        backgroundColor:
                            theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.06) : theme.palette.brand.lightGray,
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
                            backgroundColor: alpha(theme.palette.text.primary, 0.06),
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
                        backgroundColor:
                            theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.06) : theme.palette.brand.lightGray,
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
                            color: theme.palette.primary.dark,
                        },
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
