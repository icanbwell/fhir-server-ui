/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TTerminologyCapabilitiesParameter } from '../partials/TerminologyCapabilitiesParameter';
import { TMarkdown } from '../simpleTypes/Markdown';

export type TTerminologyCapabilitiesExpansion = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    hierarchical?: Boolean;
    paging?: Boolean;
    incomplete?: Boolean;
    parameter?: TTerminologyCapabilitiesParameter[];
    textFilter?: TMarkdown;
};
