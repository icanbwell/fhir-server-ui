/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';

export type TEffectEvidenceSynthesisResultsByExposure = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    description?: String;
    exposureState?: String;
    variantState?: TCodeableConcept;
    riskEvidenceSynthesis: TReference;
};
