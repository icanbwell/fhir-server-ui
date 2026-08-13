import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Attachment from './Attachment';

const renderAttachment = (props: React.ComponentProps<typeof Attachment>) =>
    render(
        <MemoryRouter>
            <Attachment {...props} />
        </MemoryRouter>
    );

describe('Attachment', () => {
    it('renders a "View in Document Viewer" link for a supported resource type', () => {
        const { container } = renderAttachment({
            attachment: { contentType: 'application/pdf', title: 'Report' },
            name: 'Presented Form',
            resourceType: 'DiagnosticReport',
            id: 'dr-1',
        });

        const link = container.querySelector('a[href="/document-viewer/4_0_0/DiagnosticReport/dr-1"]');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('aria-label', 'View in Document Viewer');
    });

    it('omits the content index when there is only one attachment entry', () => {
        const { container } = renderAttachment({
            attachment: { contentType: 'image/png', title: 'Photo' },
            name: 'Photo',
            resourceType: 'Patient',
            id: 'pat-1',
        });

        const link = container.querySelector('a[href="/document-viewer/4_0_0/Patient/pat-1"]');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('aria-label', 'View in Document Viewer');
    });

    it('includes a per-entry content index when there are multiple attachment entries', () => {
        const { container } = renderAttachment({
            attachment: [
                { contentType: 'image/png', title: 'Photo 1' },
                { contentType: 'image/png', title: 'Photo 2' },
            ],
            name: 'Photo',
            resourceType: 'Practitioner',
            id: 'prac-1',
        });

        const link0 = container.querySelector('a[href="/document-viewer/4_0_0/Practitioner/prac-1/0"]');
        const link1 = container.querySelector('a[href="/document-viewer/4_0_0/Practitioner/prac-1/1"]');
        expect(link0).toBeInTheDocument();
        expect(link1).toBeInTheDocument();
        expect(link0).toHaveAttribute('aria-label', 'View in Document Viewer');
        expect(link1).toHaveAttribute('aria-label', 'View in Document Viewer');
    });

    it('renders no Document Viewer link for a resource type outside the supported list', () => {
        const { container } = renderAttachment({
            attachment: { contentType: 'text/plain' },
            name: 'Note',
            resourceType: 'Observation',
            id: 'obs-1',
        });

        const links = container.querySelectorAll('a[aria-label="View in Document Viewer"]');
        expect(links).toHaveLength(0);
    });
});
