/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TCoding } from '../partials/Coding';
import { TPeriod } from '../partials/Period';
import { TInstant } from '../simpleTypes/Instant';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TAuditEventAgent } from '../partials/AuditEventAgent';
import { TAuditEventSource } from '../partials/AuditEventSource';
import { TAuditEventEntity } from '../partials/AuditEventEntity';

export type TAuditEvent = {
    resourceType?: String;
    id?: String;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    type: TCoding;
    subtype?: TCoding[];
    action?: String;
    period?: TPeriod;
    recorded: TInstant;
    outcome?: String;
    outcomeDesc?: String;
    purposeOfEvent?: TCodeableConcept[];
    agent: TAuditEventAgent[];
    source: TAuditEventSource;
    entity?: TAuditEventEntity[];
};

