/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCanonical } from '../simpleTypes/Canonical';
import { TMarkdown } from '../simpleTypes/Markdown';

export type TCapabilityStatementSearchParam = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    name: String;
    definition?: TCanonical;
    type: String;
    documentation?: TMarkdown;
};

