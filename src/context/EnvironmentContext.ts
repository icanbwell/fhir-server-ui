import { createContext } from 'react';
import { isTrue } from '../utils/isTrue';
import FhirApi from '../api/fhirApi';

let fhirServerversion = 'null';
new FhirApi({ fhirUrl: process.env.REACT_APP_FHIR_SERVER_URL, setUserDetails: undefined })
    .getVersion()
    .then((version: string) => (fhirServerversion = version));

const EnvContext = createContext<{
    fhirUrl: string;
    AUTH_CUSTOM_GROUP: string;
    AUTH_CUSTOM_SCOPE: string;
    AUTH_CODE_FLOW_CLIENT_ID: string;
    AUTH_CODE_FLOW_URL: string;
    AUTH_ENABLED: boolean;
    FHIR_APP_VERSION: string;
    getFhirServerVersion:() => string;
}>({
    fhirUrl: process.env.REACT_APP_FHIR_SERVER_URL || '',
    AUTH_CUSTOM_GROUP: process.env.REACT_APP_AUTH_CUSTOM_GROUP || '',
    AUTH_CUSTOM_SCOPE: process.env.REACT_APP_AUTH_CUSTOM_SCOPE || '',
    AUTH_CODE_FLOW_CLIENT_ID: process.env.REACT_APP_AUTH_CODE_FLOW_CLIENT_ID || '',
    AUTH_CODE_FLOW_URL: process.env.REACT_APP_AUTH_CODE_FLOW_URL || '',
    AUTH_ENABLED: isTrue(process.env.REACT_APP_AUTH_ENABLED || '1'),
    FHIR_APP_VERSION: process.env.FHIR_APP_VERSION || 'null',
    getFhirServerVersion: () => fhirServerversion,
});

export default EnvContext;
