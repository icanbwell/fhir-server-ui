/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
EpisodeOfCare
    An association between a patient and an organization / healthcare provider(s)
    during which time encounters may occur. The managing organization assumes a
    level of responsibility for the patient during this time.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import {Link} from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const EpisodeOfCare: React.FC<any> = ({ resource }: any) => {
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
                resource.language&&
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
                resource.status&&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.type &&
                <Partials.CodeableConcept
                    codeableConcept={resource.type}
                    name='Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='type'
                />
            }
            {
                resource.patient &&
                <Partials.Reference
                    reference={resource.patient}
                    name='Patient'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='patient'
                />
            }
            {
                resource.managingOrganization &&
                <Partials.Reference
                    reference={resource.managingOrganization}
                    name='Managing Organization'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='managing-organization'
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
                resource.referralRequest &&
                <Partials.Reference
                    reference={resource.referralRequest}
                    name='Referral Request'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='referral-request'
                />
            }
            {
                resource.careManager &&
                <Partials.Reference
                    reference={resource.careManager}
                    name='Care Manager'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='care-manager'
                />
            }
            {
                resource.team &&
                <Partials.Reference
                    reference={resource.team}
                    name='Team'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='team'
                />
            }
            {
                resource.account &&
                <Partials.Reference
                    reference={resource.account}
                    name='Account'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='account'
                />
            }
        </>
    );
};

export default EpisodeOfCare;