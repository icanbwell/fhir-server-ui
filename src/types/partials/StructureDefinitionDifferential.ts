/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TElementDefinition } from '../partials/ElementDefinition';

export type TStructureDefinitionDifferential = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    element: TElementDefinition[];
};

