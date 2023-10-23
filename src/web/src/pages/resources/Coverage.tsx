/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Coverage
    Financial instrument which may be used to reimburse or pay for health care
    products and services. Includes both insurance and self-payment.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import {Link} from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const Coverage: React.FC<any> = ({ resource }: any) => {
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
                resource.policyHolder &&
                <Partials.Reference
                    reference={resource.policyHolder}
                    name='Policy Holder'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='policy-holder'
                />
            }
            {
                resource.subscriber &&
                <Partials.Reference
                    reference={resource.subscriber}
                    name='Subscriber'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subscriber'
                />
            }
            {
                resource.beneficiary &&
                <Partials.Reference
                    reference={resource.beneficiary}
                    name='Beneficiary'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='beneficiary'
                />
            }
            {
                resource.relationship &&
                <Partials.CodeableConcept
                    codeableConcept={resource.relationship}
                    name='Relationship'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='relationship'
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
                resource.payor &&
                <Partials.Reference
                    reference={resource.payor}
                    name='Payor'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='payor'
                />
            }
            {
                resource.subrogation &&
                <Partials.Boolean
                    boolean={resource.subrogation}
                    name='Subrogation'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subrogation'
                />
            }
            {
                resource.contract &&
                <Partials.Reference
                    reference={resource.contract}
                    name='Contract'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='contract'
                />
            }
        </>
    );
};

export default Coverage;