import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import EnvContext from '../context/EnvironmentContext';
import { ThemeContextProvider } from '../context/ThemeContext';
import IdentityProviderSelection from './IdentityProviderSelection';

const renderWith = (providers: string) =>
    render(
        <ThemeContextProvider>
            <EnvContext.Provider
                value={
                    {
                        AUTH_PROVIDERS: providers,
                        FHIR_APP_VERSION: 'test',
                        getFhirServerVersion: () => 'test',
                    } as never
                }
            >
                <MemoryRouter initialEntries={['/select-idp']}>
                    <Routes>
                        <Route path="/select-idp" element={<IdentityProviderSelection />} />
                        <Route path="/bwell-descope-login" element={<div>descope page</div>} />
                        <Route path="/bwell-login" element={<div>legacy page</div>} />
                    </Routes>
                </MemoryRouter>
            </EnvContext.Provider>
        </ThemeContextProvider>
    );

describe('IdentityProviderSelection b.well App providers', () => {
    it('routes bwelldescope to the Descope login page', async () => {
        renderWith('okta,bwelldescope');
        await userEvent.click(screen.getByRole('button', { name: /b\.well App/i }));
        expect(await screen.findByText('descope page')).toBeInTheDocument();
    });

    it('still routes bwellapp to the legacy page', async () => {
        renderWith('okta,bwellapp');
        await userEvent.click(screen.getByRole('button', { name: /b\.well App/i }));
        expect(await screen.findByText('legacy page')).toBeInTheDocument();
    });

    it('shows only the provider the environment lists', () => {
        renderWith('okta,bwelldescope');
        expect(screen.getAllByRole('button', { name: /b\.well App/i })).toHaveLength(1);
    });
});
