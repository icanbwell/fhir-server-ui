/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TDate } from '../simpleTypes/Date';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TAddress } from '../partials/Address';
import { TReference } from '../partials/Reference';

export type TExplanationOfBenefitAccident = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    date?: TDate;
    type?: TCodeableConcept;
    locationAddress?: TAddress;
    locationReference?: TReference;
};

