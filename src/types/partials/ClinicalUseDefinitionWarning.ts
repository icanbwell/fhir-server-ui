/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TCodeableConcept } from '../partials/CodeableConcept';

export type TClinicalUseDefinitionWarning = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    description?: TMarkdown;
    code?: TCodeableConcept;
};

