/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TCanonical } from '../simpleTypes/Canonical';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TDateTime } from '../simpleTypes/DateTime';
import { TPeriod } from '../partials/Period';
import { TDate } from '../simpleTypes/Date';
import { TQuantity } from '../partials/Quantity';
import { TRange } from '../partials/Range';
import { TAnnotation } from '../partials/Annotation';
import { TFamilyMemberHistoryCondition } from '../partials/FamilyMemberHistoryCondition';

export type TFamilyMemberHistory = {
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
    instantiatesCanonical?: TCanonical[];
    instantiatesUri?: TUri[];
    status: String;
    dataAbsentReason?: TCodeableConcept;
    patient: TReference;
    date?: TDateTime;
    name?: String;
    relationship: TCodeableConcept;
    sex?: TCodeableConcept;
    bornPeriod?: TPeriod;
    bornDate?: TDate;
    bornString?: String;
    ageAge?: TQuantity;
    ageRange?: TRange;
    ageString?: String;
    estimatedAge?: Boolean;
    deceasedBoolean?: Boolean;
    deceasedAge?: TQuantity;
    deceasedRange?: TRange;
    deceasedDate?: TDate;
    deceasedString?: String;
    reasonCode?: TCodeableConcept[];
    reasonReference?: TReference[];
    note?: TAnnotation[];
    condition?: TFamilyMemberHistoryCondition[];
};

