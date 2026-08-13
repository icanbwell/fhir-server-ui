import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentViewer from './DocumentViewer';
import BaseApi from '../api/baseApi';

// Inline base64 for "hello" — lets AttachmentPreview resolve content synchronously with no
// network call, so these tests only need to mock DocumentViewer's own resource fetch below.
const textAttachment = (title: string) => ({
    contentType: 'text/plain',
    data: 'aGVsbG8=',
    title,
});

describe('DocumentViewer', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders every content[] entry for a DocumentReference (wrapped-array shape)', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: {
                resourceType: 'DocumentReference',
                id: 'doc-1',
                content: [{ attachment: textAttachment('First') }, { attachment: textAttachment('Second') }],
            },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/DocumentReference/doc-1" />);

        expect(await screen.findByText('DocumentReference/doc-1')).toBeInTheDocument();
        expect(await screen.findByText('First')).toBeInTheDocument();
        expect(screen.getByText('Second')).toBeInTheDocument();
    });

    it('renders a Binary resource directly (whole-resource shape)', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: { resourceType: 'Binary', id: 'bin-1', contentType: 'text/plain', data: 'aGVsbG8=' },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/Binary/bin-1" />);

        expect(await screen.findByText('Binary/bin-1')).toBeInTheDocument();
    });

    it('isolates one entry of a bare-array field (DiagnosticReport.presentedForm) by contentIndex', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: {
                resourceType: 'DiagnosticReport',
                id: 'dr-1',
                presentedForm: [textAttachment('Page 1'), textAttachment('Page 2')],
            },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/DiagnosticReport/dr-1" contentIndex={1} />);

        expect(await screen.findByText(/DiagnosticReport\/dr-1.*content 2 of 2/)).toBeInTheDocument();
        expect(screen.getByText('Page 2')).toBeInTheDocument();
        expect(screen.queryByText('Page 1')).not.toBeInTheDocument();
    });

    it('renders a single-attachment field (Media.content) without requiring a content index', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: { resourceType: 'Media', id: 'media-1', content: textAttachment('Recording') },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/Media/media-1" />);

        expect(await screen.findByText('Media/media-1')).toBeInTheDocument();
        expect(screen.getByText('Recording')).toBeInTheDocument();
    });

    it('shows an error for a resource type the Document Viewer does not support', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: { resourceType: 'Observation', id: 'obs-1' },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/Observation/obs-1" />);

        expect(await screen.findByText(/does not support resource type "Observation"/i)).toBeInTheDocument();
    });
});
