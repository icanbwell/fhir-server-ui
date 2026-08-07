import './App.css';
import React, { Suspense, useCallback, useContext, useMemo, useState } from 'react';
import {
    Routes,
    Route,
    createBrowserRouter,
    RouterProvider,
    Outlet,
    Navigate,
} from 'react-router';

import HomePage from './pages/HomePage';
import ErrorPage from './pages/ErrorPage';
import Auth from './pages/Auth';
import FhirRoutes from './routes/fhirRoutes';
import AdminRoutes from './routes/adminRoutes';
const AdminIndexPage = React.lazy(() => import('./admin/index'));
import EnvContext from './context/EnvironmentContext';
import UserContext from './context/UserContext';
import LastRequestContext, { TLastRequest, TRequestInfo } from './context/LastRequestContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { TUserDetails } from './types/baseTypes';
import { jwtParser } from './utils/jwtParser';
import IdentityProviderSelection from './pages/IdentityProviderSelection';
import BwellAppLogin from './pages/BwellAppLogin';
import ClientCredentialsLogin from './pages/ClientCredentialsLogin';
import { useLocation } from 'react-router';
import NotFoundPage from './pages/NotFoundPage';
import AccessDenied from './pages/AccessDenied';

function Root() {
    const location = useLocation();
    const { userDetails } = useContext(UserContext);

    return (
        <Suspense>
            <Routes>
                <Route key="home" path="/" element={<HomePage />} />
                <Route
                    element={
                        !userDetails ? (
                            <Outlet />
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                >
                    <Route key="identityProvider" path="/select-idp" element={<IdentityProviderSelection />} />
                </Route>
                <Route key="authcallback" path="/authcallback" element={<Auth />} />
                <Route key="bwellLogin" path="/bwell-login" element={<BwellAppLogin />} />
                <Route key="clientCredentialsLogin" path="/client-credentials-login" element={<ClientCredentialsLogin />} />
                <Route
                    element={
                        userDetails ? (
                            <Outlet />
                        ) : (
                            <Navigate to="/select-idp" state={{ resourceUrl: `${location.pathname}${location.search}` }} />
                        )
                    }
                >
                    {FhirRoutes}

                    <Route path="admin" element={
                        userDetails?.isAdmin ? <Outlet /> : <AccessDenied />
                    }>
                        <Route index element={<AdminIndexPage />} />
                        {AdminRoutes}
                    </Route>
                </Route>

                <Route key="notFoundPage" path="/*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
}

// `recordRequest` (below) stamps `pathname` from `window.location.pathname`, which includes
// any basename, while `Header.tsx` compares that stamp against react-router's own
// `location.pathname` (basename-stripped). The two only agree today because `basename` is
// hardcoded to '/' (a no-op prefix). If this app is ever served from a real subpath, that
// comparison would need to strip the basename from one side or the other.
const router = createBrowserRouter(
    [{ path: '*', Component: Root, errorElement: <ErrorPage /> }],
    { basename: '/' }
);

function App(): React.ReactElement {
    const env = useContext(EnvContext);
    const [userDetails, setUserDetails] = useState<TUserDetails | null>(jwtParser());
    const [lastRequest, setLastRequest] = useState<TLastRequest>(null);
    const recordRequest = useCallback((info: TRequestInfo) => {
        setLastRequest({ ...info, pathname: window.location.pathname });
    }, []);
    console.log(`Setting fhirUrl to ${env.fhirUrl}`);

    // Memoized so a `lastRequest` update (which now fires on every FHIR fetch) doesn't hand
    // every UserContext consumer a new-but-equal value and force an unnecessary re-render.
    const userContextValue = useMemo(
        () => ({ userDetails, setUserDetails }),
        [userDetails, setUserDetails]
    );
    const lastRequestContextValue = useMemo(
        () => ({ lastRequest, recordRequest }),
        [lastRequest, recordRequest]
    );

    return (
        <ThemeContextProvider>
            <UserContext.Provider value={userContextValue}>
                <LastRequestContext.Provider value={lastRequestContextValue}>
                    <RouterProvider router={router} />
                </LastRequestContext.Provider>
            </UserContext.Provider>
        </ThemeContextProvider>
    );
}

export default App;
