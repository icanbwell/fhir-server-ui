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
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TDateTime } from '../simpleTypes/DateTime';
import { TQuantity } from '../partials/Quantity';
import { TPeriod } from '../partials/Period';
import { TRange } from '../partials/Range';
import { TConditionStage } from '../partials/ConditionStage';
import { TConditionEvidence } from '../partials/ConditionEvidence';
import { TAnnotation } from '../partials/Annotation';

export type TCondition = {
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
    clinicalStatus?: TCodeableConcept;
    verificationStatus?: TCodeableConcept;
    category?: TCodeableConcept[];
    severity?: TCodeableConcept;
    code?: TCodeableConcept;
    bodySite?: TCodeableConcept[];
    subject: TReference;
    encounter?: TReference;
    onsetDateTime?: TDateTime;
    onsetAge?: TQuantity;
    onsetPeriod?: TPeriod;
    onsetRange?: TRange;
    onsetString?: String;
    abatementDateTime?: TDateTime;
    abatementAge?: TQuantity;
    abatementPeriod?: TPeriod;
    abatementRange?: TRange;
    abatementString?: String;
    recordedDate?: TDateTime;
    recorder?: TReference;
    asserter?: TReference;
    stage?: TConditionStage[];
    evidence?: TConditionEvidence[];
    note?: TAnnotation[];
};

