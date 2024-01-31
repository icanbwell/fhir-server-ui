/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TUri } from '../simpleTypes/Uri';
import { TCanonical } from '../simpleTypes/Canonical';

export type TConceptMapDependsOn = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    property: TUri;
    system?: TCanonical;
    value: String;
    display?: String;
};

