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
import { TDeviceRequestParameter } from '../partials/DeviceRequestParameter';
import { TDateTime } from '../simpleTypes/DateTime';
import { TPeriod } from '../partials/Period';
import { TTiming } from '../partials/Timing';
import { TAnnotation } from '../partials/Annotation';

export type TDeviceRequest = {
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
    instantiatesCanonical?: TCanonical[];
    instantiatesUri?: TUri[];
    basedOn?: TReference[];
    priorRequest?: TReference[];
    groupIdentifier?: TIdentifier;
    status?: String;
    intent: String;
    priority?: String;
    codeReference?: TReference;
    codeCodeableConcept?: TCodeableConcept;
    parameter?: TDeviceRequestParameter[];
    subject: TReference;
    encounter?: TReference;
    occurrenceDateTime?: TDateTime;
    occurrencePeriod?: TPeriod;
    occurrenceTiming?: TTiming;
    authoredOn?: TDateTime;
    requester?: TReference;
    performerType?: TCodeableConcept;
    performer?: TReference;
    reasonCode?: TCodeableConcept[];
    reasonReference?: TReference[];
    insurance?: TReference[];
    supportingInfo?: TReference[];
    note?: TAnnotation[];
    relevantHistory?: TReference[];
};

