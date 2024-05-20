/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
Evidence
    The Evidence Resource provides a machine-interpretable expression of an
    evidence concept including the evidence variables (eg population,
    exposures/interventions, comparators, outcomes, measured variables,
    confounding variables), the statistics, and the certainty of this evidence.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TEvidence } from '../../types/resources/Evidence';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const Evidence = ({ resource }: { resource: TEvidence }): React.ReactElement => {
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
                resource.citeAsReference &&
                <Partials.Reference
                    reference={resource.citeAsReference}
                    name='Cite As Reference'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='cite-as-reference'
                />
            }
            {
                resource.citeAsMarkdown &&
                <Partials.Markdown
                    markdown={resource.citeAsMarkdown}
                    name='Cite As Markdown'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='cite-as-markdown'
                />
            }
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
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
                resource.assertion &&
                <Partials.Markdown
                    markdown={resource.assertion}
                    name='Assertion'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='assertion'
                />
            }
            {
                resource.note &&
                <Partials.Annotation
                    annotation={resource.note}
                    name='Note'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='note'
                />
            }
            {
                resource.synthesisType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.synthesisType}
                    name='Synthesis Type'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='synthesis-type'
                />
            }
            {
                resource.studyType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.studyType}
                    name='Study Type'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='study-type'
                />
            }
        </>
    );
};

export default Evidence;
