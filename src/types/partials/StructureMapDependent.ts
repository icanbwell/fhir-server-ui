/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TId } from '../simpleTypes/Id';

export type TStructureMapDependent = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    name: TId;
    variable: String[];
};

