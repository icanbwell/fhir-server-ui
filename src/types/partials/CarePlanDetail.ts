/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCanonical } from '../simpleTypes/Canonical';
import { TUri } from '../simpleTypes/Uri';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TTiming } from '../partials/Timing';
import { TPeriod } from '../partials/Period';
import { TQuantity } from '../partials/Quantity';

export type TCarePlanDetail = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    kind?: String;
    instantiatesCanonical?: TCanonical[];
    instantiatesUri?: TUri[];
    code?: TCodeableConcept;
    reasonCode?: TCodeableConcept[];
    reasonReference?: TReference[];
    goal?: TReference[];
    status: String;
    statusReason?: TCodeableConcept;
    doNotPerform?: Boolean;
    scheduledTiming?: TTiming;
    scheduledPeriod?: TPeriod;
    scheduledString?: String;
    location?: TReference;
    performer?: TReference[];
    productCodeableConcept?: TCodeableConcept;
    productReference?: TReference;
    dailyAmount?: TQuantity;
    quantity?: TQuantity;
    description?: String;
};

