/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TQuantity } from '../partials/Quantity';
import { TCodeableConcept } from '../partials/CodeableConcept';

export type TInsurancePlanLimit = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    value?: TQuantity;
    code?: TCodeableConcept;
};

