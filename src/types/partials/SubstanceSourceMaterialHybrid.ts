/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';

export type TSubstanceSourceMaterialHybrid = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    maternalOrganismId?: String;
    maternalOrganismName?: String;
    paternalOrganismId?: String;
    paternalOrganismName?: String;
    hybridType?: TCodeableConcept;
};

