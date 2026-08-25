import type { ColDef } from 'ag-grid-community';
import { formatHumanDate, looksLikeIsoDate } from './dateFormat';

export interface SpreadsheetColumnsResult {
    columnDefs: ColDef[];
    rowData: Record<string, unknown>[];
}

const cellText = (value: unknown): string => (value === undefined || value === null ? '' : String(value));

export const buildSheetColumnsAndRows = (
    headers: unknown[],
    dataRows: unknown[][],
    hideEmptyColumns: boolean
): SpreadsheetColumnsResult => {
    // Decided once per column (not per cell) — a column can't sort numerically/chronologically
    // for some rows and lexicographically for others.
    const columnIsDate = headers.map((_, index) => {
        const cells = dataRows.map((row) => cellText(row[index])).filter((text) => text.trim() !== '');
        return cells.length > 0 && cells.every((text) => looksLikeIsoDate(text));
    });

    const columnDefs: ColDef[] = headers.map((header, index) => {
        const hasData = dataRows.some((row) => cellText(row[index]).trim() !== '');
        return {
            headerName: String(header),
            field: `col${index}`,
            editable: false,
            filter: true,
            floatingFilter: true,
            hide: hideEmptyColumns && !hasData,
            tooltipField: `col${index}`,
            sort: header === 'lastUpdated' ? 'desc' : undefined,
            ...(columnIsDate[index]
                ? {
                      cellDataType: 'date' as const,
                      valueFormatter: (params: { value?: Date | null }) =>
                          params.value ? formatHumanDate(params.value.toISOString()) ?? '' : '',
                  }
                : {}),
        };
    });

    const rowData = dataRows.map((row) =>
        row.reduce<Record<string, unknown>>((acc, cell, index) => {
            const field = `col${index}`;
            if (columnIsDate[index]) {
                const text = cellText(cell);
                acc[field] = text.trim() === '' ? null : new Date(text);
            } else {
                acc[field] = cellText(cell);
            }
            return acc;
        }, {})
    );

    return { columnDefs, rowData };
};
