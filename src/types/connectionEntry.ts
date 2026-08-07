export interface ConnectionEntry {
    service_slug: string;
    display_name: string;
    category: string;
    status: string;
    expired: boolean;
    is_direct: boolean;
    number_of_resources: number;
}

export interface ConnectionToken {
    token: string;
    url: string;
    fhir_version: string;
    patient_id: string;
    expiry: string;
    custom_fhir_api_headers?: string;
}
