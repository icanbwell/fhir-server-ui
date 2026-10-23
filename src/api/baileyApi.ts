import BaseApi from './baseApi';

const AUTH_HEADER_NAMES = new Set(['authorization', 'origin-service']);

/**
 * Builds the auth headers for Bailey requests. The streaming transport itself is owned by
 * `@icanbwell/baileyai-chat-ui` (`createBaileyClient`); this class only supplies the session
 * token, selected per identity provider exactly as for every other API in this app.
 */
class BaileyApi extends BaseApi {
    /**
     * `Authorization` (omitted when no session token exists) and `Origin-Service` only. The
     * library sets its own `Accept` and `Content-Type`, so the BaseApi defaults for those are
     * dropped here rather than fought.
     */
    getAuthHeaders(): Record<string, string> {
        return Object.fromEntries(
            Object.entries(this.buildHeaders()).filter(([name]) => AUTH_HEADER_NAMES.has(name.toLowerCase()))
        );
    }
}

export default BaileyApi;
