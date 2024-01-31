/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
GuidanceResponse
    A guidance response is the formal response to a guidance request, including
    any output parameters returned by the evaluation, as well as the description
    of any proposed actions to be taken.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TGuidanceResponse } from '../../types/resources/GuidanceResponse';

// Import all the partial resource
import Partials from '../../partials';

const GuidanceResponse = ({ resource }: { resource: TGuidanceResponse }): React.ReactElement => {
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
                resource.requestIdentifier &&
                <Partials.Identifier
                    identifier={resource.requestIdentifier}
                    name='Request Identifier'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='request-identifier'
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
                resource.moduleUri &&
                <Partials.Uri
                    uri={resource.moduleUri}
                    name='Module Uri'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='module-uri'
                />
            }
            {
                resource.moduleCanonical &&
                <Partials.Canonical
                    canonical={resource.moduleCanonical}
                    name='Module Canonical'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='module-canonical'
                />
            }
            {
                resource.moduleCodeableConcept &&
                <Partials.CodeableConcept
                    codeableConcept={resource.moduleCodeableConcept}
                    name='Module Codeable Concept'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='module-codeable-concept'
                />
            }
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
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
                resource.encounter &&
                <Partials.Reference
                    reference={resource.encounter}
                    name='Encounter'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='encounter'
                />
            }
            {
                resource.occurrenceDateTime &&
                <Partials.DateTime
                    dateTime={resource.occurrenceDateTime}
                    name='Occurrence Date Time'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='occurrence-date-time'
                />
            }
            {
                resource.performer &&
                <Partials.Reference
                    reference={resource.performer}
                    name='Performer'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='performer'
                />
            }
            {
                resource.reasonCode &&
                <Partials.CodeableConcept
                    codeableConcept={resource.reasonCode}
                    name='Reason Code'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='reason-code'
                />
            }
            {
                resource.reasonReference &&
                <Partials.Reference
                    reference={resource.reasonReference}
                    name='Reason Reference'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='reason-reference'
                />
            }
            {
                resource.note &&
                <Partials.Annotation
                    annotation={resource.note}
                    name='Note'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='note'
                />
            }
            {
                resource.evaluationMessage &&
                <Partials.Reference
                    reference={resource.evaluationMessage}
                    name='Evaluation Message'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='evaluation-message'
                />
            }
            {
                resource.outputParameters &&
                <Partials.Reference
                    reference={resource.outputParameters}
                    name='Output Parameters'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='output-parameters'
                />
            }
            {
                resource.result &&
                <Partials.Reference
                    reference={resource.result}
                    name='Result'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='result'
                />
            }
        </>
    );
};

export default GuidanceResponse;
