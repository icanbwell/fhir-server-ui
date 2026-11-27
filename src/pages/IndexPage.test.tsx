import { render, screen, waitFor } from '@testing-library/react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import IndexPage from './IndexPage';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import LastRequestContext from '../context/LastRequestContext';
import { ThemeContextProvider } from '../context/ThemeContext';

const { getBundleAsyncMock } = vi.hoisted(() => ({ getBundleAsyncMock: vi.fn() }));

// External boundary: the FHIR server. Only the methods IndexPage and EnvironmentContext use are
// stubbed; getBundleAsync is controlled per test so loading can be held pending and then resolved.
vi.mock('../api/fhirApi', () => ({
    default: class {
        getVersion() {
            return Promise.resolve('4.0.0');
        }
        getBundleAsync(...args: unknown[]) {
            return getBundleAsyncMock(...args);
        }
        addMissingRequiredParams() {}
    },
}));

type BundleResult = { json: unknown; status: number; incomplete: boolean };

// Stable, synthetic context values (no real endpoints). Defined once so provider values keep
// the same identity across re-renders and don't retrigger IndexPage's fetch effect.
const testEnvironment = {
    fhirUrl: 'https://fhir.example.test',
    AUTH_PROVIDERS: '',
    FHIR_APP_VERSION: 'test',
    AWS_REGION: '',
    baileyUrl: '',
    baileyModel: '',
    baileyEnabled: false,
    connectionHistoryUrl: '',
    baileyAdminUrl: '',
    accessToCareSearchesUrl: '',
    getFhirServerVersion: () => 'test',
};
const testUser = { userDetails: null, setUserDetails: vi.fn() };
const testLastRequest = { lastRequest: null, recordRequest: vi.fn() };

function renderIndexPage(path: string) {
    return render(
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <ThemeContextProvider>
                <EnvironmentContext.Provider value={testEnvironment}>
                    <UserContext.Provider value={testUser}>
                        <LastRequestContext.Provider value={testLastRequest}>
                            <MemoryRouter initialEntries={[path]}>
                                <Routes>
                                    <Route path="/4_0_0/:resourceType" element={<IndexPage />} />
                                </Routes>
                            </MemoryRouter>
                        </LastRequestContext.Provider>
                    </UserContext.Provider>
                </EnvironmentContext.Provider>
            </ThemeContextProvider>
        </LocalizationProvider>
    );
}

describe('IndexPage loading indicator', () => {
    let resolveBundle: (result: BundleResult) => void;

    beforeEach(() => {
        localStorage.setItem('identityProvider', 'test-provider');
        getBundleAsyncMock.mockReset();
        getBundleAsyncMock.mockImplementation(
            () =>
                new Promise<BundleResult>((resolve) => {
                    resolveBundle = resolve;
                })
        );
    });

    afterEach(() => {
        localStorage.clear();
    });

    it.each([
        { name: 'the resource list view', path: '/4_0_0/Patient' },
        { name: 'the raw JSON view', path: '/4_0_0/Patient?_format=json' },
    ])('shows exactly one progress bar while loading $name', async ({ path }) => {
        renderIndexPage(path);

        await waitFor(() => expect(getBundleAsyncMock).toHaveBeenCalled());
        expect(screen.getAllByRole('progressbar')).toHaveLength(1);
    });

    it('shows no progress bar once the bundle has loaded', async () => {
        renderIndexPage('/4_0_0/Patient');
        await waitFor(() => expect(getBundleAsyncMock).toHaveBeenCalled());
        expect(screen.getAllByRole('progressbar')).toHaveLength(1);

        resolveBundle({
            json: { resourceType: 'Bundle', entry: [] },
            status: 200,
            incomplete: false,
        });

        await waitFor(() => expect(screen.queryAllByRole('progressbar')).toHaveLength(0));
    });
});
