/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCoding } from '../partials/Coding';

export type TMedicinalProductNamePart = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    part: String;
    type: TCoding;
};

