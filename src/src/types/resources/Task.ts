/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TCanonical } from '../simpleTypes/Canonical';
import { TReference } from '../partials/Reference';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TPeriod } from '../partials/Period';
import { TDateTime } from '../simpleTypes/DateTime';
import { TAnnotation } from '../partials/Annotation';
import { TTaskRestriction } from '../partials/TaskRestriction';
import { TTaskInput } from '../partials/TaskInput';
import { TTaskOutput } from '../partials/TaskOutput';

export type TTask = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    identifier?: TIdentifier[];
    instantiatesCanonical?: TCanonical;
    instantiatesUri?: TUri;
    basedOn?: TReference[];
    groupIdentifier?: TIdentifier;
    partOf?: TReference[];
    status: String;
    statusReason?: TCodeableConcept;
    businessStatus?: TCodeableConcept;
    intent: String;
    priority?: String;
    code?: TCodeableConcept;
    description?: String;
    focus?: TReference;
    for_?: TReference;
    encounter?: TReference;
    executionPeriod?: TPeriod;
    authoredOn?: TDateTime;
    lastModified?: TDateTime;
    requester?: TReference;
    performerType?: TCodeableConcept[];
    owner?: TReference;
    location?: TReference;
    reasonCode?: TCodeableConcept;
    reasonReference?: TReference;
    insurance?: TReference[];
    note?: TAnnotation[];
    relevantHistory?: TReference[];
    restriction?: TTaskRestriction;
    input?: TTaskInput[];
    output?: TTaskOutput[];
};

