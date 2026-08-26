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

    it('does not mark a column of bare 4-digit numbers (e.g. a zip code or count) as a date column', () => {
        const headers = ['zip'];
        const dataRows = [['2026'], ['9021']];
        const { columnDefs, rowData } = buildSheetColumnsAndRows(headers, dataRows, false);
        expect(columnDefs[0].cellDataType).toBeUndefined();
        expect(rowData[0].col0).toBe('2026');
    });

    it('formats a date-only column value without fabricating a time-of-day', () => {
        const headers = ['birthDate'];
        const dataRows = [['1990-05-15']];
        const { columnDefs } = buildSheetColumnsAndRows(headers, dataRows, false);
        const formatted = (columnDefs[0].valueFormatter as (params: { value?: Date | null }) => string)({
            value: new Date('1990-05-15'),
        });
        expect(formatted).not.toMatch(/\d{1,2}:\d{2}/);
    });

    it('formats a date-time column value including the time-of-day', () => {
        const headers = ['lastUpdated'];
        const dataRows = [['2026-01-05T15:58:00Z']];
        const { columnDefs } = buildSheetColumnsAndRows(headers, dataRows, false);
        const formatted = (columnDefs[0].valueFormatter as (params: { value?: Date | null }) => string)({
            value: new Date('2026-01-05T15:58:00Z'),
        });
        expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it('recognizes already-parsed Date cells (xlsx date-typed cells) as a date column and sorts them chronologically', () => {
        // The xlsx viewer fetches application/vnd.ms-excel, not CSV - the xlsx library parses
        // genuine Excel date cells into real Date instances rather than ISO-8601 text, unlike
        // the CSV path. This reproduces that shape (out-of-order on purpose).
        const headers = ['lastUpdated'];
        const dataRows = [
            [new Date('2026-06-16T16:18:10Z')],
            [new Date('2026-05-18T16:44:17Z')],
            [new Date('2026-06-03T02:17:56Z')],
        ];
        const { columnDefs, rowData } = buildSheetColumnsAndRows(headers, dataRows, false);

        expect(columnDefs[0].cellDataType).toBe('date');
        expect(rowData.map((row) => row.col0)).toEqual([
            new Date('2026-06-16T16:18:10Z'),
            new Date('2026-05-18T16:44:17Z'),
            new Date('2026-06-03T02:17:56Z'),
        ]);
        const formatted = (columnDefs[0].valueFormatter as (params: { value?: Date | null }) => string)({
            value: rowData[0].col0 as Date,
        });
        expect(formatted).toMatch(/\d{1,2}:\d{2}/);
        expect(formatted).not.toMatch(/^Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
    });

    it('recognizes Date.prototype.toString()-shaped text cells (server-stringified dates, not ISO text or a native xlsx Date cell) as a date column', () => {
        // Some server-generated exports stringify date values via JS's default Date.toString()
        // shape instead of ISO-8601 text or a native Excel date cell. That shape has no '-', so
        // it previously failed both parseCellDate branches and the column fell back to
        // lexicographic text sort - which sorts by weekday abbreviation first ("Mon" < "Thu" <
        // "Tue" < "Wed"), reproducing the exact out-of-order row sequence seen in production.
        const headers = ['lastUpdated'];
        const dataRows = [
            ['Mon May 18 2026 16:44:17 GMT+0000 (Coordinated Universal Time)'],
            ['Tue Jun 16 2026 16:18:10 GMT+0000 (Coordinated Universal Time)'],
            ['Wed Jun 03 2026 02:17:56 GMT+0000 (Coordinated Universal Time)'],
        ];
        const { columnDefs, rowData } = buildSheetColumnsAndRows(headers, dataRows, false);

        expect(columnDefs[0].cellDataType).toBe('date');
        expect(rowData.map((row) => (row.col0 as Date).toISOString())).toEqual([
            '2026-05-18T16:44:17.000Z',
            '2026-06-16T16:18:10.000Z',
            '2026-06-03T02:17:56.000Z',
        ]);
    });

    it('formats an already-parsed date-only Date cell without fabricating a time-of-day', () => {
        const headers = ['birthDate'];
        const dataRows = [[new Date('1990-05-15T00:00:00Z')]];
        const { columnDefs } = buildSheetColumnsAndRows(headers, dataRows, false);
        const formatted = (columnDefs[0].valueFormatter as (params: { value?: Date | null }) => string)({
            value: new Date('1990-05-15T00:00:00Z'),
        });
        expect(formatted).not.toMatch(/\d{1,2}:\d{2}/);
    });
});
