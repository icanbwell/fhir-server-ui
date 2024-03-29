import { Route } from 'react-router-dom';

import AdminIndexPage from '../admin';
import PersonMatchPage from '../admin/personMatch';
import PatientDataPage from '../admin/patientData';
import PersonPatientLinkPage from '../admin/personPatientLink';
import SearchLogsPage from '../admin/searchLogs';
import Indexes from '../admin/indexes';
import SynchronizeIndexes from '../admin/synchronizeIndexes';

export default [
    <Route path="/admin" element={<AdminIndexPage />} />,
    <Route path="/admin/personMatch/*" element={<PersonMatchPage />} />,
    <Route path="/admin/patientData/*" element={<PatientDataPage />} />,
    <Route path="/admin/personPatientLink/*" element={<PersonPatientLinkPage />} />,
    <Route path="/admin/searchLog/*" element={<SearchLogsPage />} />,
    <Route path="/admin/searchLogResults/*" element={<SearchLogsPage />} />,
    <Route path="/admin/indexes/*" element={<Indexes />} />,
    <Route path="/admin/indexProblems/*" element={<Indexes />} />,
    <Route path="/admin/synchronizeIndexes/*" element={<SynchronizeIndexes />} />,
];
