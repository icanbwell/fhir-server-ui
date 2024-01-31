/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCanonical } from '../simpleTypes/Canonical';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TCapabilityStatementInteraction } from '../partials/CapabilityStatementInteraction';
import { TCapabilityStatementSearchParam } from '../partials/CapabilityStatementSearchParam';
import { TCapabilityStatementOperation } from '../partials/CapabilityStatementOperation';

export type TCapabilityStatementResource = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    type: String;
    profile?: TCanonical;
    supportedProfile?: TCanonical[];
    documentation?: TMarkdown;
    interaction?: TCapabilityStatementInteraction[];
    versioning?: String;
    readHistory?: Boolean;
    updateCreate?: Boolean;
    conditionalCreate?: Boolean;
    conditionalRead?: String;
    conditionalUpdate?: Boolean;
    conditionalDelete?: String;
    referencePolicy?: String[];
    searchInclude?: String[];
    searchRevInclude?: String[];
    searchParam?: TCapabilityStatementSearchParam[];
    operation?: TCapabilityStatementOperation[];
};

