import BaseApi from './baseApi';

interface RunPersonMatchParams {
    sourceId: string;
    sourceType: string;
    targetId: string;
    targetType: string;
    includeMatchRequest?: boolean;
}

interface RunPersonOneToNMatchParams {
    id: string;
    resourceType: string;
    matchResourceType?: string;
    includeMatchRequest?: boolean;
}

interface GetUrlParams {
    resourceType: string;
    id?: string;
    queryString?: string;
    queryParameters?: string[];
    operation?: string;
    fhirUrl?: string;
}

interface GetCacheKeysParams {
    resourceId: string;
    resourceType: string;
}

interface InvalidateCacheParams {
    cacheKeys: string[];
}

class AdminApi extends BaseApi {
    async runPersonMatch({
        sourceId,
        sourceType,
        targetId,
        targetType,
        includeMatchRequest,
    }: RunPersonMatchParams): Promise<any> {
        const urlString = '/admin/runPersonMatch';
        const params: Record<string, string> = {
            sourceId,
            sourceType,
            targetId,
            targetType,
        };
        if (includeMatchRequest) {
            params.includeMatchRequest = 'true';
        }
        return await this.request({ urlString, params, method: 'GET' });
    }

    async runPersonOneToNMatch({
        id,
        resourceType,
        matchResourceType,
        includeMatchRequest,
    }: RunPersonOneToNMatchParams): Promise<any> {
        const urlString = '/admin/runPersonOneToNMatch';
        const params: Record<string, string> = { id, resourceType };
        if (includeMatchRequest) {
            params.includeMatchRequest = 'true';
        }
        if (matchResourceType) {
            params.matchResourceType = matchResourceType;
        }
        return await this.request({ urlString, params, method: 'GET' });
    }

    async runMatchWithPayload(parameters: object): Promise<any> {
        const urlString = '/admin/runMatchWithPayload';
        return await this.request({ urlString, method: 'POST', data: parameters });
    }

    async getEverythingForPatient(patientId: string): Promise<any> {
        const urlString = '/4_0_0/Patient/$everything';
        const params = {
            id: patientId,
            _format: 'json',
            contained: true,
        };
        return await this.request({ urlString, params, method: 'GET' });
    }

    addMissingRequiredParams({
        queryParams,
        id
    }: { queryParams: URLSearchParams; id?: string, resourceType: string }) {
        if (!id && !queryParams.has('_count')) {
            queryParams.append('_count', '10');
        }
        return queryParams;
    }

    /**
     * Get URL object with Query Parameters attached
     * @param {string} resourceType
     * @param {string | undefined} id
     * @param {string | undefined} queryString
     * @param {string[] | undefined} queryParameters
     * @param {string} fhirUrl
     * @returns {URL}
     */
    getUrl({
        resourceType,
        id,
        queryString,
        queryParameters,
        fhirUrl
    }: GetUrlParams): URL {
        let urlString = `admin/${resourceType}`;
        if (id) {
            urlString += `/${id}`;
        }

        if (queryString) {
            if (queryString.charAt(0) === '?') {
                queryString = queryString.slice(1);
            }
            urlString += `?${queryString}`;
        }

        const url = new URL(urlString, fhirUrl);

        if (queryParameters) {
            queryParameters.forEach((queryParameter) => {
                const [name, value] = queryParameter.split('=');
                url.searchParams.append(name, value);
            });
        }
        this.addMissingRequiredParams({ queryParams: url.searchParams, id, resourceType });
        return url;
    }

    /**
     * Request GET Export Status
     * @param {string | undefined} id
     * @param {string | undefined} fhirUrl
     * @param {string | undefined} queryString
     * @param {string[] | undefined} queryParameters
     * @returns {Promise<any>}
     */
    async getExportStatus({
        id,
        fhirUrl,
        queryString,
        queryParameters,
    }: GetUrlParams): Promise<any> {
        const urlString = this.getUrl({ resourceType: 'ExportStatus', id, queryString, queryParameters, fhirUrl: fhirUrl }).toString();
        return await this.request({ urlString, method: 'GET' });
    }

    /**
     * Request Trigger Export Job
     * @param {String} exportStatusId
     * @returns {Promise<any>}
     */
    async triggerExport(exportStatusId: String): Promise<any> {
        const urlString = `/admin/triggerExport/${exportStatusId}`;
        return await this.request({ urlString, method: 'POST', data: null });
    }

    async deletePatient(patientId: string): Promise<any> {
        const urlString = '/admin/deletePatientDataGraph';
        const params = { id: patientId };
        return await this.request({ urlString, params, method: 'DELETE' });
    }

    async getEverythingForPerson(personId: string): Promise<any> {
        const urlString = '/4_0_0/Person/$everything';
        const params = {
            id: personId,
            _format: 'json',
            contained: true,
        };
        return await this.request({ urlString, params, method: 'GET' });
    }

    async deletePerson(personId: string): Promise<any> {
        const urlString = '/admin/deletePersonDataGraph';
        const params = { id: personId };
        return await this.request({ urlString, params, method: 'DELETE' });
    }

    async showPersonToPersonLink(bwellPersonId: string) {
        const urlString = '/admin/showPersonToPersonLink';
        const params = { bwellPersonId };
        return await this.request({ urlString, params, method: 'GET' });
    }

    async createPersonToPersonLink(bwellPersonId: string, externalPersonId: string) {
        const urlString = '/admin/createPersonToPersonLink';
        const data = {
            bwellPersonId,
            externalPersonId,
        };
        return await this.request({ urlString, data, method: 'POST' });
    }

    async removePersonToPersonLink(bwellPersonId: string, externalPersonId: string) {
        const urlString = '/admin/removePersonToPersonLink';
        const data = {
            bwellPersonId,
            externalPersonId,
        };
        return await this.request({ urlString, data, method: 'POST' });
    }

    async createPersonToPatientLink(externalPersonId: string, patientId: string) {
        const urlString = '/admin/createPersonToPatientLink';
        const data = {
            externalPersonId,
            patientId,
        };
        return await this.request({ urlString, data, method: 'POST' });
    }

    async removePersonToPatientLink(personId: string, patientId: string) {
        const urlString = '/admin/removePersonToPatientLink';
        const data = {
            personId,
            patientId,
        };
        return await this.request({ urlString, data, method: 'POST' });
    }

    async searchLogs(id: string) {
        const urlString = '/admin/searchLogResults';
        const params = { id };
        return await this.request({ urlString, params, method: 'GET' });
    }

    async updatePatientReference(resourceType: string, resourceId: string, patientId: string) {
        const urlString = '/admin/updatePatientReference';
        const data = {
            resourceType,
            resourceId,
            patientId,
        };
        return await this.request({ urlString, data, method: 'POST' });
    }

    async indexApi(url: string, audit?: boolean) {
        const params: any = { _format: 1 };
        if (audit) {
            params['audit'] = true;
        }
        return await this.request({ urlString: url, params, method: 'GET' });
    }

    async getAllCacheKeys({resourceId, resourceType}: GetCacheKeysParams): Promise<any> {
        const urlString = '/admin/getCacheKeys';
        const params = { resourceId, resourceType };
        return await this.request({ urlString, params, method: 'GET' });
    }

    async invalidateCache({
        cacheKeys,
    }: InvalidateCacheParams): Promise<any> {
        const urlString = '/admin/invalidateCache';
        const data = {cacheKeys: cacheKeys};
        return await this.request({ urlString, data, method: 'POST' });
    }
}

export default AdminApi;
