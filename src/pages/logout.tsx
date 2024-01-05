import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeLocalData } from '../utils/localData.utils';
import UserContext from '../context/UserContext';

const Logout = () => {
    const { setIsLoggedIn } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (setIsLoggedIn) {
            setIsLoggedIn(false);
        }
        removeLocalData('jwt');
        navigate('/');
    }, []);

    return <>Redirecting</>;
};

export default Logout;
