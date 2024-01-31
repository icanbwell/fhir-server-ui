/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TId } from '../simpleTypes/Id';

export type TTestScriptVariable = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    name: String;
    defaultValue?: String;
    description?: String;
    expression?: String;
    headerField?: String;
    hint?: String;
    path?: String;
    sourceId?: TId;
};

