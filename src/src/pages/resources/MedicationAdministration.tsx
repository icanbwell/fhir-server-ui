/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
MedicationAdministration
    Describes the event of a patient consuming or otherwise being administered a
    medication.  This may be as simple as swallowing a tablet or it may be a long
    running infusion.  Related resources tie this event to the authorizing
    prescription, and the specific encounter between patient and health care
    practitioner.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link, Typography } from '@mui/material';
import { TMedicationAdministration } from '../../types/resources/MedicationAdministration';

// Import all the partial resource
import Partials from '../../partials';

const MedicationAdministration = ({ resource }: { resource: TMedicationAdministration }): React.ReactElement => {
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
                resource.instantiates &&
                <Partials.Uri
                    uri={resource.instantiates}
                    name='Instantiates'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='instantiates'
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
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.statusReason &&
                <Partials.CodeableConcept
                    codeableConcept={resource.statusReason}
                    name='Status Reason'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='status-reason'
                />
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
                resource.medicationCodeableConcept &&
                <Partials.CodeableConcept
                    codeableConcept={resource.medicationCodeableConcept}
                    name='Medication Codeable Concept'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='medication-codeable-concept'
                />
            }
            {
                resource.medicationReference &&
                <Partials.Reference
                    reference={resource.medicationReference}
                    name='Medication Reference'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='medication-reference'
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
                resource.context &&
                <Partials.Reference
                    reference={resource.context}
                    name='Context'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='context'
                />
            }
            {
                resource.supportingInformation &&
                <Partials.Reference
                    reference={resource.supportingInformation}
                    name='Supporting Information'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='supporting-information'
                />
            }
            {
                resource.effectiveDateTime &&
                <Partials.DateTime
                    dateTime={resource.effectiveDateTime}
                    name='Effective Date Time'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='effective-date-time'
                />
            }
            {
                resource.effectivePeriod &&
                <Partials.Period
                    period={resource.effectivePeriod}
                    name='Effective Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='effective-period'
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
                resource.request &&
                <Partials.Reference
                    reference={resource.request}
                    name='Request'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='request'
                />
            }
            {
                resource.device &&
                <Partials.Reference
                    reference={resource.device}
                    name='Device'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='device'
                />
            }
            {
                resource.note &&
                <Partials.Annotation
                    annotation={resource.note}
                    name='Note'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='note'
                />
            }
            {
                resource.eventHistory &&
                <Partials.Reference
                    reference={resource.eventHistory}
                    name='Event History'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='event-history'
                />
            }
        </>
    );
};

export default MedicationAdministration;
