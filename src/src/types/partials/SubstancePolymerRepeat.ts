/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TInt } from '../simpleTypes/Int';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TSubstancePolymerRepeatUnit } from '../partials/SubstancePolymerRepeatUnit';

export type TSubstancePolymerRepeat = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    numberOfUnits?: TInt;
    averageMolecularFormula?: String;
    repeatUnitAmountType?: TCodeableConcept;
    repeatUnit?: TSubstancePolymerRepeatUnit[];
};

