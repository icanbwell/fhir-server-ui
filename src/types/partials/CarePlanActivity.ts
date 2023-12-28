/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TAnnotation } from '../partials/Annotation';
import { TCarePlanDetail } from '../partials/CarePlanDetail';

export type TCarePlanActivity = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    outcomeCodeableConcept?: TCodeableConcept[];
    outcomeReference?: TReference[];
    progress?: TAnnotation[];
    reference?: TReference;
    detail?: TCarePlanDetail;
};
