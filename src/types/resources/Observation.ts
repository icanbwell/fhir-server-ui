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
import { TDateTime } from '../simpleTypes/DateTime';
import { TPeriod } from '../partials/Period';
import { TTiming } from '../partials/Timing';
import { TInstant } from '../simpleTypes/Instant';
import { TQuantity } from '../partials/Quantity';
import { TInt } from '../simpleTypes/Int';
import { TRange } from '../partials/Range';
import { TRatio } from '../partials/Ratio';
import { TSampledData } from '../partials/SampledData';
import { TTime } from '../simpleTypes/Time';
import { TAnnotation } from '../partials/Annotation';
import { TObservationReferenceRange } from '../partials/ObservationReferenceRange';
import { TObservationComponent } from '../partials/ObservationComponent';

export type TObservation = {
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
    partOf?: TReference[];
    status: String;
    category?: TCodeableConcept[];
    code: TCodeableConcept;
    subject?: TReference;
    focus?: TReference[];
    encounter?: TReference;
    effectiveDateTime?: TDateTime;
    effectivePeriod?: TPeriod;
    effectiveTiming?: TTiming;
    effectiveInstant?: TInstant;
    issued?: TInstant;
    performer?: TReference[];
    valueQuantity?: TQuantity;
    valueCodeableConcept?: TCodeableConcept;
    valueString?: String;
    valueBoolean?: Boolean;
    valueInteger?: TInt;
    valueRange?: TRange;
    valueRatio?: TRatio;
    valueSampledData?: TSampledData;
    valueTime?: TTime;
    valueDateTime?: TDateTime;
    valuePeriod?: TPeriod;
    dataAbsentReason?: TCodeableConcept;
    interpretation?: TCodeableConcept[];
    note?: TAnnotation[];
    bodySite?: TCodeableConcept;
    method?: TCodeableConcept;
    specimen?: TReference;
    device?: TReference;
    referenceRange?: TObservationReferenceRange[];
    hasMember?: TReference[];
    derivedFrom?: TReference[];
    component?: TObservationComponent[];
};

