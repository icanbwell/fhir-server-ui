/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
SubstanceProtein
    A SubstanceProtein is defined as a single unit of a linear amino acid
    sequence, or a combination of subunits that are either covalently linked or
    have a defined invariant stoichiometric relationship. This includes all
    synthetic, recombinant and purified SubstanceProteins of defined sequence,
    whether the use is therapeutic or prophylactic. This set of elements will be
    used to describe albumins, coagulation factors, cytokines, growth factors,
    peptide/SubstanceProtein hormones, enzymes, toxins, toxoids, recombinant
    vaccines, and immunomodulators.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link, Typography } from '@mui/material';
import { TSubstanceProtein } from '../../types/resources/SubstanceProtein';

// Import all the partial resource
import Partials from '../../partials';

const SubstanceProtein = ({ resource }: { resource: TSubstanceProtein }): React.ReactElement => {
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
                resource.sequenceType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.sequenceType}
                    name='Sequence Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='sequence-type'
                />
            }
        </>
    );
};

export default SubstanceProtein;
