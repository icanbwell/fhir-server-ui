/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TExpression } from '../partials/Expression';

export type TActivityDefinitionDynamicValue = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    path: String;
    expression: TExpression;
};

