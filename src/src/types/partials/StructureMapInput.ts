/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TId } from '../simpleTypes/Id';

export type TStructureMapInput = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    name: TId;
    type?: String;
    mode: String;
    documentation?: String;
};

