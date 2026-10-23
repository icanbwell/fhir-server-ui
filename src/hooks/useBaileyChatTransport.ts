import { useContext, useMemo } from 'react';
import { BaileyChatTransport, createBaileyClient } from '@icanbwell/baileyai-chat-ui';
import BaileyApi from '../api/baileyApi';
import EnvContext from '../context/EnvironmentContext';

// Shown after the library's "Bailey request failed (status network error)." prefix. Fixed copy:
// the browser reports CORS, DNS and offline identically, and the underlying error text can carry
// the request URL, so it is never displayed (it stays on `errorCause` for callers that want it).
export const NETWORK_ERROR_COPY = "Couldn't reach Bailey. Check your connection and try again.";
export const TIMEOUT_ERROR_COPY = 'Bailey took too long to respond. Try again.';

const COPY_BY_KIND = { network: NETWORK_ERROR_COPY, timeout: TIMEOUT_ERROR_COPY } as const;

type StreamChatResult = Awaited<ReturnType<BaileyChatTransport['streamChat']>>;

// Memoized on `baileyUrl` so useBaileyChat's send/stop/retryLast callbacks (which depend on
// `transport` referentially) aren't recreated every render.
export function useBaileyChatTransport(): BaileyChatTransport {
    const { baileyUrl } = useContext(EnvContext);

    return useMemo<BaileyChatTransport>(() => {
        // setUserDetails is deliberately undefined: nothing on the Bailey path may log the user out.
        const api = new BaileyApi({ fhirUrl: baileyUrl, setUserDetails: undefined });
        const client = createBaileyClient({
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
        return {
            // Chooses the user-visible text from the failure kind. Results without `errorKind`
            // (HTTP statuses, interrupted streams) pass through unchanged; `errorKind` and
            // `errorCause` are preserved on the result.
            async streamChat(params) {
                const result: StreamChatResult = await client.streamChat(params);
                return result.errorKind
                    ? { ...result, errorMessage: COPY_BY_KIND[result.errorKind] }
                    : result;
            },
        };
    }, [baileyUrl]);
}
