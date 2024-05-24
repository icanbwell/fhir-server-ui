/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
ClinicalUseDefinition
    A single issue - either an indication, contraindication, interaction or an
    undesirable effect for a medicinal product, medication, device or procedure.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TClinicalUseDefinition } from '../../types/resources/ClinicalUseDefinition';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const ClinicalUseDefinition = ({ resource }: { resource: TClinicalUseDefinition }): React.ReactElement => {
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
                resource.type &&
                <Partials.Code code={resource.type} name='Type'/>
            }
            {
                resource.category &&
                <Partials.CodeableConcept
                    codeableConcept={resource.category}
                    name='Category'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='category'
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
                resource.status &&
                <Partials.CodeableConcept
                    codeableConcept={resource.status}
                    name='Status'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='status'
                />
            }
            {
                resource.population &&
                <Partials.Reference
                    reference={resource.population}
                    name='Population'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='population'
                />
            }
        </>
    );
};

export default ClinicalUseDefinition;