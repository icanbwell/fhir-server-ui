import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('BaileyTable', () => {
    it('builds ag-grid column defs and row data from headers and rows', () => {
        render(
            <ThemeContextProvider>
                <BaileyTable
                    headers={['Name', 'Age']}
                    rows={[
                        ['Imran', '30'],
                        ['Bob', '40'],
                    ]}
                />
            </ThemeContextProvider>
        );

        expect(agGridPropsSpy).toHaveBeenCalledTimes(1);
        const props = agGridPropsSpy.mock.calls[0][0] as { columnDefs: unknown; rowData: unknown };
        expect(props.columnDefs).toEqual([
            { headerName: 'Name', field: 'col0' },
            { headerName: 'Age', field: 'col1' },
        ]);
        expect(props.rowData).toEqual([
            { col0: 'Imran', col1: '30' },
            { col0: 'Bob', col1: '40' },
        ]);
    });
});
