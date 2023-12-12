/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Communication
    An occurrence of information being transmitted; e.g. an alert that was sent to
    a responsible provider, a public health agency that was notified about a
    reportable condition.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TCommunication } from '../../types/resources/Communication';

// Import all the partial resource
import Partials from '../../partials';

const Communication = ({ resource }: { resource: TCommunication }): React.ReactElement => {
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
                resource.instantiatesCanonical &&
                <Partials.Canonical
                    canonical={resource.instantiatesCanonical}
                    name='Instantiates Canonical'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='instantiates-canonical'
                />
            }
            {
                resource.instantiatesUri &&
                <Partials.Uri
                    uri={resource.instantiatesUri}
                    name='Instantiates Uri'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='instantiates-uri'
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
                resource.inResponseTo &&
                <Partials.Reference
                    reference={resource.inResponseTo}
                    name='In Response To'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='in-response-to'
                />
            }
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.statusReason &&
                <Partials.CodeableConcept
                    codeableConcept={resource.statusReason}
                    name='Status Reason'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='status-reason'
                />
            }
            {
                resource.category &&
                <Partials.CodeableConcept
                    codeableConcept={resource.category}
                    name='Category'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='category'
                />
            }
            {
                resource.priority &&
                <Partials.Code code={resource.priority} name='Priority'/>
            }
            {
                resource.medium &&
                <Partials.CodeableConcept
                    codeableConcept={resource.medium}
                    name='Medium'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='medium'
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
                resource.about &&
                <Partials.Reference
                    reference={resource.about}
                    name='About'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='about'
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
                resource.sent &&
                <Partials.DateTime
                    dateTime={resource.sent}
                    name='Sent'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='sent'
                />
            }
            {
                resource.received &&
                <Partials.DateTime
                    dateTime={resource.received}
                    name='Received'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='received'
                />
            }
            {
                resource.recipient &&
                <Partials.Reference
                    reference={resource.recipient}
                    name='Recipient'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='recipient'
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
        </>
    );
};

export default Communication;
