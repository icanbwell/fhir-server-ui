/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';

export type TProvenanceAgent = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    type?: TCodeableConcept;
    role?: TCodeableConcept[];
    who: TReference;
    onBehalfOf?: TReference;
};

