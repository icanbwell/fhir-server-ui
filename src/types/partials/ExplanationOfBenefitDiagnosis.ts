/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TInt } from '../simpleTypes/Int';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';

export type TExplanationOfBenefitDiagnosis = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    sequence: TInt;
    diagnosisCodeableConcept?: TCodeableConcept;
    diagnosisReference?: TReference;
    type?: TCodeableConcept[];
    onAdmission?: TCodeableConcept;
    packageCode?: TCodeableConcept;
};
