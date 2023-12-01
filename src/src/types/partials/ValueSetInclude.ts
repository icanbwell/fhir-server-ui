/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TUri } from '../simpleTypes/Uri';
import { TValueSetConcept } from '../partials/ValueSetConcept';
import { TValueSetFilter } from '../partials/ValueSetFilter';
import { TCanonical } from '../simpleTypes/Canonical';

export type TValueSetInclude = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    system?: TUri;
    version?: String;
    concept?: TValueSetConcept[];
    filter?: TValueSetFilter[];
    valueSet?: TCanonical[];
};

