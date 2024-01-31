/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TId } from '../simpleTypes/Id';
import { TUri } from '../simpleTypes/Uri';

export type TExpression = {
    id?: String;
    extension?: TExtension[];
    description?: String;
    name?: TId;
    language: String;
    expression?: String;
    reference?: TUri;
};

