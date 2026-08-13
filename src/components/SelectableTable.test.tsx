import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SelectableTable from './SelectableTable';

const rows = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
];

describe('SelectableTable', () => {
    it('renders a heading, selection count and one row per item', () => {
        render(
            <SelectableTable
                name="Patients"
                rows={rows}
                columns={['id', 'name']}
                onSelectionChange={vi.fn()}
                getRowId={(row) => row.id}
            />
        );

        expect(screen.getByRole('heading', { name: 'Patients' })).toBeInTheDocument();
        expect(screen.getByText('0 of 2 selected')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('selects a row via its checkbox and reports the id', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();
        render(
            <SelectableTable
                name="Patients"
                rows={rows}
                columns={['id', 'name']}
                onSelectionChange={onSelectionChange}
                getRowId={(row) => row.id}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[1]); // index 0 is "select all"

        expect(onSelectionChange).toHaveBeenLastCalledWith(['p1']);
        expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();
    });

    it('selects and deselects all rows via the header checkbox', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();
        render(
            <SelectableTable
                name="Patients"
                rows={rows}
                columns={['id', 'name']}
                onSelectionChange={onSelectionChange}
                getRowId={(row) => row.id}
            />
        );

        const selectAll = screen.getAllByRole('checkbox')[0];
        await user.click(selectAll);
        expect(onSelectionChange).toHaveBeenLastCalledWith(['p1', 'p2']);

        await user.click(selectAll);
        expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    });

    it('toggles selection when a row is clicked', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();
        render(
            <SelectableTable
                name="Patients"
                rows={rows}
                columns={['id', 'name']}
                onSelectionChange={onSelectionChange}
                getRowId={(row) => row.id}
            />
        );

        await user.click(screen.getByText('Bob'));

        expect(onSelectionChange).toHaveBeenLastCalledWith(['p2']);
    });

    it('defaults getRowId to the row index when none is provided', async () => {
        const user = userEvent.setup();
        const onSelectionChange = vi.fn();
        render(<SelectableTable name="Patients" rows={rows} columns={['name']} onSelectionChange={onSelectionChange} />);

        const checkboxes = screen.getAllByRole('checkbox');
        await user.click(checkboxes[1]);

        expect(onSelectionChange).toHaveBeenLastCalledWith([0]);
    });

    it('renders nothing when there are no rows', () => {
        const { container } = render(
            <SelectableTable name="Patients" rows={[]} columns={['name']} onSelectionChange={vi.fn()} />
        );

        expect(container).toBeEmptyDOMElement();
    });
});
