import './App.css';
import React, { useContext, useState } from 'react';
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
import EnvContext from './context/EnvironmentContext';
import UserContext from './context/UserContext';
import { TUserDetails } from './types/baseTypes';
import { jwtParser } from './utils/jwtParser';

function App(): React.ReactElement {
    const env = useContext(EnvContext);
    const [userDetails, setUserDetails] = useState<TUserDetails | null>(
        jwtParser({
            customGroup: env.AUTH_CUSTOM_GROUP,
            customScope: env.AUTH_CUSTOM_SCOPE,
        })
    );
    console.log(`Setting fhirUrl to ${env.fhirUrl}`);

    // Changed from App to Root
    function Root() {
        return (
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/authcallback" element={<Auth />} />
                <Route
                    element={
                        userDetails ? (
                            <Outlet />
                        ) : (
                            <Navigate
                                to="/authcallback"
                                state={{ resourceUrl: window.location.href }}
                            />
                        )
                    }
                    children={FhirRoutes}
                />
                <Route path="/*" element={<>Invalid Route</>} />
            </Routes>
        );
    }

    const router = createBrowserRouter(
        [{ path: '*', Component: Root, errorElement: <ErrorPage /> }],
        { basename: '/' }
    );

    return (
        <UserContext.Provider value={{ userDetails, setUserDetails }}>
            <RouterProvider router={router} />
        </UserContext.Provider>
    );
}

export default App;
