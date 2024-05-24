/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
AdministrableProductDefinition
    A medicinal product in the final form which is suitable for administering to a
    patient (after any mixing of multiple components, dissolution etc. has been
    performed).
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TAdministrableProductDefinition } from '../../types/resources/AdministrableProductDefinition';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const AdministrableProductDefinition = ({ resource }: { resource: TAdministrableProductDefinition }): React.ReactElement => {
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
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.formOf &&
                <Partials.Reference
                    reference={resource.formOf}
                    name='Form Of'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='form-of'
                />
            }
            {
                resource.administrableDoseForm &&
                <Partials.CodeableConcept
                    codeableConcept={resource.administrableDoseForm}
                    name='Administrable Dose Form'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='administrable-dose-form'
                />
            }
            {
                resource.unitOfPresentation &&
                <Partials.CodeableConcept
                    codeableConcept={resource.unitOfPresentation}
                    name='Unit Of Presentation'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='unit-of-presentation'
                />
            }
            {
                resource.producedFrom &&
                <Partials.Reference
                    reference={resource.producedFrom}
                    name='Produced From'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='produced-from'
                />
            }
            {
                resource.ingredient &&
                <Partials.CodeableConcept
                    codeableConcept={resource.ingredient}
                    name='Ingredient'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='ingredient'
                />
            }
            {
                resource.device &&
                <Partials.Reference
                    reference={resource.device}
                    name='Device'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='device'
                />
            }
        </>
    );
};

export default AdministrableProductDefinition;