import { useContext, useMemo } from 'react';
import { BaileyChatTransport } from '@icanbwell/baileyai-chat-ui';
import BaileyApi from '../api/baileyApi';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';

// Memoized on the values BaileyApi's constructor reads so useBaileyChat's send/stop/retryLast
// callbacks (which depend on `transport` referentially) aren't recreated every render.
export function useBaileyChatTransport(): BaileyChatTransport {
    const { baileyUrl } = useContext(EnvContext);
    const { setUserDetails } = useContext(UserContext);

    return useMemo<BaileyChatTransport>(() => {
        const api = new BaileyApi({ fhirUrl: baileyUrl, setUserDetails });
        return { streamChat: (params) => api.streamChat(params) };
    }, [baileyUrl, setUserDetails]);
}
