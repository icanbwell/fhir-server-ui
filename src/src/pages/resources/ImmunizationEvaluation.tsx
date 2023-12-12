/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
ImmunizationEvaluation
    Describes a comparison of an immunization event against published
    recommendations to determine if the administration is "valid" in relation to
    those  recommendations.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TImmunizationEvaluation } from '../../types/resources/ImmunizationEvaluation';

// Import all the partial resource
import Partials from '../../partials';

const ImmunizationEvaluation = ({ resource }: { resource: TImmunizationEvaluation }): React.ReactElement => {
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
                resource.date &&
                <Partials.DateTime
                    dateTime={resource.date}
                    name='Date'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='date'
                />
            }
            {
                resource.authority &&
                <Partials.Reference
                    reference={resource.authority}
                    name='Authority'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='authority'
                />
            }
            {
                resource.targetDisease &&
                <Partials.CodeableConcept
                    codeableConcept={resource.targetDisease}
                    name='Target Disease'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='target-disease'
                />
            }
            {
                resource.immunizationEvent &&
                <Partials.Reference
                    reference={resource.immunizationEvent}
                    name='Immunization Event'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='immunization-event'
                />
            }
            {
                resource.doseStatus &&
                <Partials.CodeableConcept
                    codeableConcept={resource.doseStatus}
                    name='Dose Status'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='dose-status'
                />
            }
            {
                resource.doseStatusReason &&
                <Partials.CodeableConcept
                    codeableConcept={resource.doseStatusReason}
                    name='Dose Status Reason'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='dose-status-reason'
                />
            }
        </>
    );
};

export default ImmunizationEvaluation;
