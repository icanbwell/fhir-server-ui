/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TTestScriptLink } from '../partials/TestScriptLink';
import { TTestScriptCapability } from '../partials/TestScriptCapability';

export type TTestScriptMetadata = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    link?: TTestScriptLink[];
    capability: TTestScriptCapability[];
};
