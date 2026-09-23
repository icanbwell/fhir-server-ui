import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DownloadEverythingButton from './DownloadEverythingButton';

// EnvironmentContext.ts fires a real FhirApi.getVersion() network call at module-import
// time; this hoisted mock (scoped to this test file only — see DocumentViewer.test.tsx for
// the same pattern) neutralizes it so it resolves harmlessly instead of throwing in jsdom.
vi.mock('../api/fhirApi', () => ({
    default: class {
        getVersion() {
            return Promise.resolve('4.0.0');
        }
    },
}));

const downloadFileMock = vi.fn();
vi.mock('../api/baseApi', () => ({
    default: class {
        downloadFile(...args: unknown[]) {
            return downloadFileMock(...args);
        }
    },
}));

const saveAsMock = vi.fn();
vi.mock('file-saver', () => ({
    saveAs: (...args: unknown[]) => saveAsMock(...args),
}));

describe('DownloadEverythingButton', () => {
    beforeEach(() => {
        downloadFileMock.mockReset();
        saveAsMock.mockReset();
    });

    it('downloads $everything for a Patient and saves it with a Patient-scoped filename', async () => {
        const blob = new Blob(['{"resourceType":"Bundle"}'], { type: 'application/fhir+json' });
        downloadFileMock.mockResolvedValue({ status: 200, data: blob, headers: {} });

        render(<DownloadEverythingButton resourceType="Patient" id="patient-1" />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => expect(saveAsMock).toHaveBeenCalled());

        expect(downloadFileMock).toHaveBeenCalledWith(
            '/4_0_0/Patient/$everything',
            expect.objectContaining({
                params: { id: 'patient-1', _format: 'json', contained: 'true' },
            })
        );
        expect(saveAsMock).toHaveBeenCalledWith(blob, 'Patient-patient-1-everything.json');
    });

    it('downloads $everything for a Person and saves it with a Person-scoped filename', async () => {
        const blob = new Blob(['{"resourceType":"Bundle"}'], { type: 'application/fhir+json' });
        downloadFileMock.mockResolvedValue({ status: 200, data: blob, headers: {} });

        render(<DownloadEverythingButton resourceType="Person" id="person-1" />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => expect(saveAsMock).toHaveBeenCalled());

        expect(downloadFileMock).toHaveBeenCalledWith(
            '/4_0_0/Person/$everything',
            expect.objectContaining({
                params: { id: 'person-1', _format: 'json', contained: 'true' },
            })
        );
        expect(saveAsMock).toHaveBeenCalledWith(blob, 'Person-person-1-everything.json');
    });

    it('shows an error message and does not save a file when the download fails', async () => {
        downloadFileMock.mockRejectedValue(new Error('Request failed with status 500'));

        render(<DownloadEverythingButton resourceType="Patient" id="patient-1" />);
        fireEvent.click(screen.getByRole('button'));

        expect(await screen.findByText(/Request failed with status 500/)).toBeInTheDocument();
        expect(saveAsMock).not.toHaveBeenCalled();
    });

    it('does nothing when id is missing', async () => {
        render(<DownloadEverythingButton resourceType="Patient" />);
        fireEvent.click(screen.getByRole('button'));

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(downloadFileMock).not.toHaveBeenCalled();
        expect(saveAsMock).not.toHaveBeenCalled();
    });
});
