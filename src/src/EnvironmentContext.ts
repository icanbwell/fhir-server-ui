import { createContext } from 'react';
import { TUserDetails } from './types/baseTypes';

const EnvContext = createContext<{
  fhirUrl: string|undefined;
  userDetails: TUserDetails|undefined;
}>({
  fhirUrl: undefined,
  userDetails: undefined,
});

export default EnvContext;
