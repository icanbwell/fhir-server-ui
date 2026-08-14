import { useMemo } from 'react';
import { Box } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import {
    ModuleRegistry,
    ColumnAutoSizeModule,
    ColumnHoverModule,
    RowAutoHeightModule,
    RowStyleModule,
    TooltipModule,
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
    themeBalham,
} from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { useTheme } from '../context/ThemeContext';
import { brandColors } from '../theme/brandColors';

// Registration is additive/idempotent across modules (SpreadsheetViewer.tsx registers its own
// overlapping set), so it's safe for both to declare what they need independently.
ModuleRegistry.registerModules([
    ColumnAutoSizeModule,
    ColumnHoverModule,
    RowAutoHeightModule,
    RowStyleModule,
    TooltipModule,
    TextFilterModule,
    NumberFilterModule,
    ClientSideRowModelModule,
]);

interface BaileyTableProps {
    headers: string[];
    rows: string[][];
}

const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
};

const BaileyTable = ({ headers, rows }: BaileyTableProps) => {
    const { isDarkMode } = useTheme();

    // Themed the same way as SpreadsheetViewer.tsx's ag-grid usage — ag-grid has its own
    // theming system, separate from the MUI theme in ThemeContext.tsx.
    const gridTheme = useMemo(() => {
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

    const columnDefs = useMemo<ColDef[]>(
        () => headers.map((header, index) => ({ headerName: header, field: `col${index}` })),
        [headers]
    );

    const rowData = useMemo(
        () =>
            rows.map((row) =>
                row.reduce<Record<string, string>>((acc, cell, index) => {
                    acc[`col${index}`] = cell;
                    return acc;
                }, {})
            ),
        [rows]
    );

    return (
        <Box sx={{ width: '100%', my: 1 }}>
            <AgGridReact
                theme={gridTheme}
                columnDefs={columnDefs}
                rowData={rowData}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
            />
        </Box>
    );
};

export default BaileyTable;
