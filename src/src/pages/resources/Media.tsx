/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Media
    A photo, video, or audio recording acquired or used in healthcare. The actual
    content may be inline or provided by direct reference.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TMedia } from '../../types/resources/Media';

// Import all the partial resource
import Partials from '../../partials';

const Media = ({ resource }: { resource: TMedia }): React.ReactElement => {
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
                resource.basedOn &&
                <Partials.Reference
                    reference={resource.basedOn}
                    name='Based On'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='based-on'
                />
            }
            {
                resource.partOf &&
                <Partials.Reference
                    reference={resource.partOf}
                    name='Part Of'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='part-of'
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
                resource.modality &&
                <Partials.CodeableConcept
                    codeableConcept={resource.modality}
                    name='Modality'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='modality'
                />
            }
            {
                resource.view &&
                <Partials.CodeableConcept
                    codeableConcept={resource.view}
                    name='View'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='view'
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
                resource.createdDateTime &&
                <Partials.DateTime
                    dateTime={resource.createdDateTime}
                    name='Created Date Time'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='created-date-time'
                />
            }
            {
                resource.createdPeriod &&
                <Partials.Period
                    period={resource.createdPeriod}
                    name='Created Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='created-period'
                />
            }
            {
                resource.issued &&
                <Partials.Instant
                    instant={resource.issued}
                    name='Issued'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='issued'
                />
            }
            {
                resource.operator &&
                <Partials.Reference
                    reference={resource.operator}
                    name='Operator'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='operator'
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
                resource.bodySite &&
                <Partials.CodeableConcept
                    codeableConcept={resource.bodySite}
                    name='Body Site'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='body-site'
                />
            }
            {
                resource.device &&
                <Partials.Reference
                    reference={resource.device}
                    name='Device'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='device'
                />
            }
            {
                resource.duration &&
                <Partials.Decimal
                    decimal={resource.duration}
                    name='Duration'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='duration'
                />
            }
            {
                resource.content &&
                <Partials.Attachment
                    attachment={resource.content}
                    name='Content'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='content'
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
        </>
    );
};

export default Media;
