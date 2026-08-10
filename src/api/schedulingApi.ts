import BaseApi from './baseApi';

// Mirrors FhirApi (src/api/fhirApi.ts) exactly — same generic
// BaseApi-derived client shape as FhirApi/TokenServiceApi, just pointed at
// scheduling-service's base URL instead. Uses BaseApi's default
// handleUnauthorized (log out on 401): scheduling-service is called with this
// app's own session bearer token, so a 401 from it means this app's own
// session is invalid, same as a 401 from the FHIR server.
//
// sendRequest() (used by SchedulingConsoleContent's FhirRequestConsole) is inherited from
// BaseApi — its logic isn't FHIR-specific and is shared with FhirApi.
class SchedulingApi extends BaseApi {}

export default SchedulingApi;
