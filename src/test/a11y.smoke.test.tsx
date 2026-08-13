import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import KeyValueRows from '../components/KeyValueRows';
import TableComponent from '../components/Table';
import SelectableTable from '../components/SelectableTable';

// Regression guard: runs axe's automated ruleset against a representative sample of
// reusable components. This catches a subset of WCAG issues (missing labels/roles,
// invalid ARIA); it can't see keyboard behavior or live-region announcements, so it's
// necessary but not sufficient. Extend this list when adding a new reusable component.
describe('a11y smoke', () => {
    it('KeyValueRows has no axe violations', async () => {
        const { container } = render(
            <KeyValueRows rows={[{ key: 'Content-Type', value: 'application/json' }]} onChange={() => {}} />
        );

        expect(await axe(container)).toHaveNoViolations();
    });

    it('Table has no axe violations', async () => {
        const { container } = render(
            <TableComponent
                name="Patients"
                columns={['name', 'age']}
                rows={[{ name: 'Alice', age: 30 }]}
            />
        );

        expect(await axe(container)).toHaveNoViolations();
    });

    it('SelectableTable has no axe violations', async () => {
        const { container } = render(
            <SelectableTable
                name="Patients"
                rows={[{ id: 'p1', name: 'Alice' }]}
                columns={['name']}
                onSelectionChange={() => {}}
                getRowId={(row) => row.id}
            />
        );

        expect(await axe(container)).toHaveNoViolations();
    });
});
