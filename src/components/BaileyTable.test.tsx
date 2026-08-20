import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const agGridPropsSpy = vi.fn();

// ag-grid's own rendering is gated behind ResizeObserver-driven layout measurement that jsdom
// (no real layout engine) never satisfies. That's ag-grid's internals, not BaileyTable's logic —
// so this mocks the library at the module boundary and asserts on what BaileyTable computed and
// handed it (columnDefs/rowData), rather than fighting jsdom to get real cells to render.
vi.mock('ag-grid-react', () => ({
    AgGridReact: (props: unknown) => {
        agGridPropsSpy(props);
        return null;
    },
}));

import BaileyTable from './BaileyTable';
import { ThemeContextProvider } from '../context/ThemeContext';
import type { BaileyTableCell } from '@icanbwell/baileyai-chat-ui';

const cell = (text: string, href?: string): BaileyTableCell => (href ? { text, href } : { text });

describe('BaileyTable', () => {
    // Without this, agGridPropsSpy.mock.calls[0] always refers to the FIRST render across the
    // whole test file (module-level mock, not reset by default), not the current test's render.
    beforeEach(() => {
        agGridPropsSpy.mockClear();
    });

    it('builds ag-grid column defs and row data for plain text columns', () => {
        render(
            <ThemeContextProvider>
                <BaileyTable
                    headers={['Name', 'Notes']}
                    rows={[
                        [cell('Imran'), cell('n/a')],
                        [cell('Bob'), cell('follow up')],
                    ]}
                />
            </ThemeContextProvider>
        );

        expect(agGridPropsSpy).toHaveBeenCalledTimes(1);
        const props = agGridPropsSpy.mock.calls[0][0] as { columnDefs: unknown; rowData: unknown };
        expect(props.columnDefs).toEqual([
            { headerName: 'Name', field: 'col0' },
            { headerName: 'Notes', field: 'col1' },
        ]);
        expect(props.rowData).toEqual([
            { col0: 'Imran', col1: 'n/a' },
            { col0: 'Bob', col1: 'follow up' },
        ]);
    });

    it('marks a column as numeric and coerces its values when every cell parses as a number', () => {
        render(
            <ThemeContextProvider>
                <BaileyTable
                    headers={['Name', 'Age']}
                    rows={[
                        [cell('Imran'), cell('30')],
                        [cell('Bob'), cell('9')],
                    ]}
                />
            </ThemeContextProvider>
        );

        const props = agGridPropsSpy.mock.calls[0][0] as { columnDefs: Array<Record<string, unknown>>; rowData: unknown };
        expect(props.columnDefs[1]).toMatchObject({ headerName: 'Age', field: 'col1', cellDataType: 'number' });
        expect(props.rowData).toEqual([
            { col0: 'Imran', col1: 30 },
            { col0: 'Bob', col1: 9 },
        ]);
    });

    it('leaves a blank cell in a numeric column as null instead of coercing it to 0', () => {
        render(
            <ThemeContextProvider>
                <BaileyTable headers={['Value']} rows={[[cell('5')], [cell('')], [cell('3')]]} />
            </ThemeContextProvider>
        );

        const props = agGridPropsSpy.mock.calls[0][0] as { columnDefs: Array<Record<string, unknown>>; rowData: unknown };
        expect(props.columnDefs[0]).toMatchObject({ cellDataType: 'number' });
        expect(props.rowData).toEqual([{ col0: 5 }, { col0: null }, { col0: 3 }]);
    });

    it('does not mark a column numeric when any cell is non-numeric', () => {
        render(
            <ThemeContextProvider>
                <BaileyTable headers={['Value']} rows={[[cell('30')], [cell('n/a')]]} />
            </ThemeContextProvider>
        );

        const props = agGridPropsSpy.mock.calls[0][0] as { columnDefs: Array<Record<string, unknown>> };
        expect(props.columnDefs[0]).not.toHaveProperty('cellDataType');
    });

    it('attaches a cellRenderer and an href sidecar field for a column containing links', () => {
        render(
            <ThemeContextProvider>
                <BaileyTable
                    headers={['Patient']}
                    rows={[[cell('View Patient', 'https://fhir.example.com/Patient/123')], [cell('No link')]]}
                />
            </ThemeContextProvider>
        );

        const props = agGridPropsSpy.mock.calls[0][0] as {
            columnDefs: Array<Record<string, unknown>>;
            rowData: Array<Record<string, unknown>>;
        };
        expect(props.columnDefs[0]).toMatchObject({ headerName: 'Patient', field: 'col0' });
        expect(props.columnDefs[0].cellRenderer).toBeDefined();
        expect(props.rowData).toEqual([
            { col0: 'View Patient', col0Href: 'https://fhir.example.com/Patient/123' },
            { col0: 'No link' },
        ]);
    });
});
