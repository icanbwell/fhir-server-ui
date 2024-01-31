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
import { TQuantity } from '../partials/Quantity';
import { TPeriod } from '../partials/Period';
import { TRange } from '../partials/Range';
import { TAnnotation } from '../partials/Annotation';
import { TAllergyIntoleranceReaction } from '../partials/AllergyIntoleranceReaction';

export type TAllergyIntolerance = {
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
    type?: String;
    category?: String[];
    criticality?: String;
    code?: TCodeableConcept;
    patient: TReference;
    encounter?: TReference;
    onsetDateTime?: TDateTime;
    onsetAge?: TQuantity;
    onsetPeriod?: TPeriod;
    onsetRange?: TRange;
    onsetString?: String;
    recordedDate?: TDateTime;
    recorder?: TReference;
    asserter?: TReference;
    lastOccurrence?: TDateTime;
    note?: TAnnotation[];
    reaction?: TAllergyIntoleranceReaction[];
};

