import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import ResourceCard from './ResourceCard';
import { TResource } from '../types/resources/Resource';

const resource = (resourceType: string, id: string) =>
    ({ resourceType, id }) as unknown as TResource;

describe('ResourceCard upload document link', () => {
    it('links to the upload page for a Patient resource', () => {
        render(
            <MemoryRouter>
                <ResourceCard index={0} resource={resource('Patient', 'pat-1')} expanded={false} />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /upload document/i })).toHaveAttribute(
            'href',
            '/document-upload/4_0_0/Patient/pat-1'
        );
    });

    it('does not show the upload link for a Person resource', () => {
        render(
            <MemoryRouter>
                <ResourceCard index={0} resource={resource('Person', 'per-1')} expanded={false} />
            </MemoryRouter>
        );

        expect(screen.queryByRole('link', { name: /upload document/i })).not.toBeInTheDocument();
    });

    it('does not show the upload link for other resource types', () => {
        render(
            <MemoryRouter>
                <ResourceCard index={0} resource={resource('Observation', 'obs-1')} expanded={false} />
            </MemoryRouter>
        );

        expect(screen.queryByRole('link', { name: /upload document/i })).not.toBeInTheDocument();
    });

    it('links to the upload page with the encounter subject reference for an Encounter resource', () => {
        render(
            <MemoryRouter>
                <ResourceCard
                    index={0}
                    resource={
                        { resourceType: 'Encounter', id: 'enc-1', subject: { reference: 'Patient/pat-1' } } as unknown as TResource
                    }
                    expanded={false}
                />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /upload document/i })).toHaveAttribute(
            'href',
            '/document-upload/4_0_0/Encounter/enc-1?subjectReference=Patient%2Fpat-1'
        );
    });

    it('does not show the upload link for an Encounter without a subject', () => {
        render(
            <MemoryRouter>
                <ResourceCard index={0} resource={resource('Encounter', 'enc-2')} expanded={false} />
            </MemoryRouter>
        );

        expect(screen.queryByRole('link', { name: /upload document/i })).not.toBeInTheDocument();
    });
});
