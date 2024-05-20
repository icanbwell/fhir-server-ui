/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TDateTime } from '../simpleTypes/DateTime';
import { TContactDetail } from '../partials/ContactDetail';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TUsageContext } from '../partials/UsageContext';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TCanonical } from '../simpleTypes/Canonical';
import { TOperationDefinitionParameter } from '../partials/OperationDefinitionParameter';
import { TOperationDefinitionOverload } from '../partials/OperationDefinitionOverload';

export type TOperationDefinition = {
    resourceType?: String;
    id?: String;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    url?: TUri;
    version?: String;
    name: String;
    title?: String;
    status: String;
    kind: String;
    experimental?: Boolean;
    date?: TDateTime;
    publisher?: String;
    contact?: TContactDetail[];
    description?: TMarkdown;
    useContext?: TUsageContext[];
    jurisdiction?: TCodeableConcept[];
    purpose?: TMarkdown;
    affectsState?: Boolean;
    code: String;
    comment?: TMarkdown;
    base?: TCanonical;
    resource?: String[];
    system: Boolean;
    type: Boolean;
    instance: Boolean;
    inputProfile?: TCanonical;
    outputProfile?: TCanonical;
    parameter?: TOperationDefinitionParameter[];
    overload?: TOperationDefinitionOverload[];
};

