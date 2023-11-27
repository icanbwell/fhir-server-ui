/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TReference } from '../partials/Reference';
import { TDateTime } from '../simpleTypes/DateTime';
import { TPeriod } from '../partials/Period';
import { TQuantity } from '../partials/Quantity';
import { TCodeableConcept } from '../partials/CodeableConcept';

export type TSpecimenCollection = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    collector?: TReference;
    collectedDateTime?: TDateTime;
    collectedPeriod?: TPeriod;
    duration?: TQuantity;
    quantity?: TQuantity;
    method?: TCodeableConcept;
    bodySite?: TCodeableConcept;
    fastingStatusCodeableConcept?: TCodeableConcept;
    fastingStatusDuration?: TQuantity;
};

