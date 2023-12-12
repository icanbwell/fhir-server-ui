/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
MeasureReport
    The MeasureReport resource contains the results of the calculation of a
    measure; and optionally a reference to the resources involved in that
    calculation.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TMeasureReport } from '../../types/resources/MeasureReport';

// Import all the partial resource
import Partials from '../../partials';

const MeasureReport = ({ resource }: { resource: TMeasureReport }): React.ReactElement => {
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
                resource.type &&
                <Partials.Code code={resource.type} name='Type'/>
            }
            {
                resource.measure &&
                <Partials.Canonical
                    canonical={resource.measure}
                    name='Measure'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='measure'
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
                resource.reporter &&
                <Partials.Reference
                    reference={resource.reporter}
                    name='Reporter'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='reporter'
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
                resource.improvementNotation &&
                <Partials.CodeableConcept
                    codeableConcept={resource.improvementNotation}
                    name='Improvement Notation'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='improvement-notation'
                />
            }
            {
                resource.evaluatedResource &&
                <Partials.Reference
                    reference={resource.evaluatedResource}
                    name='Evaluated Resource'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='evaluated-resource'
                />
            }
        </>
    );
};

export default MeasureReport;
