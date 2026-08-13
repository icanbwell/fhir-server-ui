import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import DocumentViewerLink from './DocumentViewerLink';

describe('DocumentViewerLink', () => {
    it('links to the resource without a content index when none is given', () => {
        render(
            <MemoryRouter>
                <DocumentViewerLink resourceType="Media" id="abc123" />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute(
            'href',
            '/document-viewer/4_0_0/Media/abc123'
        );
    });

    it('appends the content index for array-shaped attachment fields', () => {
        render(
            <MemoryRouter>
                <DocumentViewerLink resourceType="DiagnosticReport" id="abc123" contentIndex={2} />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /view/i })).toHaveAttribute(
            'href',
            '/document-viewer/4_0_0/DiagnosticReport/abc123/2'
        );
    });

    it('renders nothing when id is undefined', () => {
        const { container } = render(
            <MemoryRouter>
                <DocumentViewerLink resourceType="Patient" id={undefined} />
            </MemoryRouter>
        );

        expect(container).toBeEmptyDOMElement();
    });
});
