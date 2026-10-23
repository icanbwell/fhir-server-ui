import { useContext, useMemo } from 'react';
import { BaileyChatTransport, createBaileyClient } from '@icanbwell/baileyai-chat-ui';
import BaileyApi from '../api/baileyApi';
import EnvContext from '../context/EnvironmentContext';

// Memoized on `baileyUrl` so useBaileyChat's send/stop/retryLast callbacks (which depend on
// `transport` referentially) aren't recreated every render.
export function useBaileyChatTransport(): BaileyChatTransport {
    const { baileyUrl } = useContext(EnvContext);

    return useMemo<BaileyChatTransport>(() => {
        // setUserDetails is deliberately undefined: nothing on the Bailey path may log the user out.
        const api = new BaileyApi({ fhirUrl: baileyUrl, setUserDetails: undefined });
        return createBaileyClient({
            // The library appends `/responses`; REACT_APP_BAILEY_URL is the origin only.
            baseUrl: `${baileyUrl.replace(/\/+$/, '')}/bailey/v1`,
            // Read on every request so a rotated token is picked up.
            getHeaders: async () => api.getAuthHeaders(),
            // Bailey validates the caller's bearer token against its own AUTH_PROVIDERS, which may
            // not trust the same issuer fhir-server-ui's token came from. A 401/403 from Bailey is
            // therefore a config mismatch between two services, not evidence this app's session is
            // invalid: ignore it on purpose so it cannot log the user out. The chat shows the error.
            onAuthError: () => undefined,
        });
    }, [baileyUrl]);
}
