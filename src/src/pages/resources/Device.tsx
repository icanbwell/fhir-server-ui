/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Device
    A type of a manufactured item that is used in the provision of healthcare
    without being substantially changed through that activity. The device may be a
    medical or non-medical device.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TDevice } from '../../types/resources/Device';

// Import all the partial resource
import Partials from '../../partials';

const Device = ({ resource }: { resource: TDevice }): React.ReactElement => {
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
                resource.definition &&
                <Partials.Reference
                    reference={resource.definition}
                    name='Definition'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='definition'
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
                resource.manufactureDate &&
                <Partials.DateTime
                    dateTime={resource.manufactureDate}
                    name='Manufacture Date'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='manufacture-date'
                />
            }
            {
                resource.expirationDate &&
                <Partials.DateTime
                    dateTime={resource.expirationDate}
                    name='Expiration Date'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='expiration-date'
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
                resource.patient &&
                <Partials.Reference
                    reference={resource.patient}
                    name='Patient'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='patient'
                />
            }
            {
                resource.owner &&
                <Partials.Reference
                    reference={resource.owner}
                    name='Owner'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='owner'
                />
            }
            {
                resource.contact &&
                <Partials.ContactPoint
                    contactPoint={resource.contact}
                    name='Contact'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='contact'
                />
            }
            {
                resource.location &&
                <Partials.Reference
                    reference={resource.location}
                    name='Location'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='location'
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
                resource.note &&
                <Partials.Annotation
                    annotation={resource.note}
                    name='Note'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='note'
                />
            }
            {
                resource.safety &&
                <Partials.CodeableConcept
                    codeableConcept={resource.safety}
                    name='Safety'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='safety'
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
        </>
    );
};

export default Device;
