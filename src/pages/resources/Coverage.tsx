/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
Coverage
    Financial instrument which may be used to reimburse or pay for health care
    products and services. Includes both insurance and self-payment.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TCoverage } from '../../types/resources/Coverage';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const Coverage = ({ resource }: { resource: TCoverage }): React.ReactElement => {
    const sourceAssigningAuthority = resource?.meta?.security?.find(
        s => s.system === SecurityTagSystem.sourceAssigningAuthority
    )?.code;
    const uuid = resource.id && isUuid(`${resource.id}`) ?
        resource.id : generateUuidV5(`${resource.id}|${sourceAssigningAuthority}`);

    return (
        <>
            <Link title="Direct link to Resource" to={`/4_0_0/${resource.resourceType}/${uuid}`}>
                {resource.resourceType}/{uuid}
            </Link>
            {
                resource.meta &&
                <Partials.Meta
                    meta={resource.meta}
                    name='Meta'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='meta'
                />
            }
            {
                resource.implicitRules &&
                <Partials.Uri
                    uri={resource.implicitRules}
                    name='Implicit Rules'
                    resourceType={resource.resourceType}
                    id={uuid}
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
                    id={uuid}
                    searchParameter='text'
                />
            }
            {
                resource.extension &&
                <Partials.Extension
                    extension={resource.extension}
                    name='Extension'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='extension'
                />
            }
            {
                resource.modifierExtension &&
                <Partials.Extension
                    extension={resource.modifierExtension}
                    name='Modifier Extension'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='modifier-extension'
                />
            }
            {
                resource.identifier &&
                <Partials.Identifier
                    identifier={resource.identifier}
                    name='Identifier'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='identifier'
                />
            }
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.type &&
                <Partials.CodeableConcept
                    codeableConcept={resource.type}
                    name='Type'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='type'
                />
            }
            {
                resource.policyHolder &&
                <Partials.Reference
                    reference={resource.policyHolder}
                    name='Policy Holder'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='policy-holder'
                />
            }
            {
                resource.subscriber &&
                <Partials.Reference
                    reference={resource.subscriber}
                    name='Subscriber'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='subscriber'
                />
            }
            {
                resource.beneficiary &&
                <Partials.Reference
                    reference={resource.beneficiary}
                    name='Beneficiary'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='beneficiary'
                />
            }
            {
                resource.relationship &&
                <Partials.CodeableConcept
                    codeableConcept={resource.relationship}
                    name='Relationship'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='relationship'
                />
            }
            {
                resource.period &&
                <Partials.Period
                    period={resource.period}
                    name='Period'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='period'
                />
            }
            {
                resource.payor &&
                <Partials.Reference
                    reference={resource.payor}
                    name='Payor'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='payor'
                />
            }
            {
                resource.subrogation &&
                <Partials.Boolean
                    boolean={resource.subrogation}
                    name='Subrogation'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='subrogation'
                />
            }
            {
                resource.contract &&
                <Partials.Reference
                    reference={resource.contract}
                    name='Contract'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='contract'
                />
            }
        </>
    );
};

export default Coverage;
