import { createContext } from 'react';
import FhirApi from '../api/fhirApi';

let fhirServerVersion = 'null';
new FhirApi({ fhirUrl: import.meta.env.REACT_APP_FHIR_SERVER_URL, setUserDetails: undefined })
    .getVersion()
    .then((version: string) => (fhirServerVersion = version));

const EnvContext = createContext<{
    fhirUrl: string;
    AUTH_PROVIDERS: string;
    FHIR_APP_VERSION: string;
    AWS_REGION: string;
    getFhirServerVersion:() => string;
}>({
    fhirUrl: import.meta.env.REACT_APP_FHIR_SERVER_URL || '',
    AUTH_PROVIDERS: import.meta.env.REACT_APP_AUTH_PROVIDERS || '',
    FHIR_APP_VERSION: import.meta.env.REACT_APP_VERSION || 'null',
    AWS_REGION: import.meta.env.REACT_APP_AWS_REGION || '',
    getFhirServerVersion: () => fhirServerVersion,
});

export default EnvContext;
