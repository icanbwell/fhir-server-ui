/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TDateTime } from '../simpleTypes/DateTime';
import { TAnnotation } from '../partials/Annotation';

export type TAllergyIntoleranceReaction = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    substance?: TCodeableConcept;
    manifestation: TCodeableConcept[];
    description?: String;
    onset?: TDateTime;
    severity?: String;
    exposureRoute?: TCodeableConcept;
    note?: TAnnotation[];
};

