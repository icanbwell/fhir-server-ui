/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TInt } from '../simpleTypes/Int';
import { TCodeableConcept } from '../partials/CodeableConcept';

export type TExplanationOfBenefitProcessNote = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    number?: TInt;
    type?: String;
    text?: String;
    language?: TCodeableConcept;
};

