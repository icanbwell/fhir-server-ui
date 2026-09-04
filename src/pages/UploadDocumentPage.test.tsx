import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeContextProvider } from '../context/ThemeContext';
import FhirApi from '../api/fhirApi';
import { SecurityTagSystem } from '../utils/securityTagSystem';
import UploadDocumentPage from './UploadDocumentPage';

const BWELL_OWNER_SECURITY_TAGS = [
    { system: SecurityTagSystem.owner, code: 'bwell' },
    { system: SecurityTagSystem.access, code: 'bwell' },
    { system: SecurityTagSystem.sourceAssigningAuthority, code: 'bwell' },
];

const renderPage = (initialPath = '/document-upload/4_0_0/Patient/pat-1') =>
    render(
        <ThemeContextProvider>
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route path="/document-upload/4_0_0/:resourceType/:id" element={<UploadDocumentPage />} />
                    <Route path="/4_0_0/:resourceType/:id" element={<div>Viewing resource</div>} />
                </Routes>
            </MemoryRouter>
        </ThemeContextProvider>
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

    it('creates a DocumentReference with the file inlined as attachment data and navigates to it on success', async () => {
        const mergeResource = vi
            .spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({ status: 200, json: { resourceType: 'DocumentReference' }, incomplete: false });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        await waitFor(() => expect(screen.getByText('Viewing resource')).toBeInTheDocument());

        expect(mergeResource).toHaveBeenCalledTimes(1);

        const [docRefCall] = mergeResource.mock.calls;
        expect(docRefCall[0]).toMatchObject({
            resourceType: 'DocumentReference',
            resource: {
                resourceType: 'DocumentReference',
                status: 'current',
                meta: {
                    source: 'https://www.icanbwell.com/fhir-server-ui',
                    security: [
                        ...BWELL_OWNER_SECURITY_TAGS,
                        { system: SecurityTagSystem.sourcePatientId, code: 'Patient/pat-1' },
                    ],
                },
                subject: { reference: 'Patient/pat-1' },
                content: [
                    {
                        attachment: {
                            contentType: 'application/pdf',
                            data: expect.any(String),
                            size: pdfFile().size,
                            title: 'note.pdf',
                        },
                    },
                ],
            },
        });
        expect((docRefCall[0].resource as any).content[0].attachment.url).toBeUndefined();
    });

    it('shows an error and does not navigate if the DocumentReference write fails', async () => {
        const mergeResource = vi
            .spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({ status: 500, json: { error: 'boom' }, incomplete: false });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        expect(await screen.findByText(/failed to create documentreference/i)).toBeInTheDocument();
        expect(mergeResource).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Viewing resource')).not.toBeInTheDocument();
    });

    it('treats an OperationOutcome response as a write failure even with 200 status', async () => {
        const mergeResource = vi
            .spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({
                status: 200,
                json: {
                    resourceType: 'OperationOutcome',
                    issue: [{ severity: 'error', code: 'validation', details: { text: 'Invalid data' } }],
                },
                incomplete: false,
            });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        expect(await screen.findByText(/failed to create documentreference/i)).toBeInTheDocument();
        expect(mergeResource).toHaveBeenCalledTimes(1);
    });

    it('treats a MergeResultEntry with created/updated false as a write failure even with 200 status', async () => {
        const mergeResource = vi
            .spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({
                status: 200,
                json: {
                    resourceType: 'DocumentReference',
                    id: 'd9b81839-391d-4935-bbcb-371d415e6fe7',
                    created: false,
                    updated: false,
                    issue: {
                        severity: 'error',
                        code: 'forbidden',
                        details: { text: 'Write not allowed using user scopes if patient scope is present' },
                        diagnostics: 'Write not allowed using user scopes if patient scope is present',
                    },
                    operationOutcome: {
                        resourceType: 'OperationOutcome',
                        issue: [
                            {
                                severity: 'error',
                                code: 'forbidden',
                                diagnostics: 'Write not allowed using user scopes if patient scope is present',
                            },
                        ],
                    },
                },
                incomplete: false,
            });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        expect(
            await screen.findByText(/failed to create documentreference.*write not allowed using user scopes/i)
        ).toBeInTheDocument();
        expect(mergeResource).toHaveBeenCalledTimes(1);
    });

    it('treats an incomplete response as a failure even with 200 status', async () => {
        const mergeResource = vi
            .spyOn(FhirApi.prototype, 'mergeResource')
            .mockResolvedValueOnce({ status: 200, json: undefined, incomplete: true });

        renderPage();
        fireEvent.change(screen.getByTestId('upload-document-file-input'), { target: { files: [pdfFile()] } });
        fireEvent.click(screen.getByRole('button', { name: /upload/i }));

        expect(
            await screen.findByText(/failed to create documentreference: connection dropped/i)
        ).toBeInTheDocument();
        expect(mergeResource).toHaveBeenCalledTimes(1);
    });

    it('shows an error and does not render form for unsupported resource type', () => {
        const mergeResource = vi.spyOn(FhirApi.prototype, 'mergeResource');
        renderPage('/document-upload/4_0_0/Observation/obs-1');

        expect(screen.getByText(/unsupported resource type for document upload/i)).toBeInTheDocument();
        expect(screen.getByText(/only patient and person are supported/i)).toBeInTheDocument();
        expect(screen.queryByTestId('upload-document-file-input')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /upload/i })).not.toBeInTheDocument();
        expect(mergeResource).not.toHaveBeenCalled();
    });
});
