import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TableComponent from './Table';

describe('TableComponent', () => {
    it('renders a heading, column headers and cell values for an array of rows', () => {
        render(
            <TableComponent
                name="Patients"
                columns={['name', 'age']}
                rows={[
                    { name: 'Alice', age: 30 },
                    { name: 'Bob', age: 40 },
                ]}
            />
        );

        expect(screen.getByRole('heading', { name: 'Patients' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'name' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'age' })).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('wraps a single non-array row object into an array', () => {
        render(<TableComponent name="Patient" columns={['name']} rows={{ name: 'Solo' }} />);

        expect(screen.getByText('Solo')).toBeInTheDocument();
    });

    it('renders nothing when rows is an empty array', () => {
        const { container } = render(<TableComponent name="Patients" columns={['name']} rows={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when the single row is falsy', () => {
        const { container } = render(<TableComponent name="Patients" columns={['name']} rows={[null]} />);

        expect(container).toBeEmptyDOMElement();
    });
});
