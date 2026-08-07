import { createContext } from 'react';

// Single source of truth for the HTTP method union, shared by BaseApi.RequestParams and
// FhirApi.sendRequest as well as this context — defined here (rather than in baseApi.ts) so
// baseApi.ts can import TRequestInfo/HttpMethod from this module without creating a circular
// import (baseApi.ts -> context -> baseApi.ts).
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type TRequestInfo = { method: HttpMethod; url: string };

export type TLastRequest = (TRequestInfo & { pathname: string }) | null;

const LastRequestContext = createContext<{
    lastRequest: TLastRequest;
    recordRequest: (info: TRequestInfo) => void;
}>({
    lastRequest: null,
    recordRequest: () => {},
});

export default LastRequestContext;
