/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TId } from '../simpleTypes/Id';

export type TTestScriptAssert = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    label?: String;
    description?: String;
    direction?: String;
    compareToSourceId?: String;
    compareToSourceExpression?: String;
    compareToSourcePath?: String;
    contentType?: String;
    expression?: String;
    headerField?: String;
    minimumId?: String;
    navigationLinks?: Boolean;
    operator?: String;
    path?: String;
    requestMethod?: String;
    requestURL?: String;
    resource?: String;
    response?: String;
    responseCode?: String;
    sourceId?: TId;
    validateProfileId?: TId;
    value?: String;
    warningOnly: Boolean;
};

