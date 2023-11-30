/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
MessageDefinition
    Defines the characteristics of a message that can be shared between systems,
    including the type of event that initiates the message, the content to be
    transmitted and what response(s), if any, are permitted.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';
import { TMessageDefinition } from '../../types/resources/MessageDefinition';

// Import all the partial resource
import Partials from '../../partials';

const MessageDefinition = ({ resource }: { resource: TMessageDefinition }): React.ReactElement => {
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
                resource.replaces &&
                <Partials.Canonical
                    canonical={resource.replaces}
                    name='Replaces'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='replaces'
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
                resource.base &&
                <Partials.Canonical
                    canonical={resource.base}
                    name='Base'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='base'
                />
            }
            {
                resource.parent &&
                <Partials.Canonical
                    canonical={resource.parent}
                    name='Parent'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='parent'
                />
            }
            {
                resource.eventCoding &&
                <Partials.Coding
                    coding={resource.eventCoding}
                    name='Event Coding'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='event-coding'
                />
            }
            {
                resource.eventUri &&
                <Partials.Uri
                    uri={resource.eventUri}
                    name='Event Uri'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='event-uri'
                />
            }
            {
                resource.category &&
                <Partials.Code code={resource.category} name='Category'/>
            }
            {
                resource.responseRequired &&
                <Partials.Code code={resource.responseRequired} name='Response Required'/>
            }
            {
                resource.graph &&
                <Partials.Canonical
                    canonical={resource.graph}
                    name='Graph'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='graph'
                />
            }
        </>
    );
};

export default MessageDefinition;
