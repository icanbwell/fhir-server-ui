/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TIdentifier } from '../partials/Identifier';
import { TSubstanceSourceMaterialFractionDescription } from '../partials/SubstanceSourceMaterialFractionDescription';
import { TSubstanceSourceMaterialOrganism } from '../partials/SubstanceSourceMaterialOrganism';
import { TSubstanceSourceMaterialPartDescription } from '../partials/SubstanceSourceMaterialPartDescription';

export type TSubstanceSourceMaterial = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    sourceMaterialClass?: TCodeableConcept;
    sourceMaterialType?: TCodeableConcept;
    sourceMaterialState?: TCodeableConcept;
    organismId?: TIdentifier;
    organismName?: String;
    parentSubstanceId?: TIdentifier[];
    parentSubstanceName?: String[];
    countryOfOrigin?: TCodeableConcept[];
    geographicalLocation?: String[];
    developmentStage?: TCodeableConcept;
    fractionDescription?: TSubstanceSourceMaterialFractionDescription[];
    organism?: TSubstanceSourceMaterialOrganism;
    partDescription?: TSubstanceSourceMaterialPartDescription[];
};
