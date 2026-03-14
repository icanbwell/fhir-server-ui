import { getStartAndEndDate } from '../utils/auditEventDateFilter';
import BaseApi from './baseApi';

interface GetResourceParams {
    id: string;
    resourceType: string;
}

interface GetBundleAsyncParams {
    resourceType: string;
    id?: string;
    queryString?: string;
    queryParameters?: string[];
    operation?: string;
}

interface GetUrlParams {
    resourceType: string;
    id?: string;
    queryString?: string;
    queryParameters?: string[];
    operation?: string;
}

class FhirApi extends BaseApi {
    async getResource({ id, resourceType }: GetResourceParams) {
        const urlString = `/4_0_0/${resourceType}/${id}/`;
        return await this.getData({urlString});
    }

    async getBundleAsync({
        resourceType,
        id,
        queryString,
        queryParameters,
        operation,
    }: GetBundleAsyncParams): Promise<{ status: number; json: any }> {
        const url = this.getUrl({
            resourceType,
            id,
            queryString,
            queryParameters,
            operation,
        });
        return await this.getData({urlString: url.toString()});
    }

    addMissingRequiredParams({
        queryParams,
        id,
        resourceType,
        operation
    }: { queryParams: URLSearchParams; id?: string, resourceType: string, operation?: string | undefined }) {
        if ((!id || id === '_history' || operation === '_history') && !queryParams.has('_count')) {
            queryParams.append('_count', '10');
        }
        if (!queryParams.has('_metaUuid') && queryParams.get('_format') !== 'json') {
            queryParams.append('_metaUuid', '1');
        }
        if (resourceType === 'AuditEvent' && !queryParams.has('date')) {
            const { startDate, endDate } = getStartAndEndDate();
            // Append 'date' query parameters for AuditEvent
            queryParams.append('date', `ge${startDate.toISOString().split('T')[0]}`);
            queryParams.append('date', `le${endDate.toISOString().split('T')[0]}`);
        }
        return queryParams;
    }

    getUrl({
        resourceType,
        id,
        queryString,
        queryParameters,
        operation,
    }: GetUrlParams): URL {
        let urlString = `/4_0_0/${resourceType}`;
        if (id) {
            urlString += `/${id}`;
        }
        if (operation) {
            urlString += `/${operation}`;
        }

        function stripFirstCharIfQuestionMark(str: string) {
            if (str.charAt(0) === '?') {
                return str.slice(1);
            }
            return str;
        }

        if (queryString) {
            urlString += `?${stripFirstCharIfQuestionMark(queryString)}`;
        }
        const url = new URL(urlString, window.location.origin);
        if (queryParameters && queryParameters.length > 0) {
            queryParameters.forEach((queryParameter) => {
                const firstEquals = queryParameter.indexOf('=');
                const name = queryParameter.substring(0, firstEquals);
                const value = queryParameter.substring(firstEquals + 1);
                url.searchParams.append(name, value);
            });
        }
        this.addMissingRequiredParams({ queryParams: url.searchParams, id, resourceType, operation });
        return url;
    }
}

export default FhirApi;
