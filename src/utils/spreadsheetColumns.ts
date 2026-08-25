import type { ColDef } from 'ag-grid-community';
import { formatHumanDate, looksLikeIsoDate } from './dateFormat';

export interface SpreadsheetColumnsResult {
    columnDefs: ColDef[];
    rowData: Record<string, unknown>[];
}

const cellText = (value: unknown): string => (value === undefined || value === null ? '' : String(value));

// The xlsx viewer (ExcelViewerPage) fetches `application/vnd.ms-excel`, not CSV - the `xlsx`
// library auto-parses genuine Excel date cells into real Date instances (with `raw: true`),
// rather than leaving them as ISO-8601 text. Stringifying a Date via cellText() produces JS's
// default `Date.toString()` shape ("Mon May 18 2026 16:44:17 GMT+0000..."), which doesn't match
// looksLikeIsoDate - so those cells must be recognized directly, not via their stringified form.
// For text cells, also requires a '-' so a column of bare 4-digit numbers (counts, MRNs, zip
// codes) isn't misclassified as dates via looksLikeIsoDate's year-only ISO date branch.
const parseCellDate = (cell: unknown): Date | null => {
    if (cell instanceof Date) {
        return isNaN(cell.getTime()) ? null : cell;
    }
    const text = cellText(cell);
    return text.includes('-') && looksLikeIsoDate(text) ? new Date(text) : null;
};

export const buildSheetColumnsAndRows = (
    headers: unknown[],
    dataRows: unknown[][],
    hideEmptyColumns: boolean
): SpreadsheetColumnsResult => {
    // Decided once per column (not per cell) — a column can't sort numerically/chronologically
    // for some rows and lexicographically for others.
    const columnIsDate = headers.map((_, index) => {
        const cells = dataRows.map((row) => row[index]).filter((cell) => cellText(cell).trim() !== '');
        return cells.length > 0 && cells.every((cell) => parseCellDate(cell) !== null);
    });

    // Tracks whether a date column's values include a time component, so the valueFormatter
    // below doesn't fabricate a 'T00:00:00.000Z' time for date-only values — Date.toISOString()
    // always includes a time, which would otherwise make formatHumanDate render a spurious
    // hour/minute/timezone that never existed in the source data. Checked on the parsed Date
    // (not the raw cell) so this works for both ISO-text and already-parsed Date cells alike.
    const columnHasTime = headers.map((_, index) => {
        if (!columnIsDate[index]) {
            return false;
        }
        return dataRows.some((row) => {
            const parsed = parseCellDate(row[index]);
            return (
                parsed !== null &&
                (parsed.getUTCHours() !== 0 ||
                    parsed.getUTCMinutes() !== 0 ||
                    parsed.getUTCSeconds() !== 0 ||
                    parsed.getUTCMilliseconds() !== 0)
            );
        });
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
            acc[field] = columnIsDate[index] ? parseCellDate(cell) : cellText(cell);
            return acc;
        }, {})
    );

    return { columnDefs, rowData };
};
