/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
AuditEvent
    A record of an event made for purposes of maintaining a security log. Typical
    uses include detection of intrusion attempts and monitoring for inappropriate
    usage.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';
import { TAuditEvent } from '../../types/resources/AuditEvent';

// Import all the partial resource
import Partials from '../../partials';

const AuditEvent = ({ resource }: { resource: TAuditEvent }): React.ReactElement => {
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
                resource.type &&
                <Partials.Coding
                    coding={resource.type}
                    name='Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='type'
                />
            }
            {
                resource.subtype &&
                <Partials.Coding
                    coding={resource.subtype}
                    name='Subtype'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subtype'
                />
            }
            {
                resource.action &&
                <Partials.Code code={resource.action} name='Action'/>
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
                resource.recorded &&
                <Partials.Instant
                    instant={resource.recorded}
                    name='Recorded'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='recorded'
                />
            }
            {
                resource.outcome &&
                <Partials.Code code={resource.outcome} name='Outcome'/>
            }
            {
                resource.purposeOfEvent &&
                <Partials.CodeableConcept
                    codeableConcept={resource.purposeOfEvent}
                    name='Purpose Of Event'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='purpose-of-event'
                />
            }
        </>
    );
};

export default AuditEvent;
