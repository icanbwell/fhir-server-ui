/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TUri } from '../simpleTypes/Uri';
import { TCanonical } from '../simpleTypes/Canonical';

export type TElementDefinitionType = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    code: TUri;
    profile?: TCanonical[];
    targetProfile?: TCanonical[];
    aggregation?: String[];
    versioning?: String;
};

