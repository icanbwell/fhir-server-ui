/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TNarrative } from '../partials/Narrative';

export type TCompositionSection = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    title?: String;
    code?: TCodeableConcept;
    author?: TReference[];
    focus?: TReference;
    text?: TNarrative;
    mode?: String;
    orderedBy?: TCodeableConcept;
    entry?: TReference[];
    emptyReason?: TCodeableConcept;
    section?: TCompositionSection[];
};

