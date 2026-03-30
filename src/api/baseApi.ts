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
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
        this.axiosInstance.interceptors.request.use(this.requestInterceptor);
    }

    private getBaseUrl(): string {
        return this.fhirUrl || '';
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
            if (err.response?.status === 401 && this.setUserDetails) {
                await logout(this.setUserDetails);
            }
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
            if (err.response?.status === 401 && this.setUserDetails) {
                await logout(this.setUserDetails);
            }
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
        let tokenToSendToFhirServer = 'jwt';
        const identityProvider = getLocalData('identityProvider');
        if (identityProvider) {
            const authInfo = new AuthUrlProvider().getAuthInfo(identityProvider);
            tokenToSendToFhirServer = authInfo.tokenToSendToFhirServer || tokenToSendToFhirServer;
        }
        const token = getLocalData(tokenToSendToFhirServer);
        if (typeof token === 'string') {
            req.headers.Authorization = `Bearer ${token}`;
        }
        req.headers.Accept = 'application/json';
        req.headers['Cache-Control'] = 'no-cache';
        req.headers['Pragma'] = 'no-cache';
        req.headers['Expires'] = '0';
        req.headers['Origin-Service'] = 'fhir-ui';
        return req;
    }
}

export default BaseApi;
