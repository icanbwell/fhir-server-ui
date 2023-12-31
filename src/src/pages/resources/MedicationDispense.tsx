/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
MedicationDispense
    Indicates that a medication product is to be or has been dispensed for a named
    person/patient.  This includes a description of the medication product
    (supply) provided and the instructions for administering the medication.  The
    medication dispense is the result of a pharmacy system responding to a
    medication order.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TMedicationDispense } from '../../types/resources/MedicationDispense';

// Import all the partial resource
import Partials from '../../partials';

const MedicationDispense = ({ resource }: { resource: TMedicationDispense }): React.ReactElement => {
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
                resource.statusReasonCodeableConcept &&
                <Partials.CodeableConcept
                    codeableConcept={resource.statusReasonCodeableConcept}
                    name='Status Reason Codeable Concept'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='status-reason-codeable-concept'
                />
            }
            {
                resource.statusReasonReference &&
                <Partials.Reference
                    reference={resource.statusReasonReference}
                    name='Status Reason Reference'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='status-reason-reference'
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
                resource.authorizingPrescription &&
                <Partials.Reference
                    reference={resource.authorizingPrescription}
                    name='Authorizing Prescription'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='authorizing-prescription'
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
                resource.quantity &&
                <Partials.Quantity
                    quantity={resource.quantity}
                    name='Quantity'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='quantity'
                />
            }
            {
                resource.daysSupply &&
                <Partials.Quantity
                    quantity={resource.daysSupply}
                    name='Days Supply'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='days-supply'
                />
            }
            {
                resource.whenPrepared &&
                <Partials.DateTime
                    dateTime={resource.whenPrepared}
                    name='When Prepared'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='when-prepared'
                />
            }
            {
                resource.whenHandedOver &&
                <Partials.DateTime
                    dateTime={resource.whenHandedOver}
                    name='When Handed Over'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='when-handed-over'
                />
            }
            {
                resource.destination &&
                <Partials.Reference
                    reference={resource.destination}
                    name='Destination'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='destination'
                />
            }
            {
                resource.receiver &&
                <Partials.Reference
                    reference={resource.receiver}
                    name='Receiver'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='receiver'
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
                resource.dosageInstruction &&
                <Partials.Dosage
                    dosage={resource.dosageInstruction}
                    name='Dosage Instruction'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='dosage-instruction'
                />
            }
            {
                resource.detectedIssue &&
                <Partials.Reference
                    reference={resource.detectedIssue}
                    name='Detected Issue'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='detected-issue'
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

export default MedicationDispense;
