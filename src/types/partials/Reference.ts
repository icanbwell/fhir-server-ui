/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TUri } from '../simpleTypes/Uri';
import { TIdentifier } from '../partials/Identifier';

export type TReference = {
    id?: String;
    extension?: TExtension[];
    reference?: String;
    type?: TUri;
    identifier?: TIdentifier;
    display?: String;
    _sourceAssigningAuthority?: String;
    _uuid?: String;
    _sourceId?: String;
};

