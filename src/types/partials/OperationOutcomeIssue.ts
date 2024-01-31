/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';

export type TOperationOutcomeIssue = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    severity: String;
    code: String;
    details?: TCodeableConcept;
    diagnostics?: String;
    location?: String[];
    expression?: String[];
};

