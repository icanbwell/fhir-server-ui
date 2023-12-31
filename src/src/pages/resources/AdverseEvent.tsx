/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
AdverseEvent
    Actual or  potential/avoided event causing unintended physical injury
    resulting from or contributed to by medical care, a research study or other
    healthcare setting factors that requires additional monitoring, treatment, or
    hospitalization, or that results in death.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TAdverseEvent } from '../../types/resources/AdverseEvent';

// Import all the partial resource
import Partials from '../../partials';

const AdverseEvent = ({ resource }: { resource: TAdverseEvent }): React.ReactElement => {
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
                resource.actuality &&
                <Partials.Code code={resource.actuality} name='Actuality'/>
            }
            {
                resource.category &&
                <Partials.CodeableConcept
                    codeableConcept={resource.category}
                    name='Category'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='category'
                />
            }
            {
                resource.event &&
                <Partials.CodeableConcept
                    codeableConcept={resource.event}
                    name='Event'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='event'
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
                resource.encounter &&
                <Partials.Reference
                    reference={resource.encounter}
                    name='Encounter'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='encounter'
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
                resource.detected &&
                <Partials.DateTime
                    dateTime={resource.detected}
                    name='Detected'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='detected'
                />
            }
            {
                resource.recordedDate &&
                <Partials.DateTime
                    dateTime={resource.recordedDate}
                    name='Recorded Date'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='recorded-date'
                />
            }
            {
                resource.resultingCondition &&
                <Partials.Reference
                    reference={resource.resultingCondition}
                    name='Resulting Condition'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='resulting-condition'
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
                resource.seriousness &&
                <Partials.CodeableConcept
                    codeableConcept={resource.seriousness}
                    name='Seriousness'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='seriousness'
                />
            }
            {
                resource.severity &&
                <Partials.CodeableConcept
                    codeableConcept={resource.severity}
                    name='Severity'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='severity'
                />
            }
            {
                resource.outcome &&
                <Partials.CodeableConcept
                    codeableConcept={resource.outcome}
                    name='Outcome'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='outcome'
                />
            }
            {
                resource.recorder &&
                <Partials.Reference
                    reference={resource.recorder}
                    name='Recorder'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='recorder'
                />
            }
            {
                resource.contributor &&
                <Partials.Reference
                    reference={resource.contributor}
                    name='Contributor'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='contributor'
                />
            }
            {
                resource.subjectMedicalHistory &&
                <Partials.Reference
                    reference={resource.subjectMedicalHistory}
                    name='Subject Medical History'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subject-medical-history'
                />
            }
            {
                resource.referenceDocument &&
                <Partials.Reference
                    reference={resource.referenceDocument}
                    name='Reference Document'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='reference-document'
                />
            }
            {
                resource.study &&
                <Partials.Reference
                    reference={resource.study}
                    name='Study'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='study'
                />
            }
        </>
    );
};

export default AdverseEvent;
