/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TSubstanceSpecificationOfficial } from '../partials/SubstanceSpecificationOfficial';
import { TReference } from '../partials/Reference';

export type TSubstanceSpecificationName = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    name: String;
    type?: TCodeableConcept;
    status?: TCodeableConcept;
    preferred?: Boolean;
    language?: TCodeableConcept[];
    domain?: TCodeableConcept[];
    jurisdiction?: TCodeableConcept[];
    synonym?: TSubstanceSpecificationName[];
    translation?: TSubstanceSpecificationName[];
    official?: TSubstanceSpecificationOfficial[];
    source?: TReference[];
};

