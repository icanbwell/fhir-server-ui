/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TInt } from '../simpleTypes/Int';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TDateTime } from '../simpleTypes/DateTime';
import { TReference } from '../partials/Reference';

export type TExplanationOfBenefitProcedure = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    sequence: TInt;
    type?: TCodeableConcept[];
    date?: TDateTime;
    procedureCodeableConcept?: TCodeableConcept;
    procedureReference?: TReference;
    udi?: TReference[];
};

