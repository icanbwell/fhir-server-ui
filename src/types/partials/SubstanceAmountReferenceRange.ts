/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TQuantity } from '../partials/Quantity';

export type TSubstanceAmountReferenceRange = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    lowLimit?: TQuantity;
    highLimit?: TQuantity;
};

