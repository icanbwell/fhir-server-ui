import { createContext } from 'react';
import FhirApi from '../api/fhirApi';
import { isTrue } from '../utils/isTrue';

let fhirServerVersion = 'null';
new FhirApi({ fhirUrl: import.meta.env.REACT_APP_FHIR_SERVER_URL, setUserDetails: undefined })
    .getVersion()
    .then((version: string) => (fhirServerVersion = version));

// Unset defaults to enabled — this flag is an opt-out kill switch, not an opt-in feature gate,
// so environments that don't yet know about it keep showing Bailey as before.
const enableBaileyEnv = import.meta.env.REACT_APP_ENABLE_BAILEY;
export const baileyEnabled = enableBaileyEnv === undefined || enableBaileyEnv === '' || isTrue(enableBaileyEnv);

const EnvContext = createContext<{
    fhirUrl: string;
    AUTH_PROVIDERS: string;
    FHIR_APP_VERSION: string;
    AWS_REGION: string;
    baileyUrl: string;
    baileyModel: string;
    baileyEnabled: boolean;
    getFhirServerVersion:() => string;
}>({
    fhirUrl: import.meta.env.REACT_APP_FHIR_SERVER_URL || '',
    AUTH_PROVIDERS: import.meta.env.REACT_APP_AUTH_PROVIDERS || '',
    FHIR_APP_VERSION: import.meta.env.REACT_APP_VERSION || 'null',
    AWS_REGION: import.meta.env.REACT_APP_AWS_REGION || '',
    baileyUrl: import.meta.env.REACT_APP_BAILEY_URL || '',
    baileyModel: import.meta.env.REACT_APP_BAILEY_MODEL || '',
    baileyEnabled,
    getFhirServerVersion: () => fhirServerVersion,
});

export default EnvContext;
