/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Immunization
    Describes the event of a patient being administered a vaccine or a record of
    an immunization as reported by a patient, a clinician or another party.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TImmunization } from '../../types/resources/Immunization';

// Import all the partial resource
import Partials from '../../partials';

const Immunization = ({ resource }: { resource: TImmunization }): React.ReactElement => {
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
                resource.vaccineCode &&
                <Partials.CodeableConcept
                    codeableConcept={resource.vaccineCode}
                    name='Vaccine Code'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='vaccine-code'
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
                resource.occurrenceDateTime &&
                <Partials.DateTime
                    dateTime={resource.occurrenceDateTime}
                    name='Occurrence Date Time'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='occurrence-date-time'
                />
            }
            {
                resource.recorded &&
                <Partials.DateTime
                    dateTime={resource.recorded}
                    name='Recorded'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='recorded'
                />
            }
            {
                resource.primarySource &&
                <Partials.Boolean
                    boolean={resource.primarySource}
                    name='Primary Source'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='primary-source'
                />
            }
            {
                resource.reportOrigin &&
                <Partials.CodeableConcept
                    codeableConcept={resource.reportOrigin}
                    name='Report Origin'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='report-origin'
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
                resource.manufacturer &&
                <Partials.Reference
                    reference={resource.manufacturer}
                    name='Manufacturer'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='manufacturer'
                />
            }
            {
                resource.site &&
                <Partials.CodeableConcept
                    codeableConcept={resource.site}
                    name='Site'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='site'
                />
            }
            {
                resource.route &&
                <Partials.CodeableConcept
                    codeableConcept={resource.route}
                    name='Route'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='route'
                />
            }
            {
                resource.doseQuantity &&
                <Partials.Quantity
                    quantity={resource.doseQuantity}
                    name='Dose Quantity'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='dose-quantity'
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
                resource.isSubpotent &&
                <Partials.Boolean
                    boolean={resource.isSubpotent}
                    name='Is Subpotent'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='is-subpotent'
                />
            }
            {
                resource.subpotentReason &&
                <Partials.CodeableConcept
                    codeableConcept={resource.subpotentReason}
                    name='Subpotent Reason'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subpotent-reason'
                />
            }
            {
                resource.programEligibility &&
                <Partials.CodeableConcept
                    codeableConcept={resource.programEligibility}
                    name='Program Eligibility'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='program-eligibility'
                />
            }
            {
                resource.fundingSource &&
                <Partials.CodeableConcept
                    codeableConcept={resource.fundingSource}
                    name='Funding Source'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='funding-source'
                />
            }
        </>
    );
};

export default Immunization;
