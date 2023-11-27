/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TQuantity } from '../partials/Quantity';

export type TInsurancePlanCost = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    type: TCodeableConcept;
    applicability?: TCodeableConcept;
    qualifiers?: TCodeableConcept[];
    value?: TQuantity;
};

