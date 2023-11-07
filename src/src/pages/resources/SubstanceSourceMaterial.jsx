/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
SubstanceSourceMaterial
    Source material shall capture information on the taxonomic and anatomical
    origins as well as the fraction of a material that can result in or can be
    modified to form a substance. This set of data elements shall be used to
    define polymer substances isolated from biological matrices. Taxonomic and
    anatomical origins shall be described using a controlled vocabulary as
    required. This information is captured for naturally derived polymers ( .
    starch) and structurally diverse substances. For Organisms belonging to the
    Kingdom Plantae the Substance level defines the fresh material of a single
    species or infraspecies, the Herbal Drug and the Herbal preparation. For
    Herbal preparations, the fraction information will be captured at the
    Substance information level and additional information for herbal extracts
    will be captured at the Specified Substance Group 1 information level. See for
    further explanation the Substance Class: Structurally Diverse and the herbal
    annex.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import {Link} from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const SubstanceSourceMaterial = ({ resource }) => {
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
                resource.sourceMaterialClass &&
                <Partials.CodeableConcept
                    codeableConcept={resource.sourceMaterialClass}
                    name='Source Material Class'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='source-material-class'
                />
            }
            {
                resource.sourceMaterialType &&
                <Partials.CodeableConcept
                    codeableConcept={resource.sourceMaterialType}
                    name='Source Material Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='source-material-type'
                />
            }
            {
                resource.sourceMaterialState &&
                <Partials.CodeableConcept
                    codeableConcept={resource.sourceMaterialState}
                    name='Source Material State'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='source-material-state'
                />
            }
            {
                resource.organismId &&
                <Partials.Identifier
                    identifier={resource.organismId}
                    name='Organism Id'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='organism-id'
                />
            }
            {
                resource.parentSubstanceId &&
                <Partials.Identifier
                    identifier={resource.parentSubstanceId}
                    name='Parent Substance Id'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='parent-substance-id'
                />
            }
            {
                resource.countryOfOrigin &&
                <Partials.CodeableConcept
                    codeableConcept={resource.countryOfOrigin}
                    name='Country Of Origin'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='country-of-origin'
                />
            }
            {
                resource.developmentStage &&
                <Partials.CodeableConcept
                    codeableConcept={resource.developmentStage}
                    name='Development Stage'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='development-stage'
                />
            }
        </>
    );
};

export default SubstanceSourceMaterial;
