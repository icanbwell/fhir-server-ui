/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
ResearchDefinition
    The ResearchDefinition resource describes the conditional state (population
    and any exposures being compared within the population) and outcome (if
    specified) that the knowledge (evidence, assertion, recommendation) is about.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link, Typography } from '@mui/material';
import { TResearchDefinition } from '../../types/resources/ResearchDefinition';

// Import all the partial resource
import Partials from '../../partials';

const ResearchDefinition = ({ resource }: { resource: TResearchDefinition }): React.ReactElement => {
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
                resource.url &&
                <Partials.Uri
                    uri={resource.url}
                    name='Url'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='url'
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
                resource.experimental &&
                <Partials.Boolean
                    boolean={resource.experimental}
                    name='Experimental'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='experimental'
                />
            }
            {
                resource.subjectCodeableConcept &&
                <Partials.CodeableConcept
                    codeableConcept={resource.subjectCodeableConcept}
                    name='Subject Codeable Concept'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subject-codeable-concept'
                />
            }
            {
                resource.subjectReference &&
                <Partials.Reference
                    reference={resource.subjectReference}
                    name='Subject Reference'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subject-reference'
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
                resource.description &&
                <Partials.Markdown
                    markdown={resource.description}
                    name='Description'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='description'
                />
            }
            {
                resource.jurisdiction &&
                <Partials.CodeableConcept
                    codeableConcept={resource.jurisdiction}
                    name='Jurisdiction'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='jurisdiction'
                />
            }
            {
                resource.purpose &&
                <Partials.Markdown
                    markdown={resource.purpose}
                    name='Purpose'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='purpose'
                />
            }
            {
                resource.copyright &&
                <Partials.Markdown
                    markdown={resource.copyright}
                    name='Copyright'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='copyright'
                />
            }
            {
                resource.effectivePeriod &&
                <Partials.Period
                    period={resource.effectivePeriod}
                    name='Effective Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='effective-period'
                />
            }
            {
                resource.topic &&
                <Partials.CodeableConcept
                    codeableConcept={resource.topic}
                    name='Topic'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='topic'
                />
            }
            {
                resource.library &&
                <Partials.Canonical
                    canonical={resource.library}
                    name='Library'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='library'
                />
            }
            {
                resource.population &&
                <Partials.Reference
                    reference={resource.population}
                    name='Population'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='population'
                />
            }
            {
                resource.exposure &&
                <Partials.Reference
                    reference={resource.exposure}
                    name='Exposure'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='exposure'
                />
            }
            {
                resource.exposureAlternative &&
                <Partials.Reference
                    reference={resource.exposureAlternative}
                    name='Exposure Alternative'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='exposure-alternative'
                />
            }
            {
                resource.outcome &&
                <Partials.Reference
                    reference={resource.outcome}
                    name='Outcome'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='outcome'
                />
            }
        </>
    );
};

export default ResearchDefinition;
