/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
Organization
    A formally or informally recognized grouping of people or organizations formed
    for the purpose of achieving some form of collective action.  Includes
    companies, institutions, corporations, departments, community groups,
    healthcare practice groups, payer/insurer, etc.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TOrganization } from '../../types/resources/Organization';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const Organization = ({ resource }: { resource: TOrganization }): React.ReactElement => {
    const sourceAssigningAuthority = resource?.meta?.security?.find(
        s => s.system === SecurityTagSystem.sourceAssigningAuthority
    )?.code;
    const uuid = resource.id && isUuid(`${resource.id}`) ?
        resource.id : generateUuidV5(`${resource.id}|${sourceAssigningAuthority}`);

    return (
        <>
            <Link title="Direct link to Resource" to={`/4_0_0/${resource.resourceType}/${uuid}`}>
                {resource.resourceType}/{uuid}
            </Link>
            {
                resource.meta &&
                <Partials.Meta
                    meta={resource.meta}
                    name='Meta'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='meta'
                />
            }
            {
                resource.name &&
                <Partials.NameValue
                    name='Name'
                    value={resource.name}
                    searchParameter='name'
                />
            }
            {
                resource.implicitRules &&
                <Partials.Uri
                    uri={resource.implicitRules}
                    name='Implicit Rules'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='implicit-rules'
                />
            }
            {
                resource.language &&
                <Partials.Code code={resource.language} name='Language'/>
            }
            {
                resource.text &&
                <Partials.Narrative
                    narrative={resource.text}
                    name='Text'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='text'
                />
            }
            {
                resource.extension &&
                <Partials.Extension
                    extension={resource.extension}
                    name='Extension'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='extension'
                />
            }
            {
                resource.modifierExtension &&
                <Partials.Extension
                    extension={resource.modifierExtension}
                    name='Modifier Extension'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='modifier-extension'
                />
            }
            {
                resource.identifier &&
                <Partials.Identifier
                    identifier={resource.identifier}
                    name='Identifier'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='identifier'
                />
            }
            {
                resource.active &&
                <Partials.Boolean
                    boolean={resource.active}
                    name='Active'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='active'
                />
            }
            {
                resource.type &&
                <Partials.CodeableConcept
                    codeableConcept={resource.type}
                    name='Type'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='type'
                />
            }
            {
                resource.telecom &&
                <Partials.ContactPoint
                    contactPoint={resource.telecom}
                    name='Telecom'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='telecom'
                />
            }
            {
                resource.address &&
                <Partials.Address
                    address={resource.address}
                    name='Address'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='address'
                />
            }
            {
                resource.partOf &&
                <Partials.Reference
                    reference={resource.partOf}
                    name='Part Of'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='part-of'
                />
            }
            {
                resource.endpoint &&
                <Partials.Reference
                    reference={resource.endpoint}
                    name='Endpoint'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='endpoint'
                />
            }
            <Typography variant="h4" sx={{ mt: 1 }}>
                Related Resources
            </Typography>
            <Partials.ReverseReference
                name="Practitioner Role"
                id={uuid}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'PractitionerRole', 'property': 'organization'}]}
            />
            <Partials.ReverseReference
                name="Healthcare Service"
                id={uuid}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'HealthcareService', 'property': 'organization'}]}
            />
            <Partials.ReverseReference
                name="Location"
                id={uuid}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'Location', 'property': 'organization'}]}
            />
        </>
    );
};

export default Organization;
