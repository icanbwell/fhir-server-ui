/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Encounter
    An interaction between a patient and healthcare provider(s) for the purpose of
    providing healthcare service(s) or assessing the health status of a patient.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TEncounter } from '../../types/resources/Encounter';

// Import all the partial resource
import Partials from '../../partials';

const Encounter = ({ resource }: { resource: TEncounter }): React.ReactElement => {
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
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.class_ &&
                <Partials.Coding
                    coding={resource.class_}
                    name='Class_'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='class_'
                />
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
                resource.serviceType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.serviceType}
                    name='Service Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='service-type'
                />
            }
            {
                resource.priority &&
                <Partials.CodeableConcept
                    codeableConcept={resource.priority}
                    name='Priority'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='priority'
                />
            }
            {
                resource.subject &&
                <Partials.Reference
                    reference={resource.subject}
                    name='Subject'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subject'
                />
            }
            {
                resource.episodeOfCare &&
                <Partials.Reference
                    reference={resource.episodeOfCare}
                    name='Episode Of Care'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='episode-of-care'
                />
            }
            {
                resource.basedOn &&
                <Partials.Reference
                    reference={resource.basedOn}
                    name='Based On'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='based-on'
                />
            }
            {
                resource.appointment &&
                <Partials.Reference
                    reference={resource.appointment}
                    name='Appointment'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='appointment'
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
                resource.length &&
                <Partials.Quantity
                    quantity={resource.length}
                    name='Length'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='length'
                />
            }
            {
                resource.reasonCode &&
                <Partials.CodeableConcept
                    codeableConcept={resource.reasonCode}
                    name='Reason Code'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='reason-code'
                />
            }
            {
                resource.reasonReference &&
                <Partials.Reference
                    reference={resource.reasonReference}
                    name='Reason Reference'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='reason-reference'
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
            {
                resource.serviceProvider &&
                <Partials.Reference
                    reference={resource.serviceProvider}
                    name='Service Provider'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='service-provider'
                />
            }
            {
                resource.partOf &&
                <Partials.Reference
                    reference={resource.partOf}
                    name='Part Of'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='part-of'
                />
            }
        </>
    );
};

export default Encounter;
