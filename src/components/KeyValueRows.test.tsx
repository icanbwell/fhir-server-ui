import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import KeyValueRows from './KeyValueRows';

describe('KeyValueRows', () => {
    it('renders each row key/value into labeled text fields', () => {
        render(
            <KeyValueRows
                rows={[
                    { key: 'Content-Type', value: 'application/json' },
                    { key: 'Accept', value: '*/*' },
                ]}
            />
        );

        const keys = screen.getAllByLabelText('Key') as HTMLInputElement[];
        const values = screen.getAllByLabelText('Value') as HTMLInputElement[];
        expect(keys.map((el) => el.value)).toEqual(['Content-Type', 'Accept']);
        expect(values.map((el) => el.value)).toEqual(['application/json', '*/*']);
    });

    it('calls onChange with the updated row when a key field is edited', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<KeyValueRows rows={[{ key: '', value: '' }]} onChange={onChange} />);

        await user.type(screen.getByLabelText('Key'), 'X');

        expect(onChange).toHaveBeenLastCalledWith([{ key: 'X', value: '' }]);
    });

    it('calls onChange with the row removed when its delete button is clicked', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <KeyValueRows
                rows={[
                    { key: 'a', value: '1' },
                    { key: 'b', value: '2' },
                ]}
                onChange={onChange}
            />
        );

        await user.click(screen.getAllByRole('button', { name: 'Remove row' })[0]);

        expect(onChange).toHaveBeenCalledWith([{ key: 'b', value: '2' }]);
    });

    it('calls onChange with a new empty row appended when "Add header" is clicked', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<KeyValueRows rows={[{ key: 'a', value: '1' }]} onChange={onChange} />);

        await user.click(screen.getByRole('button', { name: /add header/i }));

        expect(onChange).toHaveBeenCalledWith([
            { key: 'a', value: '1' },
            { key: '', value: '' },
        ]);
    });

    it('hides add/remove controls and disables inputs when readOnly', () => {
        render(<KeyValueRows rows={[{ key: 'a', value: '1' }]} readOnly />);

        expect(screen.queryByRole('button', { name: /add header/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Remove row' })).not.toBeInTheDocument();
        expect(screen.getByLabelText('Key')).toBeDisabled();
        expect(screen.getByLabelText('Value')).toBeDisabled();
    });

    it('supports custom key/value labels', () => {
        render(<KeyValueRows rows={[{ key: 'a', value: '1' }]} keyLabel="Header" valueLabel="Content" />);

        expect(screen.getByLabelText('Header')).toBeInTheDocument();
        expect(screen.getByLabelText('Content')).toBeInTheDocument();
    });
});
