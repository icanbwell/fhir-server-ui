import BaseApi from './baseApi';

interface GetPatientEverythingAsyncParams {
    patientId: string;
    question: string;
}

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
    async getPatientEverythingAsync({
        patientId,
        question,
    }: GetPatientEverythingAsyncParams) {
        const urlEncodedQuestion = encodeURIComponent(question);
        const urlString = `/4_0_0/Patient/${patientId}/$everything?_question=${urlEncodedQuestion}`;

        return await this.getData({urlString});
    }

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

    addMissingRequiredParams({ queryParams, id }: { queryParams: URLSearchParams; id?: string }) {
        if (!id && !queryParams.has('_count')) {
            queryParams.append('_count', '10');
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
                const [name, value] = queryParameter.split('=');
                url.searchParams.append(name, value);
            });
        }
        this.addMissingRequiredParams({ queryParams: url.searchParams, id });
        return url;
    }
}

export default FhirApi;
