/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
Measure
    The Measure resource provides the definition of a quality measure.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TMeasure } from '../../types/resources/Measure';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const Measure = ({ resource }: { resource: TMeasure }): React.ReactElement => {
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
                resource.url &&
                <Partials.Uri
                    uri={resource.url}
                    name='Url'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='url'
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
                resource.experimental &&
                <Partials.Boolean
                    boolean={resource.experimental}
                    name='Experimental'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='experimental'
                />
            }
            {
                resource.subjectCodeableConcept &&
                <Partials.CodeableConcept
                    codeableConcept={resource.subjectCodeableConcept}
                    name='Subject Codeable Concept'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='subject-codeable-concept'
                />
            }
            {
                resource.subjectReference &&
                <Partials.Reference
                    reference={resource.subjectReference}
                    name='Subject Reference'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='subject-reference'
                />
            }
            {
                resource.date &&
                <Partials.DateTime
                    dateTime={resource.date}
                    name='Date'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='date'
                />
            }
            {
                resource.description &&
                <Partials.Markdown
                    markdown={resource.description}
                    name='Description'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='description'
                />
            }
            {
                resource.jurisdiction &&
                <Partials.CodeableConcept
                    codeableConcept={resource.jurisdiction}
                    name='Jurisdiction'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='jurisdiction'
                />
            }
            {
                resource.purpose &&
                <Partials.Markdown
                    markdown={resource.purpose}
                    name='Purpose'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='purpose'
                />
            }
            {
                resource.copyright &&
                <Partials.Markdown
                    markdown={resource.copyright}
                    name='Copyright'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='copyright'
                />
            }
            {
                resource.effectivePeriod &&
                <Partials.Period
                    period={resource.effectivePeriod}
                    name='Effective Period'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='effective-period'
                />
            }
            {
                resource.topic &&
                <Partials.CodeableConcept
                    codeableConcept={resource.topic}
                    name='Topic'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='topic'
                />
            }
            {
                resource.library &&
                <Partials.Canonical
                    canonical={resource.library}
                    name='Library'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='library'
                />
            }
            {
                resource.disclaimer &&
                <Partials.Markdown
                    markdown={resource.disclaimer}
                    name='Disclaimer'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='disclaimer'
                />
            }
            {
                resource.scoring &&
                <Partials.CodeableConcept
                    codeableConcept={resource.scoring}
                    name='Scoring'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='scoring'
                />
            }
            {
                resource.compositeScoring &&
                <Partials.CodeableConcept
                    codeableConcept={resource.compositeScoring}
                    name='Composite Scoring'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='composite-scoring'
                />
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
                resource.rationale &&
                <Partials.Markdown
                    markdown={resource.rationale}
                    name='Rationale'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='rationale'
                />
            }
            {
                resource.clinicalRecommendationStatement &&
                <Partials.Markdown
                    markdown={resource.clinicalRecommendationStatement}
                    name='Clinical Recommendation Statement'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='clinical-recommendation-statement'
                />
            }
            {
                resource.improvementNotation &&
                <Partials.CodeableConcept
                    codeableConcept={resource.improvementNotation}
                    name='Improvement Notation'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='improvement-notation'
                />
            }
            {
                resource.definition &&
                <Partials.Markdown
                    markdown={resource.definition}
                    name='Definition'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='definition'
                />
            }
            {
                resource.guidance &&
                <Partials.Markdown
                    markdown={resource.guidance}
                    name='Guidance'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='guidance'
                />
            }
        </>
    );
};

export default Measure;
