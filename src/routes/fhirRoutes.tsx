import { lazy } from 'react';
import { Route } from 'react-router';
import { baileyEnabled } from '../context/EnvironmentContext';

const AboutPage = lazy(() => import('../pages/AboutPage'));
const IndexPage = lazy(() => import('../pages/IndexPage'));
const ObservationGraph = lazy(() => import('../ObservationGraph'));
const ObservationTimeline = lazy(() => import('../ObservationTimeline'));
const PatientTimeline = lazy(() => import('../PatientTimeline'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const ExcelViewerPage = lazy(() => import('../pages/ExcelViewerPage'));
const IPSViewerPage = lazy(() => import('../pages/IPSViewerPage'));
const CompositionSummaryPage = lazy(() => import('../pages/CompositionSummaryPage'));
const DocumentViewerPage = lazy(() => import('../pages/DocumentViewerPage'));
const APIConsolePage = lazy(() => import('../pages/APIConsolePage'));
const BaileyAIPage = lazy(() => import('../pages/BaileyAIPage'));

export default [
    <Route key="apiConsole" path="/api-console" element={<APIConsolePage />} />,
    ...(baileyEnabled ? [<Route key="bailey" path="/bailey" element={<BaileyAIPage />} />] : []),
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
    <Route
        key="compositionSummaryIdOperation"
        path="/composition-summary/4_0_0/:resourceType/:id?/:operation?/*"
        element={<CompositionSummaryPage />}
    />,
    <Route
        key="compositionSummaryOperation"
        path="/composition-summary/4_0_0/:resourceType/:operation?/*"
        element={<CompositionSummaryPage />}
    />,
    <Route
        key="documentViewerIdOperation"
        path="/document-viewer/4_0_0/:resourceType/:id?/:operation?/*"
        element={<DocumentViewerPage />}
    />,
    <Route
        key="documentViewerOperation"
        path="/document-viewer/4_0_0/:resourceType/:operation?/*"
        element={<DocumentViewerPage />}
    />,
];
