/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
Task
    A task to be performed.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TTask } from '../../types/resources/Task';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const Task = ({ resource }: { resource: TTask }): React.ReactElement => {
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
                resource.instantiatesCanonical &&
                <Partials.Canonical
                    canonical={resource.instantiatesCanonical}
                    name='Instantiates Canonical'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='instantiates-canonical'
                />
            }
            {
                resource.instantiatesUri &&
                <Partials.Uri
                    uri={resource.instantiatesUri}
                    name='Instantiates Uri'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='instantiates-uri'
                />
            }
            {
                resource.basedOn &&
                <Partials.Reference
                    reference={resource.basedOn}
                    name='Based On'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='based-on'
                />
            }
            {
                resource.groupIdentifier &&
                <Partials.Identifier
                    identifier={resource.groupIdentifier}
                    name='Group Identifier'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='group-identifier'
                />
            }
            {
                resource.partOf &&
                <Partials.Reference
                    reference={resource.partOf}
                    name='Part Of'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='part-of'
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
                    id={uuid}
                    searchParameter='status-reason'
                />
            }
            {
                resource.businessStatus &&
                <Partials.CodeableConcept
                    codeableConcept={resource.businessStatus}
                    name='Business Status'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='business-status'
                />
            }
            {
                resource.intent &&
                <Partials.Code code={resource.intent} name='Intent'/>
            }
            {
                resource.priority &&
                <Partials.Code code={resource.priority} name='Priority'/>
            }
            {
                resource.code &&
                <Partials.CodeableConcept
                    codeableConcept={resource.code}
                    name='Code'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='code'
                />
            }
            {
                resource.focus &&
                <Partials.Reference
                    reference={resource.focus}
                    name='Focus'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='focus'
                />
            }
            {
                resource.for_ &&
                <Partials.Reference
                    reference={resource.for_}
                    name='For_'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='for_'
                />
            }
            {
                resource.encounter &&
                <Partials.Reference
                    reference={resource.encounter}
                    name='Encounter'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='encounter'
                />
            }
            {
                resource.executionPeriod &&
                <Partials.Period
                    period={resource.executionPeriod}
                    name='Execution Period'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='execution-period'
                />
            }
            {
                resource.authoredOn &&
                <Partials.DateTime
                    dateTime={resource.authoredOn}
                    name='Authored On'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='authored-on'
                />
            }
            {
                resource.lastModified &&
                <Partials.DateTime
                    dateTime={resource.lastModified}
                    name='Last Modified'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='last-modified'
                />
            }
            {
                resource.requester &&
                <Partials.Reference
                    reference={resource.requester}
                    name='Requester'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='requester'
                />
            }
            {
                resource.performerType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.performerType}
                    name='Performer Type'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='performer-type'
                />
            }
            {
                resource.owner &&
                <Partials.Reference
                    reference={resource.owner}
                    name='Owner'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='owner'
                />
            }
            {
                resource.location &&
                <Partials.Reference
                    reference={resource.location}
                    name='Location'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='location'
                />
            }
            {
                resource.reasonCode &&
                <Partials.CodeableConcept
                    codeableConcept={resource.reasonCode}
                    name='Reason Code'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='reason-code'
                />
            }
            {
                resource.reasonReference &&
                <Partials.Reference
                    reference={resource.reasonReference}
                    name='Reason Reference'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='reason-reference'
                />
            }
            {
                resource.insurance &&
                <Partials.Reference
                    reference={resource.insurance}
                    name='Insurance'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='insurance'
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
                resource.relevantHistory &&
                <Partials.Reference
                    reference={resource.relevantHistory}
                    name='Relevant History'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='relevant-history'
                />
            }
        </>
    );
};

export default Task;
