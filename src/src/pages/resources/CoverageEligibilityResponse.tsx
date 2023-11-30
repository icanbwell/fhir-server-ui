/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
CoverageEligibilityResponse
    This resource provides eligibility and plan details from the processing of an
    CoverageEligibilityRequest resource.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';
import { TCoverageEligibilityResponse } from '../../types/resources/CoverageEligibilityResponse';

// Import all the partial resource
import Partials from '../../partials';

const CoverageEligibilityResponse = ({ resource }: { resource: TCoverageEligibilityResponse }): React.ReactElement => {
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
                resource.purpose &&
                <Partials.Code code={resource.purpose} name='Purpose'/>
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
                resource.servicedPeriod &&
                <Partials.Period
                    period={resource.servicedPeriod}
                    name='Serviced Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='serviced-period'
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
                resource.requestor &&
                <Partials.Reference
                    reference={resource.requestor}
                    name='Requestor'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='requestor'
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
                resource.outcome &&
                <Partials.Code code={resource.outcome} name='Outcome'/>
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
                resource.form &&
                <Partials.CodeableConcept
                    codeableConcept={resource.form}
                    name='Form'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='form'
                />
            }
        </>
    );
};

export default CoverageEligibilityResponse;
