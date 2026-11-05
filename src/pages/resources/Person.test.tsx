import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import Person from './Person';
import UserContext from '../../context/UserContext';
import EnvContext from '../../context/EnvironmentContext';
import { TUserDetails } from '../../types/baseTypes';
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

describe('Person Connection History link', () => {
    const baseUrl = 'https://sigma.example.com/workbook/abc?:nodeId=n1&:customView=';
    const renderPerson = (
        {
            isAdmin,
            connectionHistoryUrl,
            baileyAdminUrl = '',
        }: { isAdmin: boolean; connectionHistoryUrl: string; baileyAdminUrl?: string },
        resource: TPerson = person
    ) =>
        render(
            <MemoryRouter>
                <UserContext.Provider value={{ userDetails: { isAdmin } as unknown as TUserDetails }}>
                    <EnvContext.Provider
                        value={{
                            fhirUrl: '',
                            AUTH_PROVIDERS: '',
                            FHIR_APP_VERSION: 'null',
                            AWS_REGION: '',
                            baileyUrl: '',
                            baileyModel: '',
                            baileyEnabled: false,
                            connectionHistoryUrl,
                            baileyAdminUrl,
                            getFhirServerVersion: () => 'null',
                        }}
                    >
                        <Person resource={resource} />
                    </EnvContext.Provider>
                </UserContext.Provider>
            </MemoryRouter>
        );

    it('links to the configured URL with the person uuid appended for an admin', () => {
        renderPerson({ isAdmin: true, connectionHistoryUrl: baseUrl });

        expect(screen.getByRole('link', { name: /open in sigma/i })).toHaveAttribute('href', `${baseUrl}per-1`);
    });

    it('percent-encodes the uuid so it cannot inject extra URL parameters', () => {
        const hostile = {
            resourceType: 'Person',
            id: 'per-1',
            meta: { tag: [{ system: 'https://www.icanbwell.com/uuid', code: 'a&:customView=x' }] },
        } as unknown as TPerson;
        renderPerson({ isAdmin: true, connectionHistoryUrl: baseUrl }, hostile);

        expect(screen.getByRole('link', { name: /open in sigma/i })).toHaveAttribute(
            'href',
            `${baseUrl}a%26%3AcustomView%3Dx`
        );
    });

    it.each([
        { isAdmin: false, connectionHistoryUrl: baseUrl },
        { isAdmin: true, connectionHistoryUrl: '' },
    ])('does not render the link when %o', (props) => {
        renderPerson(props);

        expect(screen.queryByRole('link', { name: /open in sigma/i })).not.toBeInTheDocument();
    });
});

describe('Person Bailey admin tool links', () => {
    const baseUrl = 'https://skills.example.test/web/admin';
    const renderPerson = (
        { isAdmin, baileyAdminUrl }: { isAdmin: boolean; baileyAdminUrl: string },
        resource: TPerson = person
    ) =>
        render(
            <MemoryRouter>
                <UserContext.Provider value={{ userDetails: { isAdmin } as unknown as TUserDetails }}>
                    <EnvContext.Provider
                        value={{
                            fhirUrl: '',
                            AUTH_PROVIDERS: '',
                            FHIR_APP_VERSION: 'null',
                            AWS_REGION: '',
                            baileyUrl: '',
                            baileyModel: '',
                            baileyEnabled: false,
                            connectionHistoryUrl: '',
                            baileyAdminUrl,
                            getFhirServerVersion: () => 'null',
                        }}
                    >
                        <Person resource={resource} />
                    </EnvContext.Provider>
                </UserContext.Provider>
            </MemoryRouter>
        );

    it('percent-encodes the person id so it cannot inject extra URL parameters', () => {
        const hostile = {
            resourceType: 'Person',
            id: 'per-1',
            meta: { tag: [{ system: 'https://www.icanbwell.com/uuid', code: 'a&clientKey=x' }] },
        } as unknown as TPerson;
        renderPerson({ isAdmin: true, baileyAdminUrl: baseUrl }, hostile);

        expect(screen.getByRole('link', { name: 'Conversations' })).toHaveAttribute(
            'href',
            `${baseUrl}/conversations?personId=a%26clientKey%3Dx`
        );
    });

    it.each([
        ['Conversations', 'conversations'],
        ['Feedback Review', 'feedback'],
        ['Tool Calls', 'tool-call-logs'],
        ['User Activity', 'user-activity'],
    ])('links %s with the person id for an admin', (label, path) => {
        renderPerson({ isAdmin: true, baileyAdminUrl: baseUrl });

        expect(screen.getByRole('link', { name: label })).toHaveAttribute(
            'href',
            `${baseUrl}/${path}?personId=per-1`
        );
    });

    it.each([
        { isAdmin: false, baileyAdminUrl: baseUrl },
        { isAdmin: true, baileyAdminUrl: '' },
    ])('does not render the tool links when %o', (props) => {
        renderPerson(props);

        expect(screen.queryByRole('link', { name: 'Conversations' })).not.toBeInTheDocument();
    });
});
