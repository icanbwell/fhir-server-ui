/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
ExplanationOfBenefit
    This resource provides: the claim details; adjudication details from the
    processing of a Claim; and optionally account balance information, for
    informing the subscriber of the benefits provided.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link, Typography } from '@mui/material';
import { TExplanationOfBenefit } from '../../types/resources/ExplanationOfBenefit';

// Import all the partial resource
import Partials from '../../partials';

const ExplanationOfBenefit = ({ resource }: { resource: TExplanationOfBenefit }): React.ReactElement => {
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
                resource.status &&
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
                resource.subType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.subType}
                    name='Sub Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='sub-type'
                />
            }
            {
                resource.use &&
                <Partials.Code code={resource.use} name='Use'/>
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
                resource.billablePeriod &&
                <Partials.Period
                    period={resource.billablePeriod}
                    name='Billable Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='billable-period'
                />
            }
            {
                resource.created &&
                <Partials.DateTime
                    dateTime={resource.created}
                    name='Created'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='created'
                />
            }
            {
                resource.enterer &&
                <Partials.Reference
                    reference={resource.enterer}
                    name='Enterer'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='enterer'
                />
            }
            {
                resource.insurer &&
                <Partials.Reference
                    reference={resource.insurer}
                    name='Insurer'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='insurer'
                />
            }
            {
                resource.provider &&
                <Partials.Reference
                    reference={resource.provider}
                    name='Provider'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='provider'
                />
            }
            {
                resource.priority &&
                <Partials.CodeableConcept
                    codeableConcept={resource.priority}
                    name='Priority'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='priority'
                />
            }
            {
                resource.fundsReserveRequested &&
                <Partials.CodeableConcept
                    codeableConcept={resource.fundsReserveRequested}
                    name='Funds Reserve Requested'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='funds-reserve-requested'
                />
            }
            {
                resource.fundsReserve &&
                <Partials.CodeableConcept
                    codeableConcept={resource.fundsReserve}
                    name='Funds Reserve'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='funds-reserve'
                />
            }
            {
                resource.prescription &&
                <Partials.Reference
                    reference={resource.prescription}
                    name='Prescription'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='prescription'
                />
            }
            {
                resource.originalPrescription &&
                <Partials.Reference
                    reference={resource.originalPrescription}
                    name='Original Prescription'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='original-prescription'
                />
            }
            {
                resource.referral &&
                <Partials.Reference
                    reference={resource.referral}
                    name='Referral'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='referral'
                />
            }
            {
                resource.facility &&
                <Partials.Reference
                    reference={resource.facility}
                    name='Facility'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='facility'
                />
            }
            {
                resource.claim &&
                <Partials.Reference
                    reference={resource.claim}
                    name='Claim'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='claim'
                />
            }
            {
                resource.claimResponse &&
                <Partials.Reference
                    reference={resource.claimResponse}
                    name='Claim Response'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='claim-response'
                />
            }
            {
                resource.outcome &&
                <Partials.Code code={resource.outcome} name='Outcome'/>
            }
            {
                resource.preAuthRefPeriod &&
                <Partials.Period
                    period={resource.preAuthRefPeriod}
                    name='Pre Auth Ref Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='pre-auth-ref-period'
                />
            }
            {
                resource.formCode &&
                <Partials.CodeableConcept
                    codeableConcept={resource.formCode}
                    name='Form Code'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='form-code'
                />
            }
            {
                resource.form &&
                <Partials.Attachment
                    attachment={resource.form}
                    name='Form'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='form'
                />
            }
            {
                resource.benefitPeriod &&
                <Partials.Period
                    period={resource.benefitPeriod}
                    name='Benefit Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='benefit-period'
                />
            }
        </>
    );
};

export default ExplanationOfBenefit;
