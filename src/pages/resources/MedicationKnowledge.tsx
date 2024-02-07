/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
MedicationKnowledge
    Information about a medication that is used to support knowledge.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TMedicationKnowledge } from '../../types/resources/MedicationKnowledge';

// Import all the partial resource
import Partials from '../../partials';

const MedicationKnowledge = ({ resource }: { resource: TMedicationKnowledge }): React.ReactElement => {
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
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
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
                resource.doseForm &&
                <Partials.CodeableConcept
                    codeableConcept={resource.doseForm}
                    name='Dose Form'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='dose-form'
                />
            }
            {
                resource.amount &&
                <Partials.Quantity
                    quantity={resource.amount}
                    name='Amount'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='amount'
                />
            }
            {
                resource.associatedMedication &&
                <Partials.Reference
                    reference={resource.associatedMedication}
                    name='Associated Medication'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='associated-medication'
                />
            }
            {
                resource.productType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.productType}
                    name='Product Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='product-type'
                />
            }
            {
                resource.preparationInstruction &&
                <Partials.Markdown
                    markdown={resource.preparationInstruction}
                    name='Preparation Instruction'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='preparation-instruction'
                />
            }
            {
                resource.intendedRoute &&
                <Partials.CodeableConcept
                    codeableConcept={resource.intendedRoute}
                    name='Intended Route'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='intended-route'
                />
            }
            {
                resource.contraindication &&
                <Partials.Reference
                    reference={resource.contraindication}
                    name='Contraindication'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='contraindication'
                />
            }
            {
                resource.regulatory &&
                <Partials.Reference
                    reference={resource.regulatory}
                    name='Regulatory'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='regulatory'
                    field='regulatoryAuthority'
                />
            }
        </>
    );
};

export default MedicationKnowledge;
