import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Patient from './Patient';
import { TPatient } from '../../types/resources/Patient';

// EnvironmentContext.ts fires a real FhirApi.getVersion() network call at module-import
// time; this hoisted mock (scoped to this test file only — see DocumentViewer.test.tsx for
// the same pattern) neutralizes it so it resolves harmlessly instead of throwing in jsdom.
// Patient.tsx renders Partials.ReverseReference for its "Related Resources" section, which
// calls useResourceCount() — that hook constructs its own FhirApi instance and calls
// getResourceCount(), so the mock needs to cover both methods, not just getVersion().
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

const patient = { resourceType: 'Patient', id: 'pat-1' } as unknown as TPatient;

describe('Patient Data Graph section', () => {
    it('renders the raw $everything link and the download button', () => {
        render(
            <MemoryRouter>
                <Patient resource={patient} />
            </MemoryRouter>
        );

        expect(screen.getByText('/4_0_0/Patient/pat-1/$everything?contained=true&_format=json')).toHaveAttribute(
            'href',
            '/4_0_0/Patient/pat-1/$everything?contained=true&_format=json'
        );
        expect(screen.getByRole('button', { name: /download \$everything/i })).toBeInTheDocument();
    });
});
