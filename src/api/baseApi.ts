import React from 'react';
import axios from 'axios';
import { InternalAxiosRequestConfig } from 'axios';
import { getLocalData } from '../utils/localData.utils';

interface GetDataParams {
    urlString: string;
    params?: any;
}

class BaseApi {
    private readonly fhirUrl: string | undefined;
    private readonly setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>> | undefined;

    constructor({
        fhirUrl,
        setIsLoggedIn,
    }: {
        fhirUrl: string | undefined;
        setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>> | undefined;
    }) {
        this.fhirUrl = fhirUrl;
        this.setIsLoggedIn = setIsLoggedIn;
        axios.interceptors.request.use(this.requestInterceptor);
    }

    private getBaseUrl(): string {
        return this.fhirUrl || '';
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
            const response = await axios.get(url.toString());
            return { status: response.status, json: response.data };
        } catch (err: any) {
            if (err.response?.status === 401 && this.setIsLoggedIn) {
                this.setIsLoggedIn(false);
            }
            return { status: err.response?.status, json: err.response?.data };
        }
    }

    requestInterceptor(req: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> {
        const token = getLocalData('jwt');
        if (typeof token === 'string') {
            req.headers.Authorization = `Bearer ${token}`;
        }
        req.headers.Accept = 'application/json';
        return req;
    }
}

export default BaseApi;
