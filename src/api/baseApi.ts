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

    constructor({
        fhirUrl,
        setUserDetails,
    }: {
        fhirUrl: string | undefined;
        setUserDetails: React.Dispatch<React.SetStateAction<TUserDetails | null>> | undefined;
    }) {
        this.fhirUrl = fhirUrl;
        this.setUserDetails = setUserDetails;

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

        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            Expires: '0',
            'Origin-Service': 'fhir-ui',
            ...extra,
        };
        if (typeof token === 'string') {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
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

        try {
            const response = await this.axiosInstance.get(url.toString());
            return { status: response.status, json: response.data };
        } catch (err: any) {
            await this.handleUnauthorized(err.response?.status);
            return { status: err.response?.status, json: err.response?.data };
        }
    }

    async request({ urlString, params, method, data }: RequestParams): Promise<any> {
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
