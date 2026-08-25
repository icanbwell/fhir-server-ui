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
    // Also requires a '-' so a column of bare 4-digit numbers (counts, MRNs, zip codes) isn't
    // misclassified as dates via looksLikeIsoDate's year-only ISO date branch.
    const columnIsDate = headers.map((_, index) => {
        const cells = dataRows.map((row) => cellText(row[index])).filter((text) => text.trim() !== '');
        return cells.length > 0 && cells.every((text) => looksLikeIsoDate(text) && text.includes('-'));
    });

    // Tracks whether a date column's values include a time component, so the valueFormatter
    // below doesn't fabricate a 'T00:00:00.000Z' time for date-only values — Date.toISOString()
    // always includes a time, which would otherwise make formatHumanDate render a spurious
    // hour/minute/timezone that never existed in the source data.
    const columnHasTime = headers.map(
        (_, index) => columnIsDate[index] && dataRows.some((row) => cellText(row[index]).includes('T'))
    );

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
                      valueFormatter: (params: { value?: Date | null }) => {
                          if (!params.value) {
                              return '';
                          }
                          const iso = params.value.toISOString();
                          return formatHumanDate(columnHasTime[index] ? iso : iso.slice(0, 10)) ?? '';
                      },
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
