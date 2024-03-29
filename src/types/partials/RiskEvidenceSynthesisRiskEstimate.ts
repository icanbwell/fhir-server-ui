/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TDecimal } from '../simpleTypes/Decimal';
import { TInt } from '../simpleTypes/Int';
import { TRiskEvidenceSynthesisPrecisionEstimate } from '../partials/RiskEvidenceSynthesisPrecisionEstimate';

export type TRiskEvidenceSynthesisRiskEstimate = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    description?: String;
    type?: TCodeableConcept;
    value?: TDecimal;
    unitOfMeasure?: TCodeableConcept;
    denominatorCount?: TInt;
    numeratorCount?: TInt;
    precisionEstimate?: TRiskEvidenceSynthesisPrecisionEstimate[];
};

