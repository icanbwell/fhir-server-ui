import { useMemo } from 'react';
import { themeBalham } from 'ag-grid-community';
import { brandColors } from '../theme/brandColors';

// ag-grid has its own theming system, separate from the MUI theme in ThemeContext.tsx. Shared
// by every ag-grid consumer in the app (SpreadsheetViewer.tsx, BaileyTable.tsx) so a future
// brand-color change only needs to happen in one place.
export const useAgGridBrandTheme = (isDarkMode: boolean) =>
    useMemo(() => {
        if (isDarkMode) {
            return themeBalham.withParams({
                backgroundColor: brandColors.darkModePaper,
                foregroundColor: brandColors.lightGray,
                borderColor: brandColors.darkModeBorder,
                accentColor: brandColors.lilac,
            });
        }
        return themeBalham.withParams({
            accentColor: brandColors.blue,
        });
    }, [isDarkMode]);
