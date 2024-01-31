/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TDateTime } from '../simpleTypes/DateTime';
import { TPeriod } from '../partials/Period';
import { TDetectedIssueEvidence } from '../partials/DetectedIssueEvidence';
import { TDetectedIssueMitigation } from '../partials/DetectedIssueMitigation';

export type TDetectedIssue = {
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
    code?: TCodeableConcept;
    severity?: String;
    patient?: TReference;
    identifiedDateTime?: TDateTime;
    identifiedPeriod?: TPeriod;
    author?: TReference;
    implicated?: TReference[];
    evidence?: TDetectedIssueEvidence[];
    detail?: String;
    reference?: TUri;
    mitigation?: TDetectedIssueMitigation[];
};

