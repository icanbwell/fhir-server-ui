/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TTestScriptOperation } from '../partials/TestScriptOperation';
import { TTestScriptAssert } from '../partials/TestScriptAssert';

export type TTestScriptAction = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    operation?: TTestScriptOperation;
    assert?: TTestScriptAssert;
};

