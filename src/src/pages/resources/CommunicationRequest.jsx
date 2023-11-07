/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
CommunicationRequest
    A request to convey information; e.g. the CDS system proposes that an alert be
    sent to a responsible provider, the CDS system proposes that the public health
    agency be notified about a reportable condition.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import {Link} from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const CommunicationRequest = ({ resource }) => {
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
                resource.replaces &&
                <Partials.Reference
                    reference={resource.replaces}
                    name='Replaces'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='replaces'
                />
            }
            {
                resource.groupIdentifier &&
                <Partials.Identifier
                    identifier={resource.groupIdentifier}
                    name='Group Identifier'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='group-identifier'
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
                resource.doNotPerform &&
                <Partials.Boolean
                    boolean={resource.doNotPerform}
                    name='Do Not Perform'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='do-not-perform'
                />
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
                resource.occurrencePeriod &&
                <Partials.Period
                    period={resource.occurrencePeriod}
                    name='Occurrence Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='occurrence-period'
                />
            }
            {
                resource.authoredOn &&
                <Partials.DateTime
                    dateTime={resource.authoredOn}
                    name='Authored On'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='authored-on'
                />
            }
            {
                resource.requester &&
                <Partials.Reference
                    reference={resource.requester}
                    name='Requester'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='requester'
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

export default CommunicationRequest;
