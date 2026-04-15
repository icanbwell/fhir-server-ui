import { Route } from 'react-router-dom';

import PersonMatchPage from '../admin/personMatch';
import PatientDataPage from '../admin/patientData';
import PersonPatientLinkPage from '../admin/personPatientLink';
import SearchLogsPage from '../admin/searchLogs';
import Indexes from '../admin/indexes';
import SynchronizeIndexes from '../admin/synchronizeIndexes';
import ManageExport from '../admin/manageExport';
import InvalidateCache from '../admin/InvalidateCache';
import PersonOneToNMatchPage from '../admin/personOneToNMatch';

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
