/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
MedicinalProductUndesirableEffect
    Describe the undesirable effects of the medicinal product.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TMedicinalProductUndesirableEffect } from '../../types/resources/MedicinalProductUndesirableEffect';

// Import all the partial resource
import Partials from '../../partials';

const MedicinalProductUndesirableEffect = ({ resource }: { resource: TMedicinalProductUndesirableEffect }): React.ReactElement => {
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
                resource.symptomConditionEffect &&
                <Partials.CodeableConcept
                    codeableConcept={resource.symptomConditionEffect}
                    name='Symptom Condition Effect'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='symptom-condition-effect'
                />
            }
            {
                resource.classification &&
                <Partials.CodeableConcept
                    codeableConcept={resource.classification}
                    name='Classification'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='classification'
                />
            }
            {
                resource.frequencyOfOccurrence &&
                <Partials.CodeableConcept
                    codeableConcept={resource.frequencyOfOccurrence}
                    name='Frequency Of Occurrence'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='frequency-of-occurrence'
                />
            }
        </>
    );
};

export default MedicinalProductUndesirableEffect;
