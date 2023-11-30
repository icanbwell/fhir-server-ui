/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Practitioner
    A person who is directly or indirectly involved in the provisioning of
    healthcare.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';
import { TPractitioner } from '../../types/resources/Practitioner';

// Import all the partial resource
import Partials from '../../partials';

const Practitioner = ({ resource }: { resource: TPractitioner }): React.ReactElement => {
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
                resource.active &&
                <Partials.Boolean
                    boolean={resource.active}
                    name='Active'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='active'
                />
            }
            {
                resource.name &&
                <Partials.HumanName
                    humanName={resource.name}
                    name='Name'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='name'
                />
            }
            {
                resource.telecom &&
                <Partials.ContactPoint
                    contactPoint={resource.telecom}
                    name='Telecom'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='telecom'
                />
            }
            {
                resource.address &&
                <Partials.Address
                    address={resource.address}
                    name='Address'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='address'
                />
            }
            {
                resource.gender &&
                <Partials.Code code={resource.gender} name='Gender'/>
            }
            {
                resource.photo &&
                <Partials.Attachment
                    attachment={resource.photo}
                    name='Photo'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='photo'
                />
            }
            {
                resource.communication &&
                <Partials.CodeableConcept
                    codeableConcept={resource.communication}
                    name='Communication'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='communication'
                />
            }
        </>
    );
};

export default Practitioner;
