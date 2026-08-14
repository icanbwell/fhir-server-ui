import { useMemo } from 'react';
import { Box, Link } from '@mui/material';
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
} from 'ag-grid-community';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useAgGridBrandTheme } from '../hooks/useAgGridBrandTheme';
import { useTheme } from '../context/ThemeContext';
import { isSafeMarkdownUrl } from '../utils/safeMarkdownUrl';
import type { BaileyTableCell } from '../utils/baileyTable';

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
    rows: BaileyTableCell[][];
}

const defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
};

// href is stashed on the row under `${field}Href` (see rowData construction below) rather than
// as the cell value itself, so ag-grid's own sort/filter still operates on the visible text.
const LinkCellRenderer = (params: ICellRendererParams) => {
    const href = params.colDef?.field ? params.data?.[`${params.colDef.field}Href`] : undefined;
    if (typeof href !== 'string' || !isSafeMarkdownUrl(href)) {
        return <>{params.value}</>;
    }
    return (
        <Link href={href} target="_blank" rel="noopener noreferrer">
            {params.value}
        </Link>
    );
};

const isNumericText = (text: string): boolean => text.trim() !== '' && Number.isFinite(Number(text));

const BaileyTable = ({ headers, rows }: BaileyTableProps) => {
    const { isDarkMode } = useTheme();
    const gridTheme = useAgGridBrandTheme(isDarkMode);

    const { columnDefs, rowData } = useMemo(() => {
        // Column-level type inference happens once per column here (not per cell) so every row
        // agrees on whether a column is a link/number/text column — a table can't have some
        // rows sort numerically and others lexicographically within the same column.
        const columnIsLink = headers.map((_, index) => rows.some((row) => row[index]?.href));
        const columnIsNumeric = headers.map((_, index) => {
            if (columnIsLink[index]) {
                return false;
            }
            const cells = rows.map((row) => row[index]).filter((cell): cell is BaileyTableCell => Boolean(cell?.text.trim()));
            return cells.length > 0 && cells.every((cell) => isNumericText(cell.text));
        });

        const defs: ColDef[] = headers.map((header, index) => ({
            headerName: header,
            field: `col${index}`,
            ...(columnIsNumeric[index] ? { cellDataType: 'number' as const } : {}),
            ...(columnIsLink[index] ? { cellRenderer: LinkCellRenderer } : {}),
        }));

        const data = rows.map((row) =>
            row.reduce<Record<string, unknown>>((acc, cellValue, index) => {
                const field = `col${index}`;
                const isBlank = cellValue.text.trim() === '';
                // A numeric column can still have blank cells (e.g. a missing lab value); Number('')
                // is 0, so coercing unconditionally would render a blank as an indistinguishable
                // literal zero. Leave blank cells as null instead of coercing them.
                if (columnIsNumeric[index]) {
                    acc[field] = isBlank ? null : Number(cellValue.text);
                } else {
                    acc[field] = cellValue.text;
                }
                if (cellValue.href) {
                    acc[`${field}Href`] = cellValue.href;
                }
                return acc;
            }, {})
        );

        return { columnDefs: defs, rowData: data };
    }, [headers, rows]);

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
