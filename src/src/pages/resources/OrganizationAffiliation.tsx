/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
OrganizationAffiliation
    Defines an affiliation/assotiation/relationship between 2 distinct
    oganizations, that is not a part-of relationship/sub-division relationship.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link, Typography } from '@mui/material';
import { TOrganizationAffiliation } from '../../types/resources/OrganizationAffiliation';

// Import all the partial resource
import Partials from '../../partials';

const OrganizationAffiliation = ({ resource }: { resource: TOrganizationAffiliation }): React.ReactElement => {
    return (
        <>
            <Link title="Direct link to Resource" href={`/4_0_0/${resource.resourceType}/${resource.id}`}>
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
                resource.participatingOrganization &&
                <Partials.Reference
                    reference={resource.participatingOrganization}
                    name='Participating Organization'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='participating-organization'
                />
            }
            {
                resource.network &&
                <Partials.Reference
                    reference={resource.network}
                    name='Network'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='network'
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
        </>
    );
};

export default OrganizationAffiliation;
