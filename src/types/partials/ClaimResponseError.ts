/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TInt } from '../simpleTypes/Int';
import { TCodeableConcept } from '../partials/CodeableConcept';

export type TClaimResponseError = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    itemSequence?: TInt;
    detailSequence?: TInt;
    subDetailSequence?: TInt;
    code: TCodeableConcept;
};

