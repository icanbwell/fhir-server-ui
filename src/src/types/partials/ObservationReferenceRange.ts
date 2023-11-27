/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TQuantity } from '../partials/Quantity';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TRange } from '../partials/Range';

export type TObservationReferenceRange = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    low?: TQuantity;
    high?: TQuantity;
    type?: TCodeableConcept;
    appliesTo?: TCodeableConcept[];
    age?: TRange;
    text?: String;
};

