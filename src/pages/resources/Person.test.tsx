import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Person from './Person';
import { TPerson } from '../../types/resources/Person';

// Person.tsx renders Partials.ReverseReference for its "Resources Related to Linked Patient
// Resources" section, which calls useResourceCount() — that hook constructs its own FhirApi
// instance and calls getResourceCount(), so the mock needs to cover both methods, not just
// getVersion() (which EnvironmentContext.ts calls as a real network call at module-import
// time — see DocumentViewer.test.tsx for the same getVersion mocking pattern).
vi.mock('../../api/fhirApi', () => ({
    default: class {
        getVersion() {
            return Promise.resolve('4.0.0');
        }
        getResourceCount() {
            return Promise.resolve(null);
        }
    },
}));

const person = { resourceType: 'Person', id: 'per-1' } as unknown as TPerson;

describe('Person Data Graph section', () => {
    it('renders the raw $everything link and the download button', () => {
        render(
            <MemoryRouter>
                <Person resource={person} />
            </MemoryRouter>
        );

        expect(screen.getByText('/4_0_0/Person/per-1/$everything?contained=true&_format=json')).toHaveAttribute(
            'href',
            '/4_0_0/Person/per-1/$everything?contained=true&_format=json'
        );
        expect(screen.getByRole('button', { name: /download \$everything/i })).toBeInTheDocument();
    });

    it('does not render admin functions for a non-admin user', () => {
        render(
            <MemoryRouter>
                <Person resource={person} />
            </MemoryRouter>
        );

        expect(screen.queryByText('Admin Functions')).not.toBeInTheDocument();
    });
});
