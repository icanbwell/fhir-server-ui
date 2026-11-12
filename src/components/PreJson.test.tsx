import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PreJson from './PreJson';

vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ isDarkMode: false }),
}));

const saveAsMock = vi.fn();
vi.mock('file-saver', () => ({
    saveAs: (...args: unknown[]) => saveAsMock(...args),
}));

const readBlob = (blob: Blob): Promise<string> =>
    new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
    });

describe('PreJson download', () => {
    beforeEach(() => saveAsMock.mockReset());

    it.each([
        ['resourceType and id', { resourceType: 'Patient', id: 'p1' }, 'Patient-p1.json'],
        ['resourceType only', { resourceType: 'Bundle' }, 'Bundle.json'],
        ['neither', { foo: 'bar' }, 'response.json'],
    ])('names the file from %s', (_label, data, expected) => {
        render(<PreJson data={data} />);
        fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));
        expect(saveAsMock).toHaveBeenCalledWith(expect.any(Blob), expected);
    });

    it('prefers an explicit filename and saves pretty-printed JSON', async () => {
        const data = { resourceType: 'Patient', id: 'p1' };
        render(<PreJson data={data} filename="custom.json" />);
        fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));

        const [blob, name] = saveAsMock.mock.calls[0];
        expect(name).toBe('custom.json');
        expect(await readBlob(blob)).toBe(JSON.stringify(data, null, 2));
    });

    it.each([['null', null], ['a string', 'plain text']])(
        'renders no download button when data is %s',
        (_label, data) => {
            render(<PreJson data={data} />);
            expect(screen.queryByRole('button', { name: 'Download JSON' })).toBeNull();
        }
    );
});
