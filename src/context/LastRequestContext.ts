import { createContext } from 'react';

export type TLastRequest = {
    method: string;
    url: string;
    pathname: string;
} | null;

const LastRequestContext = createContext<{
    lastRequest: TLastRequest;
    recordRequest: (info: { method: string; url: string }) => void;
}>({
    lastRequest: null,
    recordRequest: () => {},
});

export default LastRequestContext;
