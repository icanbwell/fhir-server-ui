import advSearchJson from '../generator/json/definitions.json/search-parameters.json';
import { TFieldInfo } from '../types/baseTypes';

const givenNameField = (): TFieldInfo => {
    return {
        label: 'Given (Name)',
        name: 'given',
        sortField: 'name',
        useExactMatch: true,
    };
};

const familyNameField = (): TFieldInfo => {
    return {
        label: 'Family (Name)',
        name: 'family',
        sortField: 'name.family',
        useExactMatch: true,
    };
};

const emailField = (): TFieldInfo => {
    return {
        label: 'Email',
        name: 'email',
        sortField: 'name',
        useExactMatch: true,
    };
};

const identifierField = (): TFieldInfo => {
    return {
        label: 'Identifier',
        name: 'identifier',
        sortField: 'identifier',
        useExactMatch: true,
    };
};

const securityTagField = (): TFieldInfo => {
    return {
        label: 'Security',
        name: '_security',
        sortField: '_security',
        useExactMatch: true,
    };
};

const getPatientForm = (): TFieldInfo[] => {
    let patientArray: TFieldInfo[] = [];
    patientArray.push(givenNameField());
    patientArray.push(familyNameField());
    patientArray.push(emailField());
    patientArray.push(securityTagField());
    return patientArray;
};

const getPersonForm = (): TFieldInfo[] => {
    let personArray: TFieldInfo[] = [];
    personArray.push(givenNameField());
    personArray.push(familyNameField());
    personArray.push(emailField());
    personArray.push(securityTagField());
    return personArray;
};

const getPractitionerForm = (): TFieldInfo[] => {
    const practitionerArray: TFieldInfo[] = [];
    practitionerArray.push(givenNameField());
    practitionerArray.push(familyNameField());
    practitionerArray.push({
        label: 'NPI',
        name: 'npi',
        sortField: 'identifier',
    });
    practitionerArray.push(securityTagField());
    return practitionerArray;
};

const getOrganizationForm = (): TFieldInfo[] => {
    const formElements: TFieldInfo[] = [];
    formElements.push({
        label: 'Name',
        name: 'name',
        sortField: 'name',
    });
    formElements.push(securityTagField());
    return formElements;
};

const getEncounterForm = (): TFieldInfo[] => {
    const formElements: TFieldInfo[] = [];
    formElements.push({
        columnHeader: 'Period',
        label: 'Date',
        name: 'date',
        sortField: 'period',
    });
    return formElements;
};

const getFormData = (resourceName: string): TFieldInfo[] => {
    let formData: TFieldInfo[] = [];

    switch (resourceName) {
        case 'Patient':
            formData = formData.concat(getPatientForm());
            break;
        case 'Person':
            formData = formData.concat(getPersonForm());
            break;
        case 'Practitioner':
            formData = formData.concat(getPractitionerForm());
            break;
        case 'Organization':
            formData = formData.concat(getOrganizationForm());
            break;
        case 'Encounter':
            formData = formData.concat(getEncounterForm());
            break;
    }

    formData.push({
        label: 'Id',
        name: 'id',
        sortField: 'id',
        useExactMatch: true,
    });

    formData.push(identifierField());

    formData.push({
        label: 'Source',
        name: '_source',
        sortField: 'meta.source',
    });

    return formData;
};

const getAdvSearchFormData = (resourceName: string): TFieldInfo[] => {
    const basicFormData = getFormData(resourceName);

    let advFormData: TFieldInfo[] = [];
    const resourceFields = advSearchJson.entry.filter((entry: any) => {
        return entry.resource.base.includes(resourceName) && entry.resource.type === 'string';
    });

    resourceFields.forEach((advParam: any) => {
        const foundBasic = basicFormData.find(
            (formData) => formData.name === advParam.resource.name
        );
        if (foundBasic) {
            return;
        }
        advFormData.push({
            label: advParam.resource.name
                .split('-')
                .map((s: string) => s.charAt(0).toUpperCase() + s.substring(1))
                .join(' '),
            name: advParam.resource.name,
        });
    });
    return advFormData;
};

export { getAdvSearchFormData, getFormData };
