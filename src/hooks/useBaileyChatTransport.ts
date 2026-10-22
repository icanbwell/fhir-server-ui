import { useContext, useMemo } from 'react';
import { BaileyChatTransport, createBaileyClient } from '@icanbwell/baileyai-chat-ui';
import BaileyApi from '../api/baileyApi';
import EnvContext from '../context/EnvironmentContext';

// The library client takes the API root, including the /bailey/v1 prefix.
const BAILEY_API_PATH = '/bailey/v1';

// Memoized on baileyUrl so useBaileyChat's send/stop/retryLast callbacks (which depend on
// `transport` referentially) aren't recreated every render.
export function useBaileyChatTransport(): BaileyChatTransport {
    const { baileyUrl } = useContext(EnvContext);

    return useMemo<BaileyChatTransport>(() => {
        // No setUserDetails: nothing on the Bailey path may log the user out of fhir-server-ui.
        const api = new BaileyApi({ fhirUrl: baileyUrl, setUserDetails: undefined });
        return createBaileyClient({
            baseUrl: `${baileyUrl.replace(/\/+$/, '')}${BAILEY_API_PATH}`,
            // Read on every request so a rotated session token is picked up.
            getHeaders: async () => api.getAuthHeaders(),
            // Intentionally does nothing. Bailey validates the bearer token against its own
            // AUTH_PROVIDERS, which may not trust the issuer fhir-server-ui's token came from, so a
            // 401/403 from Bailey is a config mismatch between two services, not evidence this
            // app's own session is invalid. The chat shows the error; the session is left alone.
            onAuthError: () => undefined,
        });
    }, [baileyUrl]);
}
