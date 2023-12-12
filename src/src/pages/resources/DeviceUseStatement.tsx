/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
DeviceUseStatement
    A record of a device being used by a patient where the record is the result of
    a report from the patient or another clinician.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TDeviceUseStatement } from '../../types/resources/DeviceUseStatement';

// Import all the partial resource
import Partials from '../../partials';

const DeviceUseStatement = ({ resource }: { resource: TDeviceUseStatement }): React.ReactElement => {
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
                resource.derivedFrom &&
                <Partials.Reference
                    reference={resource.derivedFrom}
                    name='Derived From'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='derived-from'
                />
            }
            {
                resource.timingTiming &&
                <Partials.Timing
                    timing={resource.timingTiming}
                    name='Timing Timing'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='timing-timing'
                />
            }
            {
                resource.timingPeriod &&
                <Partials.Period
                    period={resource.timingPeriod}
                    name='Timing Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='timing-period'
                />
            }
            {
                resource.timingDateTime &&
                <Partials.DateTime
                    dateTime={resource.timingDateTime}
                    name='Timing Date Time'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='timing-date-time'
                />
            }
            {
                resource.recordedOn &&
                <Partials.DateTime
                    dateTime={resource.recordedOn}
                    name='Recorded On'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='recorded-on'
                />
            }
            {
                resource.source &&
                <Partials.Reference
                    reference={resource.source}
                    name='Source'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='source'
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

export default DeviceUseStatement;
