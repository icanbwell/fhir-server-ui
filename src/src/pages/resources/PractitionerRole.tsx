/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
PractitionerRole
    A specific set of Roles/Locations/specialties/services that a practitioner may
    perform at an organization for a period of time.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TPractitionerRole } from '../../types/resources/PractitionerRole';

// Import all the partial resource
import Partials from '../../partials';

const PractitionerRole = ({ resource }: { resource: TPractitionerRole }): React.ReactElement => {
    return (
        <>
            <Link title="Direct link to Resource" to={`/4_0_0/${resource.resourceType}/${resource.id}`}>
                {resource.resourceType}/{resource.id}
            </Link>
            {
                resource.meta &&
                <Partials.Meta
                    meta={resource.meta}
                    name='Meta'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='meta'
                />
            }
            {
                resource.implicitRules &&
                <Partials.Uri
                    uri={resource.implicitRules}
                    name='Implicit Rules'
                    resourceType={resource.resourceType}
                    id={resource.id}
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
                    id={resource.id}
                    searchParameter='text'
                />
            }
            {
                resource.extension &&
                <Partials.Extension
                    extension={resource.extension}
                    name='Extension'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='extension'
                />
            }
            {
                resource.modifierExtension &&
                <Partials.Extension
                    extension={resource.modifierExtension}
                    name='Modifier Extension'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='modifier-extension'
                />
            }
            {
                resource.identifier &&
                <Partials.Identifier
                    identifier={resource.identifier}
                    name='Identifier'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='identifier'
                />
            }
            {
                resource.active &&
                <Partials.Boolean
                    boolean={resource.active}
                    name='Active'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='active'
                />
            }
            {
                resource.period &&
                <Partials.Period
                    period={resource.period}
                    name='Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='period'
                />
            }
            {
                resource.practitioner &&
                <Partials.Reference
                    reference={resource.practitioner}
                    name='Practitioner'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='practitioner'
                />
            }
            {
                resource.organization &&
                <Partials.Reference
                    reference={resource.organization}
                    name='Organization'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='organization'
                />
            }
            {
                resource.code &&
                <Partials.CodeableConcept
                    codeableConcept={resource.code}
                    name='Code'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='code'
                />
            }
            {
                resource.specialty &&
                <Partials.CodeableConcept
                    codeableConcept={resource.specialty}
                    name='Specialty'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='specialty'
                />
            }
            {
                resource.location &&
                <Partials.Reference
                    reference={resource.location}
                    name='Location'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='location'
                />
            }
            {
                resource.healthcareService &&
                <Partials.Reference
                    reference={resource.healthcareService}
                    name='Healthcare Service'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='healthcare-service'
                />
            }
            {
                resource.telecom &&
                <Partials.ContactPoint
                    contactPoint={resource.telecom}
                    name='Telecom'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='telecom'
                />
            }
            {
                resource.endpoint &&
                <Partials.Reference
                    reference={resource.endpoint}
                    name='Endpoint'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='endpoint'
                />
            }
            <Typography variant="h4" sx={{ mt: 1 }}>
                Related Resources
            </Typography>
            <Partials.ReverseReference
                name="Schedule"
                id={resource.id}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'Schedule', 'property': 'actor'}]}
            />
        </>
    );
};

export default PractitionerRole;
