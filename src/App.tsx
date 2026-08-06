import './App.css';
import React, { Suspense, useCallback, useContext, useState } from 'react';
import {
    Routes,
    Route,
    createBrowserRouter,
    RouterProvider,
    Outlet,
    Navigate,
} from 'react-router-dom';

import HomePage from './pages/HomePage';
import ErrorPage from './pages/ErrorPage';
import Auth from './pages/Auth';
import FhirRoutes from './routes/fhirRoutes';
import AdminRoutes from './routes/adminRoutes';
const AdminIndexPage = React.lazy(() => import('./admin/index'));
import EnvContext from './context/EnvironmentContext';
import UserContext from './context/UserContext';
import LastRequestContext, { TLastRequest } from './context/LastRequestContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { TUserDetails } from './types/baseTypes';
import { jwtParser } from './utils/jwtParser';
import IdentityProviderSelection from './pages/IdentityProviderSelection';
import BwellAppLogin from './pages/BwellAppLogin';
import ClientCredentialsLogin from './pages/ClientCredentialsLogin';
import { useLocation } from 'react-router-dom';
import NotFoundPage from './pages/NotFoundPage';
import AccessDenied from './pages/AccessDenied';

function App(): React.ReactElement {
    const env = useContext(EnvContext);
    const [userDetails, setUserDetails] = useState<TUserDetails | null>(jwtParser());
    const [lastRequest, setLastRequest] = useState<TLastRequest>(null);
    const recordRequest = useCallback((info: { method: string; url: string }) => {
        setLastRequest({ ...info, pathname: window.location.pathname });
    }, []);
    console.log(`Setting fhirUrl to ${env.fhirUrl}`);

    // Changed from App to Root
    function Root() {
        const location = useLocation();

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

    const router = createBrowserRouter(
        [{ path: '*', Component: Root, errorElement: <ErrorPage /> }],
        { basename: '/' }
    );

    return (
        <ThemeContextProvider>
            <UserContext.Provider value={{ userDetails, setUserDetails }}>
                <LastRequestContext.Provider value={{ lastRequest, recordRequest }}>
                    <RouterProvider router={router} />
                </LastRequestContext.Provider>
            </UserContext.Provider>
        </ThemeContextProvider>
    );
}

export default App;
