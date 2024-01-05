import { createContext } from 'react';

const EnvContext = createContext<{
    fhirUrl: string,
    AUTH_CUSTOM_GROUP: string,
    AUTH_CUSTOM_SCOPE: string,
    FHIR_SERVER_URL: string,
    AUTH_CODE_FLOW_CLIENT_ID: string,
    AUTH_CODE_FLOW_URL: string,
    AUTH_ENABLED: boolean,
    ENV: string,
    ENVIRONMENT: string,
}>({
    fhirUrl: process.env.REACT_APP_FHIR_SERVER_URL || '',
    AUTH_CUSTOM_GROUP: process.env.REACT_APP_AUTH_CUSTOM_GROUP || '',
    AUTH_CUSTOM_SCOPE: process.env.REACT_APP_AUTH_CUSTOM_SCOPE || '',
    FHIR_SERVER_URL: process.env.REACT_APP_FHIR_SERVER_URL || '',
    AUTH_CODE_FLOW_CLIENT_ID: process.env.REACT_APP_AUTH_CODE_FLOW_CLIENT_ID || '',
    AUTH_CODE_FLOW_URL: process.env.REACT_APP_AUTH_CODE_FLOW_URL || '',
    AUTH_ENABLED: process.env.REACT_APP_AUTH_ENABLED === '1',
    ENV: process.env.REACT_APP_ENV || '',
    ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || '',
});

export default EnvContext;
