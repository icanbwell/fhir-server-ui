import React, { createContext } from 'react';
import { TUserDetails } from '../types/baseTypes';

const UserContext = createContext<{
    userDetails: TUserDetails;
    isLoggedIn: boolean;
    setIsLoggedIn?: React.Dispatch<React.SetStateAction<boolean>>;
}>({
    userDetails: {},
    isLoggedIn: false,
    setIsLoggedIn: undefined,
});

export default UserContext;
