/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
Location
    Details and position information for a physical place where services are
    provided and resources and participants may be stored, found, contained, or
    accommodated.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TLocation } from '../../types/resources/Location';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const Location = ({ resource }: { resource: TLocation }): React.ReactElement => {
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
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.operationalStatus &&
                <Partials.Coding
                    coding={resource.operationalStatus}
                    name='Operational Status'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='operational-status'
                />
            }
            {
                resource.mode &&
                <Partials.Code code={resource.mode} name='Mode'/>
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
                resource.physicalType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.physicalType}
                    name='Physical Type'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='physical-type'
                />
            }
            {
                resource.managingOrganization &&
                <Partials.Reference
                    reference={resource.managingOrganization}
                    name='Managing Organization'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='managing-organization'
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
                name="PractitionerRole"
                id={uuid}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'PractitionerRole', 'property': 'location'}]}
            />
            <Partials.ReverseReference
                name="HealthcareService"
                id={uuid}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'HealthcareService', 'property': 'location'}]}
            />
            <Partials.ReverseReference
                name="Organization"
                id={uuid}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'Organization', 'property': 'location'}]}
            />
            <Partials.ReverseReference
                name="Schedule"
                id={uuid}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'Schedule', 'property': 'location'}]}
            />
        </>
    );
};

export default Location;
