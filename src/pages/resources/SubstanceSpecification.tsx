/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
SubstanceSpecification
    The detailed description of a substance, typically at a level beyond what is
    used for prescribing.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TSubstanceSpecification } from '../../types/resources/SubstanceSpecification';

// Import all the partial resource
import Partials from '../../partials';

const SubstanceSpecification = ({ resource }: { resource: TSubstanceSpecification }): React.ReactElement => {
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
                resource.status &&
                <Partials.CodeableConcept
                    codeableConcept={resource.status}
                    name='Status'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='status'
                />
            }
            {
                resource.domain &&
                <Partials.CodeableConcept
                    codeableConcept={resource.domain}
                    name='Domain'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='domain'
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
                resource.referenceInformation &&
                <Partials.Reference
                    reference={resource.referenceInformation}
                    name='Reference Information'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='reference-information'
                />
            }
            {
                resource.nucleicAcid &&
                <Partials.Reference
                    reference={resource.nucleicAcid}
                    name='Nucleic Acid'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='nucleic-acid'
                />
            }
            {
                resource.polymer &&
                <Partials.Reference
                    reference={resource.polymer}
                    name='Polymer'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='polymer'
                />
            }
            {
                resource.protein &&
                <Partials.Reference
                    reference={resource.protein}
                    name='Protein'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='protein'
                />
            }
            {
                resource.sourceMaterial &&
                <Partials.Reference
                    reference={resource.sourceMaterial}
                    name='Source Material'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='source-material'
                />
            }
        </>
    );
};

export default SubstanceSpecification;
