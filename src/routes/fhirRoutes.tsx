import { Route } from 'react-router-dom';

import AboutPage from '../pages/AboutPage';
import IndexPage from '../pages/IndexPage';
import ObservationGraph from '../ObservationGraph';
import ObservationTimeline from '../ObservationTimeline';
import PatientTimeline from '../PatientTimeline';
import SearchPage from '../pages/SearchPage';
import ExcelViewerPage from '../pages/ExcelViewerPage';
import IPSViewerPage from '../pages/IPSViewerPage';
import APIConsolePage from '../pages/APIConsolePage';

export default [
    <Route key="apiConsole" path="/api-console" element={<APIConsolePage />} />,
    <Route key="about" path="/about" element={<AboutPage />} />,
    <Route key="patientTimeline" path="/patientTimeline" element={<PatientTimeline />} />,
    <Route key="ObservationGraph" path="/observationGraph" element={<ObservationGraph />} />,
    <Route key="observationTimeline" path="/observationTimeline" element={<ObservationTimeline />} />,
    <Route key="search" path="/4_0_0/:resourceType/_search/*" element={<SearchPage />} />,
    <Route key="historyByVersionId" path="/4_0_0/:resourceType/:id/_history/:vid" element={<IndexPage />} />,
    <Route key="idOperation" path="/4_0_0/:resourceType/:id?/:operation?/*" element={<IndexPage />} />,
    <Route key="operation" path="/4_0_0/:resourceType/:operation?/*" element={<IndexPage />} />,
    <Route key="excelIdOperation" path="/excel/4_0_0/:resourceType/:id?/:operation?/*" element={<ExcelViewerPage />} />,
    <Route key="excelOperation" path="/excel/4_0_0/:resourceType/:operation?/*" element={<ExcelViewerPage />} />,
    <Route key="ipsIdOperation" path="/ips/4_0_0/:resourceType/:id?/:operation?/*" element={<IPSViewerPage />} />,
    <Route key="ipsOperation" path="/ips/4_0_0/:resourceType/:operation?/*" element={<IPSViewerPage />} />,
];
