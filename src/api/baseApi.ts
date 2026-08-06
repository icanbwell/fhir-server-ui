import React from 'react';
import axios, { AxiosInstance } from 'axios';
import { InternalAxiosRequestConfig } from 'axios';
import { getLocalData } from '../utils/localData.utils';
import { TUserDetails } from '../types/baseTypes';
import AuthUrlProvider from '../utils/authUrlProvider';
import { logout } from '../utils/auth.utils';

interface GetDataParams {
    urlString: string;
    params?: any;
}

interface RequestParams {
    urlString: string;
    params?: any;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
}

class BaseApi {
    private readonly fhirUrl: string | undefined;
    private readonly setUserDetails:
        | React.Dispatch<React.SetStateAction<TUserDetails | null>>
        | undefined;
    private readonly axiosInstance: AxiosInstance;
    protected readonly onRequest?: (info: { method: string; url: string }) => void;

    constructor({
        fhirUrl,
        setUserDetails,
        onRequest,
    }: {
        fhirUrl: string | undefined;
        setUserDetails: React.Dispatch<React.SetStateAction<TUserDetails | null>> | undefined;
        onRequest?: (info: { method: string; url: string }) => void;
    }) {
        this.fhirUrl = fhirUrl;
        this.setUserDetails = setUserDetails;
        this.onRequest = onRequest;

        // Create a dedicated axios instance for this BaseApi instance
        this.axiosInstance = axios.create();
        this.axiosInstance.interceptors.request.use(this.requestInterceptor.bind(this));
    }

    protected getBaseUrl(): string {
        return this.fhirUrl || '';
    }

    protected buildHeaders(extra?: Record<string, string>): Record<string, string> {
        let tokenToSendToFhirServer = 'jwt';
        const identityProvider = getLocalData('identityProvider');
        if (identityProvider) {
            const authInfo = new AuthUrlProvider().getAuthInfo(identityProvider);
            tokenToSendToFhirServer = authInfo.tokenToSendToFhirServer || tokenToSendToFhirServer;
        }
        const token = getLocalData(tokenToSendToFhirServer);

        // HTTP header names are case-insensitive, but a plain object treats `Content-Type` and
        // `content-type` as two distinct keys — and fetch()'s Headers constructor then
        // comma-joins their values instead of letting the caller cleanly override the default.
        // Keying by the lower-cased name (while remembering the original spelling) guarantees
        // only one entry per header survives, with the last one set winning, matching HTTP
        // header semantics.
        const merged = new Map<string, { name: string; value: string }>();
        const setHeader = (name: string, value: string) => {
            merged.set(name.toLowerCase(), { name, value });
        };

        setHeader('Accept', 'application/json');
        setHeader('Cache-Control', 'no-cache');
        setHeader('Pragma', 'no-cache');
        setHeader('Expires', '0');
        setHeader('Origin-Service', 'fhir-ui');

        Object.entries(extra || {}).forEach(([name, value]) => {
            // `Authorization` is owned exclusively by the session token (below) and can never be
            // overridden or blanked by a caller-supplied header. Enforced here rather than at the
            // call site so every caller of buildHeaders/sendRequest gets the guarantee, whether
            // or not a session token exists.
            if (name.toLowerCase() === 'authorization') {
                return;
            }
            setHeader(name, value);
        });

        if (typeof token === 'string') {
            setHeader('Authorization', `Bearer ${token}`);
        }

        return Object.fromEntries(
            Array.from(merged.values(), ({ name, value }) => [name, value] as [string, string])
        );
    }

    protected async handleUnauthorized(status: number | undefined): Promise<void> {
        if (status === 401 && this.setUserDetails) {
            await logout(this.setUserDetails);
        }
    }

    async getVersion(): Promise<string> {
        return (await this.getData({ urlString: '/version' })).json?.version;
    }

    async getData({ urlString, params }: GetDataParams): Promise<any> {
        if (urlString.includes(window.location.origin)) {
            urlString = urlString.replace(window.location.origin, '');
        }
        const url = new URL(urlString, this.getBaseUrl());
        if (params && Object.keys(params).length > 0) {
            url.search = new URLSearchParams(params).toString();
        }

        this.onRequest?.({ method: 'GET', url: url.pathname + url.search });

        try {
            const response = await this.axiosInstance.get(url.toString());
            return { status: response.status, json: response.data };
        } catch (err: any) {
            await this.handleUnauthorized(err.response?.status);
            return { status: err.response?.status, json: err.response?.data };
        }
    }

    async request({ urlString, params, method, data }: RequestParams): Promise<any> {
        this.onRequest?.({ method, url: urlString });

        try {
            const response = await this.axiosInstance.request({
                baseURL: this.getBaseUrl(),
                url: urlString,
                method,
                params,
                data,
                headers: {
                    'Content-Type': 'application/fhir+json'
                }
            });
            return { status: response.status, json: response.data };
        } catch (err: any) {
            await this.handleUnauthorized(err.response?.status);
            return { status: err.response?.status, json: err.response?.data };
        }
    }

    async downloadFile(url: string): Promise<any> {
        try {
            const response = await this.axiosInstance.get(url, {
                responseType: 'blob',
            });
            return {
                status: response.status,
                data: response.data,
                headers: response.headers
            };
        } catch (err: any) {
            if (err.response?.status === 401 && this.setUserDetails) {
                await logout(this.setUserDetails);
            }
            throw err;
        }
    }

    requestInterceptor(req: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> {
        const headers = this.buildHeaders();
        Object.entries(headers).forEach(([key, value]) => {
            req.headers[key] = value;
        });
        return req;
    }
}

export default BaseApi;
