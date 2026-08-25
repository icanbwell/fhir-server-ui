import { describe, expect, it } from 'vitest';
import { buildSheetColumnsAndRows } from './spreadsheetColumns';

describe('buildSheetColumnsAndRows', () => {
    it('marks a column as a date column and stores real Date values when every non-blank cell is an ISO date', () => {
        const headers = ['lastUpdated', 'name'];
        const dataRows = [
            ['2026-01-05T00:00:00Z', 'Alice'],
            ['2024-12-01T00:00:00Z', 'Bob'],
        ];
        const { columnDefs, rowData } = buildSheetColumnsAndRows(headers, dataRows, false);

        expect(columnDefs[0].cellDataType).toBe('date');
        expect(rowData[0].col0).toBeInstanceOf(Date);
        expect((rowData[0].col0 as Date).toISOString()).toBe('2026-01-05T00:00:00.000Z');
        expect(columnDefs[1].cellDataType).toBeUndefined();
        expect(rowData[0].col1).toBe('Alice');
    });

    it('does not mark a column as a date column when any non-blank cell is not a parseable ISO date', () => {
        const headers = ['mixed'];
        const dataRows = [['2026-01-05T00:00:00Z'], ['not-a-date']];
        const { columnDefs } = buildSheetColumnsAndRows(headers, dataRows, false);
        expect(columnDefs[0].cellDataType).toBeUndefined();
    });

    it('ignores blank cells when deciding whether a column is a date column, and stores them as null', () => {
        const headers = ['maybeDate'];
        const dataRows = [['2026-01-05T00:00:00Z'], ['']];
        const { columnDefs, rowData } = buildSheetColumnsAndRows(headers, dataRows, false);
        expect(columnDefs[0].cellDataType).toBe('date');
        expect(rowData[1].col0).toBeNull();
    });

    it('hides columns with no data when hideEmptyColumns is true', () => {
        const headers = ['empty'];
        const dataRows: unknown[][] = [[''], [undefined]];
        const { columnDefs } = buildSheetColumnsAndRows(headers, dataRows, true);
        expect(columnDefs[0].hide).toBe(true);
    });

    it('defaults lastUpdated to sort descending, matching the pre-existing behavior', () => {
        const headers = ['lastUpdated'];
        const dataRows = [['2026-01-05T00:00:00Z']];
        const { columnDefs } = buildSheetColumnsAndRows(headers, dataRows, false);
        expect(columnDefs[0].sort).toBe('desc');
    });
});
