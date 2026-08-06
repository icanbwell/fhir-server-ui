import { useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import EnvContext from '../context/EnvironmentContext';
import AdminApi from '../api/adminApi';
import UserContext from '../context/UserContext';
import MessagePage from '../pages/MessagePage';

const SynchronizeIndexes = () => {
    const { fhirUrl } = useContext(EnvContext);
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const adminApi = useMemo(() => {
        return new AdminApi({ fhirUrl, setUserDetails });
    }, [fhirUrl, setUserDetails]);

    useEffect(() => {
        adminApi.indexApi(location.pathname, location.search.includes('audit')).then(() => {
            setTimeout(() => navigate('/admin'), 5000);
        });
    }, [adminApi, location.pathname, location.search, navigate]);

    return <MessagePage message='Started Synchronizing indexes. Web page redirects after 5 seconds.' />;
};

export default SynchronizeIndexes;
