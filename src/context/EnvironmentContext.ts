import { createContext } from 'react';
import FhirApi from '../api/fhirApi';
import { isTrue } from '../utils/isTrue';
import { APP_ENV } from '../runtimeEnv';

let fhirServerVersion = 'null';
new FhirApi({ fhirUrl: APP_ENV.REACT_APP_FHIR_SERVER_URL, setUserDetails: undefined })
    .getVersion()
    .then((version: string) => (fhirServerVersion = version))
    // Module-level fire-and-forget call: nothing awaits this promise, so a rejection (e.g. no
    // FHIR server configured, as in unit tests, or the server being briefly unreachable) would
    // otherwise surface as an unhandled promise rejection instead of just leaving
    // fhirServerVersion at its 'null' default.
    .catch(() => undefined);

// Unset defaults to enabled — this flag is an opt-out kill switch, not an opt-in feature gate,
// so environments that don't yet know about it keep showing Bailey as before.
const enableBaileyEnv = APP_ENV.REACT_APP_ENABLE_BAILEY;
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
    fhirUrl: APP_ENV.REACT_APP_FHIR_SERVER_URL || '',
    AUTH_PROVIDERS: APP_ENV.REACT_APP_AUTH_PROVIDERS || '',
    FHIR_APP_VERSION: APP_ENV.REACT_APP_VERSION || 'null',
    AWS_REGION: APP_ENV.REACT_APP_AWS_REGION || '',
    baileyUrl: APP_ENV.REACT_APP_BAILEY_URL || '',
    baileyModel: APP_ENV.REACT_APP_BAILEY_MODEL || '',
    baileyEnabled,
    getFhirServerVersion: () => fhirServerVersion,
});

export default EnvContext;
