/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TRatio } from '../partials/Ratio';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TMedicinalProductIngredientReferenceStrength } from '../partials/MedicinalProductIngredientReferenceStrength';

export type TMedicinalProductIngredientStrength = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    presentation: TRatio;
    presentationLowLimit?: TRatio;
    concentration?: TRatio;
    concentrationLowLimit?: TRatio;
    measurementPoint?: String;
    country?: TCodeableConcept[];
    referenceStrength?: TMedicinalProductIngredientReferenceStrength[];
};

