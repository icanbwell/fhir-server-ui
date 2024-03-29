import React, { createContext } from 'react';
import { TUserDetails } from '../types/baseTypes';

const UserContext = createContext<{
    userDetails: TUserDetails|null;
    setUserDetails?: React.Dispatch<React.SetStateAction<TUserDetails|null>>;
}>({
    userDetails: null,
});

export default UserContext;
