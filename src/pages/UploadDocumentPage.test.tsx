import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock FhirApi for module-level EnvironmentContext initialization.
// vi.mock() is hoisted before imports, so this prevents the unhandled promise rejection
// from EnvironmentContext's module-level getVersion() call when FHIR_SERVER_URL is undefined.
vi.mock('../api/fhirApi', () => ({
    default: class {
        getVersion() {
            return Promise.resolve('4.0.0');
        }
        mergeResource() {
            return Promise.resolve({ status: 200, json: {}, incomplete: false });
        }
    },
}));

// Mock Header and Footer to avoid theme provider requirements
vi.mock('../components/Header', () => ({
    default: () => <div data-testid="mock-header" />,
}));

vi.mock('../components/Footer', () => ({
    default: () => <div data-testid="mock-footer" />,
}));

import FhirApi from '../api/fhirApi';
import UploadDocumentPage from './UploadDocumentPage';

const renderPage = (initialPath = '/document-upload/4_0_0/Patient/pat-1') =>
    render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path="/document-upload/4_0_0/:resourceType/:id" element={<UploadDocumentPage />} />
                <Route path="/4_0_0/:resourceType/:id" element={<div>Viewing resource</div>} />
            </Routes>
        </MemoryRouter>
    );

const pdfFile = () => new File(['%PDF-1.4'], 'note.pdf', { type: 'application/pdf' });

describe('UploadDocumentPage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the subject reference resolved from the route, including the Person compartment prefix', () => {
        renderPage('/document-upload/4_0_0/Person/per-1');
        expect(screen.getByText(/Patient\/person\.per-1/)).toBeInTheDocument();
    });

    it('rejects an unsupported file without calling mergeResource', () => {
        const mergeResource = vi.spyOn(FhirApi.prototype, 'mergeResource');
        renderPage();

        const input = screen.getByTestId('upload-document-file-input');
        fireEvent.change(input, { target: { files: [new File(['x'], 'bad.zip', { type: 'application/zip' })] } });

        expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
        expect(mergeResource).not.toHaveBeenCalled();
    });

    it('creates a Binary then a DocumentReference and navigates to the new DocumentReference on success', async () => {
        const mergeResource = vi
            .spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({ status: 200, json: { resourceType: 'Binary' }, incomplete: false })
            .mockResolvedValueOnce({ status: 200, json: { resourceType: 'DocumentReference' }, incomplete: false });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        await waitFor(() => expect(screen.getByText('Viewing resource')).toBeInTheDocument());

        expect(mergeResource).toHaveBeenCalledTimes(2);

        const [binaryCall, docRefCall] = mergeResource.mock.calls;
        expect(binaryCall[0]).toMatchObject({
            resourceType: 'Binary',
            resource: { resourceType: 'Binary', contentType: 'application/pdf' },
        });
        const binaryId = binaryCall[0].id;
        expect(binaryCall[0].resource).toMatchObject({ id: binaryId, data: expect.any(String) });

        expect(docRefCall[0]).toMatchObject({
            resourceType: 'DocumentReference',
            resource: {
                resourceType: 'DocumentReference',
                status: 'current',
                subject: { reference: 'Patient/pat-1' },
                content: [
                    {
                        attachment: {
                            contentType: 'application/pdf',
                            url: `Binary/${binaryId}`,
                            title: 'note.pdf',
                        },
                    },
                ],
            },
        });
    });

    it('stops before creating a DocumentReference if the Binary write fails', async () => {
        const mergeResource = vi
            .spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({ status: 500, json: { error: 'boom' }, incomplete: false });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        expect(await screen.findByText(/failed to create binary/i)).toBeInTheDocument();
        expect(mergeResource).toHaveBeenCalledTimes(1);
    });

    it('surfaces the orphaned Binary link if the DocumentReference write fails after the Binary succeeds', async () => {
        vi.spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({ status: 200, json: { resourceType: 'Binary' }, incomplete: false })
            .mockResolvedValueOnce({ status: 500, json: { error: 'boom' }, incomplete: false });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        expect(await screen.findByText(/failed to create documentreference/i)).toBeInTheDocument();
        const binaryLink = screen.getByRole('link', { name: /binary\//i });
        expect(binaryLink.getAttribute('href')).toMatch(/^\/4_0_0\/Binary\//);
    });
});
