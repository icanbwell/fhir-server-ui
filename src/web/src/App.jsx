import './App.css';
import React, {useEffect, useState} from 'react';
import {
    Routes,
    Route,
    createBrowserRouter,
    RouterProvider
} from 'react-router-dom';
import HomePage from './HomePage';
import AboutPage from './AboutPage';

import PatientChatGptPage from './PatientChatGptPage';
import ObservationGraph from "./ObservationGraph";
import ObservationTimeline from "./ObservationTimeline";
import PatientTimeline from "./PatientTimeline";
import AdminRoutes from "./routes/adminRoutes";
import FhirRoutes from "./routes/fhirRoutes";
import AdminIndexPage from "./admin";
import PersonMatchPage from "./admin/personMatch";
import PatientDataPage from "./admin/patientData";
import PersonPatientLinkPage from "./admin/personPatientLink";
import SearchLogsPage from "./admin/searchLogs";
import SearchPage from "./pages/SearchPage";
import IndexPage from "./pages/IndexPage";
import EnvironmentContext from './EnvironmentContext';

// import ErrorPage from "./error-page";

function App() {
    const [fhirUrl, setFhirUrl] = useState("");
    const router = createBrowserRouter(
        [
            {path: "*", Component: Root},
        ],
        {basename: "/"}
    );

    useEffect(() => {
        // Fetching environment data from server using async/await
        const fetchEnvData = async () => {
            try {
                const response = await fetch('/api/env');
                if (!response.ok) {
                // noinspection ExceptionCaughtLocallyJS
                    throw new Error("Network response was not ok");
                }

                const data = await response.json();
                setFhirUrl(data.FHIR_SERVER_URL);
                console.log(`Setting fhirUrl to ${fhirUrl}`);
            } catch (error) {
                console.error("There was a problem with the fetch operation:", error.message);
            }
        };

        // React does not support async calls here and recommends we just call the function
        // noinspection JSIgnoredPromiseFromCall
        fetchEnvData();
    }, []);

    // 1️Changed from App to Root
    function Root() {
        return (
            <Routes>
                <Route path="/" element={<HomePage/>}/>
                <Route path="/about" element={<AboutPage/>}/>
                <Route path="/patient" element={<PatientChatGptPage/>}/>
                <Route path="/pat2/:id" element={<PatientChatGptPage/>}/>
                <Route path="/patientTimeline" element={<PatientTimeline/>}/>
                <Route path="/observationGraph" element={<ObservationGraph/>}/>
                <Route path="/observationTimeline" element={<ObservationTimeline/>}/>
                <Route path="/4_0_0/:resourceType/_search/*" element={<SearchPage/>}/>
                <Route path="/4_0_0/:resourceType/:id?/:operation?/*" element={<IndexPage fhirUrl={fhirUrl} />}/>
                <Route path="/4_0_0/:resourceType/:operation?/*" element={<IndexPage fhirUrl={fhirUrl} />}/>
                <Route path="/admin" element={<AdminIndexPage/>}/>
                <Route path="/admin/personMatch/*" element={<PersonMatchPage/>}/>
                <Route path="/admin/patientData/*" element={<PatientDataPage/>}/>
                <Route path="/admin/personPatientLink/*" element={<PersonPatientLinkPage/>}/>
                <Route path="/admin/searchLog/*" element={<SearchLogsPage/>}/>
            </Routes>
        );
    }

    return (
        <EnvironmentContext.Provider value={fhirUrl}>
            <RouterProvider router={router}/>
        </EnvironmentContext.Provider>
    );
}

export default App;
