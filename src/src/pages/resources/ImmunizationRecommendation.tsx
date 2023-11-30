/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
ImmunizationRecommendation
    A patient's point-in-time set of recommendations (i.e. forecasting) according
    to a published schedule with optional supporting justification.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';
import { TImmunizationRecommendation } from '../../types/resources/ImmunizationRecommendation';

// Import all the partial resource
import Partials from '../../partials';

const ImmunizationRecommendation = ({ resource }: { resource: TImmunizationRecommendation }): React.ReactElement => {
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
                resource.date &&
                <Partials.DateTime
                    dateTime={resource.date}
                    name='Date'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='date'
                />
            }
            {
                resource.authority &&
                <Partials.Reference
                    reference={resource.authority}
                    name='Authority'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='authority'
                />
            }
        </>
    );
};

export default ImmunizationRecommendation;
