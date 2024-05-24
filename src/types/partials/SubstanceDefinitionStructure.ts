/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TSubstanceDefinitionMolecularWeight } from '../partials/SubstanceDefinitionMolecularWeight';
import { TReference } from '../partials/Reference';
import { TSubstanceDefinitionRepresentation } from '../partials/SubstanceDefinitionRepresentation';

export type TSubstanceDefinitionStructure = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    stereochemistry?: TCodeableConcept;
    opticalActivity?: TCodeableConcept;
    molecularFormula?: String;
    molecularFormulaByMoiety?: String;
    molecularWeight?: TSubstanceDefinitionMolecularWeight;
    technique?: TCodeableConcept[];
    sourceDocument?: TReference[];
    representation?: TSubstanceDefinitionRepresentation[];
};
