import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock FhirApi for this test file only. EnvironmentContext.ts's module-level call to
// new FhirApi(...).getVersion() will use this mock instead of the real FhirApi, preventing
// the unhandled rejection that occurs when REACT_APP_FHIR_SERVER_URL is undefined in jsdom.
// vi.mock() is hoisted by Vitest's compiler to the top of the file before any imports,
// so EnvironmentContext's module-level code will see this mock. This scoping is local to
// this test file only — no other test files are affected.
vi.mock('../api/fhirApi', () => ({
    default: class {
        getVersion() {
            return Promise.resolve('4.0.0');
        }
    },
}));

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

    it('renders a bare-array field sent by a non-conformant server as a single object, not an array', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: {
                resourceType: 'Patient',
                id: 'pat-1',
                photo: { contentType: 'image/png', data: 'aGVsbG8=', title: 'Solo photo' },
            },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/Patient/pat-1" />);

        expect(await screen.findByText('Solo photo')).toBeInTheDocument();
    });

    it('omits the "content N of M" suffix for a single-attachment field at the real route default (contentIndex=0)', async () => {
        vi.spyOn(BaseApi.prototype, 'getData').mockResolvedValue({
            status: 200,
            incomplete: false,
            json: { resourceType: 'Media', id: 'media-1', content: textAttachment('Recording') },
        });

        render(<DocumentViewer relativeUrl="/4_0_0/Media/media-1" contentIndex={0} />);

        expect(await screen.findByText('Media/media-1')).toBeInTheDocument();
        expect(screen.getByText('Media/media-1')).not.toHaveTextContent(/content 1 of 1/);
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
