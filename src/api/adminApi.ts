import { InternalAxiosRequestConfig } from 'axios';
import BaseApi from './baseApi';

interface RunPersonMatchParams {
    sourceId: string;
    sourceType: string;
    targetId: string;
    targetType: string;
}

class AdminApi extends BaseApi {
    requestInterceptor(req: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> {
        req.headers['Cache-Control'] = 'no-cache';
        req.headers['Pragma'] = 'no-cache';
        req.headers['Expires'] = '0';

        return super.requestInterceptor(req);
    }

    async runPersonMatch({
        sourceId,
        sourceType,
        targetId,
        targetType,
    }: RunPersonMatchParams): Promise<any> {
        const urlString = '/admin/runPersonMatch';
        const params = {
            sourceId,
            sourceType,
            targetId,
            targetType,
        };

        return await this.getData({ urlString, params });
    }

    async getEverythingForPatient(patientId: string): Promise<any> {
        const urlString = '/4_0_0/Patient/$everything';
        const params = {
            id: patientId,
            _format: 'json',
            contained: true
        };
        return await this.getData({ urlString, params });
    }

    async deletePatient(patientId: string): Promise<any> {
        const urlString = '/admin/deletePatientDataGraph';
        const params = { id: patientId };
        return await this.getData({ urlString, params });
    }

    async getEverythingForPerson(personId: string): Promise<any> {
        const urlString = '/4_0_0/Person/$everything';
        const params = {
            id: personId,
            _format: 'json',
            contained: true
        };
        return await this.getData({ urlString, params });
    }

    async deletePerson(personId: string): Promise<any> {
        const urlString = '/admin/deletePersonDataGraph';
        const params = { id: personId };
        return await this.getData({ urlString, params });
    }

    async showPersonToPersonLink(bwellPersonId: string) {
        const urlString = '/admin/showPersonToPersonLink';
        const params = { bwellPersonId };
        return await this.getData({ urlString, params });
    }

    async createPersonToPersonLink(
        bwellPersonId: string,
        externalPersonId: string,
    ) {
        const urlString = '/admin/createPersonToPersonLink';
        const params = {
            bwellPersonId,
            externalPersonId
        };
        return await this.getData({ urlString, params });
    }

    async removePersonToPersonLink(
        bwellPersonId: string,
        externalPersonId: string,
    ) {
        const urlString = '/admin/removePersonToPersonLink';
        const params = {
            bwellPersonId,
            externalPersonId
        };
        return await this.getData({ urlString, params });
    }

    async createPersonToPatientLink(externalPersonId: string, patientId: string) {
        const urlString = '/admin/createPersonToPatientLink';
        const params = {
            externalPersonId,
            patientId
        };
        return await this.getData({ urlString, params });
    }

    async searchLogs(id: string) {
        const urlString = '/admin/searchLogResults';
        const params = {id};
        return await this.getData({ urlString, params });
    }

    async indexApi(url: string, audit?: boolean) {
        const params = { audit, _format: 1};
        return await this.getData({ urlString: url, params });
    }
}

export default AdminApi;
