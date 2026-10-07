// src/pages/BwellDescopeLogin.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import UserContext from '../context/UserContext';
import { ThemeContextProvider } from '../context/ThemeContext';
import { APP_ENV } from '../runtimeEnv';

const { mockComplete, mockAuthProvider } = vi.hoisted(() => ({
    mockComplete: vi.fn(),
    mockAuthProvider: vi.fn(),
}));
vi.mock('../utils/bwellDescopeSession', () => ({ completeBwellDescopeLogin: mockComplete }));

vi.mock('@descope/react-sdk', () => ({
    AuthProvider: (props: { children: React.ReactNode }) => {
        mockAuthProvider(props);
        return <>{props.children}</>;
    },
    Descope: ({
        flowId,
        onSuccess,
        onError,
    }: {
        flowId: string;
        onSuccess: (e: { detail: { sessionJwt?: string } }) => void;
        onError: (e: { detail: Record<string, unknown> }) => void;
    }) => (
        <div data-testid="descope" data-flow={flowId}>
            <button onClick={() => onSuccess({ detail: { sessionJwt: 'jwt-abc' } })}>ok</button>
            <button onClick={() => onSuccess({ detail: {} })}>no-jwt</button>
            <button onClick={() => onError({ detail: { errorDescription: 'secret detail' } })}>
                fail
            </button>
        </div>
    ),
}));

import BwellDescopeLogin from './BwellDescopeLogin';

const setUserDetails = vi.fn();

const renderPage = () =>
    render(
        <ThemeContextProvider>
            <UserContext.Provider value={{ userDetails: null, setUserDetails } as never}>
                <MemoryRouter initialEntries={['/bwell-descope-login']}>
                    <Routes>
                        <Route path="/bwell-descope-login" element={<BwellDescopeLogin />} />
                        <Route path="/" element={<div>home</div>} />
                    </Routes>
                </MemoryRouter>
            </UserContext.Provider>
        </ThemeContextProvider>
    );

describe('BwellDescopeLogin', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        mockComplete.mockReset();
        mockAuthProvider.mockReset();
        setUserDetails.mockReset();
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = 'P-test';
        Reflect.deleteProperty(APP_ENV, 'REACT_APP_AUTH_BWELLDESCOPE_FLOW_ID');
    });

    it('shows a configuration message and no flow when the project id is missing', () => {
        Reflect.deleteProperty(APP_ENV, 'REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID');
        renderPage();
        expect(screen.getByText(/not configured/i)).toBeInTheDocument();
        expect(screen.queryByTestId('descope')).not.toBeInTheDocument();
    });

    it('renders the flow with the default flow id', () => {
        renderPage();
        expect(screen.getByTestId('descope')).toHaveAttribute('data-flow', 'bwell-parent-flow');
    });

    it('stops the Descope SDK persisting tokens and the last authenticated user', () => {
        renderPage();
        expect(mockAuthProvider).toHaveBeenCalled();
        const props = mockAuthProvider.mock.calls[0][0];
        expect(props.persistTokens).toBe(false);
        expect(props.storeLastAuthenticatedUser).toBe(false);
    });

    it('sets the user and navigates home after a successful flow', async () => {
        mockComplete.mockReturnValue({ username: 'user@example.com' });
        renderPage();
        await userEvent.click(screen.getByText('ok'));
        expect(mockComplete).toHaveBeenCalledWith('jwt-abc');
        expect(setUserDetails).toHaveBeenCalledWith({ username: 'user@example.com' });
        expect(await screen.findByText('home')).toBeInTheDocument();
    });

    it('shows a session error when the token cannot be turned into a user', async () => {
        mockComplete.mockReturnValue(null);
        renderPage();
        await userEvent.click(screen.getByText('ok'));
        expect(screen.getByText(/session could not be established/i)).toBeInTheDocument();
        expect(setUserDetails).not.toHaveBeenCalled();
    });

    it('shows a session error instead of failing silently when establishing the session throws', async () => {
        mockComplete.mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        renderPage();
        await userEvent.click(screen.getByText('ok'));
        expect(screen.getByText(/session could not be established/i)).toBeInTheDocument();
        expect(setUserDetails).not.toHaveBeenCalled();
    });

    it('shows an error when the flow succeeds without a session jwt', async () => {
        mockComplete.mockReturnValue(null);
        renderPage();
        await userEvent.click(screen.getByText('no-jwt'));
        expect(mockComplete).toHaveBeenCalledWith(undefined);
        expect(screen.getByText(/session could not be established/i)).toBeInTheDocument();
    });

    it('shows a generic message, not raw error detail, when the flow errors', async () => {
        renderPage();
        await userEvent.click(screen.getByText('fail'));
        expect(screen.getByText(/unable to sign in right now/i)).toBeInTheDocument();
        expect(screen.queryByText(/secret detail/)).not.toBeInTheDocument();
    });

    it('clears the login email Descope left in sessionStorage when the flow errors', async () => {
        sessionStorage.setItem('dls_last_submitted_login_id', 'user@example.com');
        renderPage();
        await userEvent.click(screen.getByText('fail'));
        expect(sessionStorage.getItem('dls_last_submitted_login_id')).toBeNull();
    });

    it('clears the login email Descope left in sessionStorage when the user leaves the page', () => {
        const { unmount } = renderPage();
        sessionStorage.setItem('dls_last_submitted_login_id', 'user@example.com');
        unmount();
        expect(sessionStorage.getItem('dls_last_submitted_login_id')).toBeNull();
    });

    it('redirects without showing the flow when a jwt is already stored', async () => {
        localStorage.setItem('jwt', 'existing');
        renderPage();
        expect(await screen.findByText('home')).toBeInTheDocument();
    });
});
