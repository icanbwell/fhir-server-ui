/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TRatio } from '../partials/Ratio';

export type TMedicationKnowledgeIngredient = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    itemCodeableConcept?: TCodeableConcept;
    itemReference?: TReference;
    isActive?: Boolean;
    strength?: TRatio;
};

