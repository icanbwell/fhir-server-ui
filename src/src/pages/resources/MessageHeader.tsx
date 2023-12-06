/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
MessageHeader
    The header for a message exchange that is either requesting or responding to
    an action.  The reference(s) that are the subject of the action as well as
    other information related to the action are typically transmitted in a bundle
    in which the MessageHeader resource instance is the first resource in the
    bundle.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link, Typography } from '@mui/material';
import { TMessageHeader } from '../../types/resources/MessageHeader';

// Import all the partial resource
import Partials from '../../partials';

const MessageHeader = ({ resource }: { resource: TMessageHeader }): React.ReactElement => {
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
                resource.sender &&
                <Partials.Reference
                    reference={resource.sender}
                    name='Sender'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='sender'
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
                resource.author &&
                <Partials.Reference
                    reference={resource.author}
                    name='Author'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='author'
                />
            }
            {
                resource.responsible &&
                <Partials.Reference
                    reference={resource.responsible}
                    name='Responsible'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='responsible'
                />
            }
            {
                resource.reason &&
                <Partials.CodeableConcept
                    codeableConcept={resource.reason}
                    name='Reason'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='reason'
                />
            }
            {
                resource.focus &&
                <Partials.Reference
                    reference={resource.focus}
                    name='Focus'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='focus'
                />
            }
            {
                resource.definition &&
                <Partials.Canonical
                    canonical={resource.definition}
                    name='Definition'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='definition'
                />
            }
        </>
    );
};

export default MessageHeader;
