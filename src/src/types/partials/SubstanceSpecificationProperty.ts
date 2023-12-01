/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TQuantity } from '../partials/Quantity';

export type TSubstanceSpecificationProperty = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    category?: TCodeableConcept;
    code?: TCodeableConcept;
    parameters?: String;
    definingSubstanceReference?: TReference;
    definingSubstanceCodeableConcept?: TCodeableConcept;
    amountQuantity?: TQuantity;
    amountString?: String;
};

