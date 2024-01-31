/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TContactPoint } from '../partials/ContactPoint';
import { TUrl } from '../simpleTypes/Url';

export type TMessageHeaderSource = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    name?: String;
    software?: String;
    version?: String;
    contact?: TContactPoint;
    endpoint: TUrl;
};

