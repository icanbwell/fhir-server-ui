/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TRatio } from '../partials/Ratio';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';

export type TSubstanceIngredient = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    quantity?: TRatio;
    substanceCodeableConcept?: TCodeableConcept;
    substanceReference?: TReference;
};

