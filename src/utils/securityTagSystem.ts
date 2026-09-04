export const SecurityTagSystem = {
    access: 'https://www.icanbwell.com/access',
    owner: 'https://www.icanbwell.com/owner',
    vendor: 'https://www.icanbwell.com/vendor',
    sourceAssigningAuthority: 'https://www.icanbwell.com/sourceAssigningAuthority',
    connectionType: 'https://www.icanbwell.com/connectionType',
    // Approved in FDR: Limiting the access of Binary Resources (EFS-1336) - Binary is a
    // non-patient FHIR resource, so without this tag any authenticated user could read any
    // Binary. The value is a bare `Patient/<uuid>` reference string, matching the resource's
    // owning DocumentReference.subject.
    sourcePatientId: 'https://www.icanbwell.com/sourcePatientId',
};
