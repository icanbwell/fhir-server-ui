/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TInt } from '../simpleTypes/Int';
import { TReference } from '../partials/Reference';

export type TMeasureReportPopulation = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    code?: TCodeableConcept;
    count?: TInt;
    subjectResults?: TReference;
};

