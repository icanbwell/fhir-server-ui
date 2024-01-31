/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';

export type TMedicinalProductIndicationOtherTherapy = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    therapyRelationshipType: TCodeableConcept;
    medicationCodeableConcept?: TCodeableConcept;
    medicationReference?: TReference;
};

