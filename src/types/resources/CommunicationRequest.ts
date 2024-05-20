/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TReference } from '../partials/Reference';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TCommunicationRequestPayload } from '../partials/CommunicationRequestPayload';
import { TDateTime } from '../simpleTypes/DateTime';
import { TPeriod } from '../partials/Period';
import { TAnnotation } from '../partials/Annotation';

export type TCommunicationRequest = {
    resourceType?: String;
    id?: String;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    identifier?: TIdentifier[];
    basedOn?: TReference[];
    replaces?: TReference[];
    groupIdentifier?: TIdentifier;
    status: String;
    statusReason?: TCodeableConcept;
    category?: TCodeableConcept[];
    priority?: String;
    doNotPerform?: Boolean;
    medium?: TCodeableConcept[];
    subject?: TReference;
    about?: TReference[];
    encounter?: TReference;
    payload?: TCommunicationRequestPayload[];
    occurrenceDateTime?: TDateTime;
    occurrencePeriod?: TPeriod;
    authoredOn?: TDateTime;
    requester?: TReference;
    recipient?: TReference[];
    sender?: TReference;
    reasonCode?: TCodeableConcept[];
    reasonReference?: TReference[];
    note?: TAnnotation[];
};

