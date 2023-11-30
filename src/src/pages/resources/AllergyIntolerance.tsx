/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
AllergyIntolerance
    Risk of harmful or undesirable, physiological response which is unique to an
    individual and associated with exposure to a substance.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';
import { TAllergyIntolerance } from '../../types/resources/AllergyIntolerance';

// Import all the partial resource
import Partials from '../../partials';

const AllergyIntolerance = ({ resource }: { resource: TAllergyIntolerance }): React.ReactElement => {
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
                resource.clinicalStatus &&
                <Partials.CodeableConcept
                    codeableConcept={resource.clinicalStatus}
                    name='Clinical Status'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='clinical-status'
                />
            }
            {
                resource.verificationStatus &&
                <Partials.CodeableConcept
                    codeableConcept={resource.verificationStatus}
                    name='Verification Status'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='verification-status'
                />
            }
            {
                resource.type &&
                <Partials.Code code={resource.type} name='Type'/>
            }
            {
                resource.category &&
                <Partials.Code code={resource.category} name='Category'/>
            }
            {
                resource.criticality &&
                <Partials.Code code={resource.criticality} name='Criticality'/>
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
                resource.onsetDateTime &&
                <Partials.DateTime
                    dateTime={resource.onsetDateTime}
                    name='Onset Date Time'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='onset-date-time'
                />
            }
            {
                resource.onsetAge &&
                <Partials.Quantity
                    quantity={resource.onsetAge}
                    name='Onset Age'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='onset-age'
                />
            }
            {
                resource.onsetPeriod &&
                <Partials.Period
                    period={resource.onsetPeriod}
                    name='Onset Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='onset-period'
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
                resource.asserter &&
                <Partials.Reference
                    reference={resource.asserter}
                    name='Asserter'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='asserter'
                />
            }
            {
                resource.lastOccurrence &&
                <Partials.DateTime
                    dateTime={resource.lastOccurrence}
                    name='Last Occurrence'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='last-occurrence'
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
        </>
    );
};

export default AllergyIntolerance;
