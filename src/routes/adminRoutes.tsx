import { lazy } from 'react';
import { Route } from 'react-router-dom';

const PersonMatchPage = lazy(() => import('../admin/personMatch'));
const PatientDataPage = lazy(() => import('../admin/patientData'));
const PersonPatientLinkPage = lazy(() => import('../admin/personPatientLink'));
const SearchLogsPage = lazy(() => import('../admin/searchLogs'));
const Indexes = lazy(() => import('../admin/indexes'));
const SynchronizeIndexes = lazy(() => import('../admin/synchronizeIndexes'));
const ManageExport = lazy(() => import('../admin/manageExport'));
const InvalidateCache = lazy(() => import('../admin/InvalidateCache'));
const PersonOneToNMatchPage = lazy(() => import('../admin/personOneToNMatch'));

export default [
    <Route key="personMatch" path="personMatch/*" element={<PersonMatchPage />} />,
    <Route key="personOneToNMatch" path="personOneToNMatch/*" element={<PersonOneToNMatchPage />} />,
    <Route key="patientData" path="patientData/*" element={<PatientDataPage />} />,
    <Route key="personPatientLink" path="personPatientLink/*" element={<PersonPatientLinkPage />} />,
    <Route key="searchLog" path="searchLog/*" element={<SearchLogsPage />} />,
    <Route key="searchLogResults" path="searchLogResults/*" element={<SearchLogsPage />} />,
    <Route key="indexes" path="indexes/*" element={<Indexes />} />,
    <Route key="indexProblems" path="indexProblems/*" element={<Indexes />} />,
    <Route key="synchronizeIndexes" path="synchronizeIndexes/*" element={<SynchronizeIndexes />} />,
    <Route key="manageExport" path="ExportStatus/:id?/*" element={<ManageExport />} />,
    <Route key="InvalidateCache" path="InvalidateCache/*" element={<InvalidateCache />} />,
];
