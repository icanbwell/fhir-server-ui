/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
Linkage
    Identifies two or more records (resource instances) that refer to the same
    real-world "occurrence".
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TLinkage } from '../../types/resources/Linkage';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const Linkage = ({ resource }: { resource: TLinkage }): React.ReactElement => {
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
                resource.active &&
                <Partials.Boolean
                    boolean={resource.active}
                    name='Active'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='active'
                />
            }
            {
                resource.author &&
                <Partials.Reference
                    reference={resource.author}
                    name='Author'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='author'
                />
            }
            {
                resource.item &&
                <Partials.Reference
                    reference={resource.item}
                    name='Item'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='item'
                    field='resource'
                />
            }
        </>
    );
};

export default Linkage;
