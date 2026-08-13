import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Attachment from './Attachment';

const renderAttachment = (props: React.ComponentProps<typeof Attachment>) =>
    render(
        <MemoryRouter>
            <Attachment {...props} />
        </MemoryRouter>
    );

// The Document Viewer link lives inside a collapsed MUI Accordion. MUI's Collapse applies
// visibility: hidden to collapsed content, which removes it from the accessibility tree — so
// asserting via screen.getByRole only proves the link is actually reachable by a user once the
// accordion's summary (labeled "Content: <contentType>") has been expanded.
const expandAccordion = async () => {
    await userEvent.click(screen.getByText(/^Content:/));
};

describe('Attachment', () => {
    it('renders a "View in Document Viewer" link for a supported resource type', async () => {
        renderAttachment({
            attachment: { contentType: 'application/pdf', title: 'Report' },
            name: 'Presented Form',
            resourceType: 'DiagnosticReport',
            id: 'dr-1',
        });
        await expandAccordion();

        const link = screen.getByRole('link', { name: /view/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/document-viewer/4_0_0/DiagnosticReport/dr-1');
    });

    it('omits the content index when there is only one attachment entry', async () => {
        renderAttachment({
            attachment: { contentType: 'image/png', title: 'Photo' },
            name: 'Photo',
            resourceType: 'Patient',
            id: 'pat-1',
        });
        await expandAccordion();

        const link = screen.getByRole('link', { name: /view/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/document-viewer/4_0_0/Patient/pat-1');
    });

    it('includes a per-entry content index when there are multiple attachment entries', async () => {
        renderAttachment({
            attachment: [
                { contentType: 'image/png', title: 'Photo 1' },
                { contentType: 'image/png', title: 'Photo 2' },
            ],
            name: 'Photo',
            resourceType: 'Practitioner',
            id: 'prac-1',
        });
        const summaries = screen.getAllByText(/^Content:/);
        await userEvent.click(summaries[0]);
        await userEvent.click(summaries[1]);

        const links = screen.getAllByRole('link', { name: /view/i });
        expect(links).toHaveLength(2);
        expect(links[0]).toHaveAttribute('href', '/document-viewer/4_0_0/Practitioner/prac-1/0');
        expect(links[1]).toHaveAttribute('href', '/document-viewer/4_0_0/Practitioner/prac-1/1');
    });

    it('renders no Document Viewer link for a resource type outside the supported list', async () => {
        renderAttachment({
            attachment: { contentType: 'text/plain' },
            name: 'Note',
            resourceType: 'Observation',
            id: 'obs-1',
        });
        await expandAccordion();

        expect(screen.queryByRole('link', { name: /view/i })).not.toBeInTheDocument();
    });
});
