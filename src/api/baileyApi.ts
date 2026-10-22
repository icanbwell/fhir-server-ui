import BaseApi from './baseApi';

const BAILEY_AUTH_HEADER_NAMES = new Set(['authorization', 'origin-service']);

// Bailey validates the caller's bearer token against its own AUTH_PROVIDERS, which may not
// trust the same issuer fhir-server-ui's token came from. BaileyApi no longer sends requests
// itself: the @icanbwell/baileyai-chat-ui client does, and only asks this class for headers, so
// no code path here can reach BaseApi's 401 handling (which logs the user out).
class BaileyApi extends BaseApi {
    /**
     * Authorization (from the session token, per identityProvider) and Origin-Service only.
     * The library client owns Accept and Content-Type, so none of BaseApi's other defaults
     * are returned.
     */
    getAuthHeaders(): Record<string, string> {
        return Object.fromEntries(
            Object.entries(this.buildHeaders()).filter(([name]) => BAILEY_AUTH_HEADER_NAMES.has(name.toLowerCase()))
        );
    }
}

export default BaileyApi;
