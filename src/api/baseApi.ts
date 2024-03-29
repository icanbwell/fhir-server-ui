import React from 'react';
import axios from 'axios';
import { InternalAxiosRequestConfig } from 'axios';
import { getLocalData, removeLocalData } from '../utils/localData.utils';
import { TUserDetails } from '../types/baseTypes';

interface GetDataParams {
    urlString: string;
    params?: any;
}

class BaseApi {
    private readonly fhirUrl: string | undefined;
    private readonly setUserDetails: React.Dispatch<React.SetStateAction<TUserDetails|null>> | undefined;

    constructor({
        fhirUrl,
        setUserDetails,
    }: {
        fhirUrl: string | undefined;
        setUserDetails: React.Dispatch<React.SetStateAction<TUserDetails|null>> | undefined;
    }) {
        this.fhirUrl = fhirUrl;
        this.setUserDetails = setUserDetails;
        axios.interceptors.request.use(this.requestInterceptor);
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
            const response = await axios.get(url.toString());
            return { status: response.status, json: response.data };
        } catch (err: any) {
            if (err.response?.status === 401 && this.setUserDetails) {
                removeLocalData('jwt');
                this.setUserDetails(null);
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
        req.headers['Cache-Control'] = 'no-cache';
        req.headers['Pragma'] = 'no-cache';
        req.headers['Expires'] = '0';
        return req;
    }
}

export default BaseApi;
