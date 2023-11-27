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
import { TReference } from '../partials/Reference';
import { TDate } from '../simpleTypes/Date';
import { TPeriod } from '../partials/Period';
import { TDateTime } from '../simpleTypes/DateTime';
import { TCoverageEligibilityResponseInsurance } from '../partials/CoverageEligibilityResponseInsurance';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TCoverageEligibilityResponseError } from '../partials/CoverageEligibilityResponseError';

export type TCoverageEligibilityResponse = {
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
    status: String;
    purpose: String[];
    patient: TReference;
    servicedDate?: TDate;
    servicedPeriod?: TPeriod;
    created: TDateTime;
    requestor?: TReference;
    request: TReference;
    outcome: String;
    disposition?: String;
    insurer: TReference;
    insurance?: TCoverageEligibilityResponseInsurance[];
    preAuthRef?: String;
    form?: TCodeableConcept;
    error?: TCoverageEligibilityResponseError[];
};

