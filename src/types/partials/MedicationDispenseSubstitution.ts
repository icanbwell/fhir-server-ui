/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';

export type TMedicationDispenseSubstitution = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    wasSubstituted: Boolean;
    type?: TCodeableConcept;
    reason?: TCodeableConcept[];
    responsibleParty?: TReference[];
};

