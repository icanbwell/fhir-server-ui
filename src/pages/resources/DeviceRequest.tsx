/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
DeviceRequest
    Represents a request for a patient to employ a medical device. The device may
    be an implantable device, or an external assistive device, such as a walker.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TDeviceRequest } from '../../types/resources/DeviceRequest';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const DeviceRequest = ({ resource }: { resource: TDeviceRequest }): React.ReactElement => {
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
                resource.priorRequest &&
                <Partials.Reference
                    reference={resource.priorRequest}
                    name='Prior Request'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='prior-request'
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
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
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
                resource.codeReference &&
                <Partials.Reference
                    reference={resource.codeReference}
                    name='Code Reference'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='code-reference'
                />
            }
            {
                resource.codeCodeableConcept &&
                <Partials.CodeableConcept
                    codeableConcept={resource.codeCodeableConcept}
                    name='Code Codeable Concept'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='code-codeable-concept'
                />
            }
            {
                resource.subject &&
                <Partials.Reference
                    reference={resource.subject}
                    name='Subject'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='subject'
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
                resource.occurrenceDateTime &&
                <Partials.DateTime
                    dateTime={resource.occurrenceDateTime}
                    name='Occurrence Date Time'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='occurrence-date-time'
                />
            }
            {
                resource.occurrencePeriod &&
                <Partials.Period
                    period={resource.occurrencePeriod}
                    name='Occurrence Period'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='occurrence-period'
                />
            }
            {
                resource.occurrenceTiming &&
                <Partials.Timing
                    timing={resource.occurrenceTiming}
                    name='Occurrence Timing'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='occurrence-timing'
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
                resource.performer &&
                <Partials.Reference
                    reference={resource.performer}
                    name='Performer'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='performer'
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
                resource.supportingInfo &&
                <Partials.Reference
                    reference={resource.supportingInfo}
                    name='Supporting Info'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='supporting-info'
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

export default DeviceRequest;
