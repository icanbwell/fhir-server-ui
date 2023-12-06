/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
DeviceMetric
    Describes a measurement, calculation or setting capability of a medical
    device.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link, Typography } from '@mui/material';
import { TDeviceMetric } from '../../types/resources/DeviceMetric';

// Import all the partial resource
import Partials from '../../partials';

const DeviceMetric = ({ resource }: { resource: TDeviceMetric }): React.ReactElement => {
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
                resource.unit &&
                <Partials.CodeableConcept
                    codeableConcept={resource.unit}
                    name='Unit'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='unit'
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
                resource.parent &&
                <Partials.Reference
                    reference={resource.parent}
                    name='Parent'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='parent'
                />
            }
            {
                resource.operationalStatus &&
                <Partials.Code code={resource.operationalStatus} name='Operational Status'/>
            }
            {
                resource.color &&
                <Partials.Code code={resource.color} name='Color'/>
            }
            {
                resource.category &&
                <Partials.Code code={resource.category} name='Category'/>
            }
            {
                resource.measurementPeriod &&
                <Partials.Timing
                    timing={resource.measurementPeriod}
                    name='Measurement Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='measurement-period'
                />
            }
        </>
    );
};

export default DeviceMetric;
