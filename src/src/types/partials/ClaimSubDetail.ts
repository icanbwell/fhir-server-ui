/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TInt } from '../simpleTypes/Int';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TQuantity } from '../partials/Quantity';
import { TMoney } from '../partials/Money';
import { TDecimal } from '../simpleTypes/Decimal';
import { TReference } from '../partials/Reference';

export type TClaimSubDetail = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    sequence: TInt;
    revenue?: TCodeableConcept;
    category?: TCodeableConcept;
    productOrService: TCodeableConcept;
    modifier?: TCodeableConcept[];
    programCode?: TCodeableConcept[];
    quantity?: TQuantity;
    unitPrice?: TMoney;
    factor?: TDecimal;
    net?: TMoney;
    udi?: TReference[];
};

