/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
AppointmentResponse
    A reply to an appointment request for a patient and/or practitioner(s), such
    as a confirmation or rejection.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TAppointmentResponse } from '../../types/resources/AppointmentResponse';

// Import all the partial resource
import Partials from '../../partials';

const AppointmentResponse = ({ resource }: { resource: TAppointmentResponse }): React.ReactElement => {
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
                resource.appointment &&
                <Partials.Reference
                    reference={resource.appointment}
                    name='Appointment'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='appointment'
                />
            }
            {
                resource.start &&
                <Partials.Instant
                    instant={resource.start}
                    name='Start'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='start'
                />
            }
            {
                resource.end &&
                <Partials.Instant
                    instant={resource.end}
                    name='End'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='end'
                />
            }
            {
                resource.participantType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.participantType}
                    name='Participant Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='participant-type'
                />
            }
            {
                resource.actor &&
                <Partials.Reference
                    reference={resource.actor}
                    name='Actor'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='actor'
                />
            }
            {
                resource.participantStatus &&
                <Partials.Code code={resource.participantStatus} name='Participant Status'/>
            }
        </>
    );
};

export default AppointmentResponse;
