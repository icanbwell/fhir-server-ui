/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TReference } from '../partials/Reference';
import { TCanonical } from '../simpleTypes/Canonical';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TExpression } from '../partials/Expression';
import { TDataRequirement } from '../partials/DataRequirement';
import { TTriggerDefinition } from '../partials/TriggerDefinition';
import { TUsageContext } from '../partials/UsageContext';
import { TDateTime } from '../simpleTypes/DateTime';
import { TPeriod } from '../partials/Period';
import { TQuantity } from '../partials/Quantity';
import { TTiming } from '../partials/Timing';

export type TEvidenceVariableCharacteristic = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    description?: String;
    definitionReference?: TReference;
    definitionCanonical?: TCanonical;
    definitionCodeableConcept?: TCodeableConcept;
    definitionExpression?: TExpression;
    definitionDataRequirement?: TDataRequirement;
    definitionTriggerDefinition?: TTriggerDefinition;
    usageContext?: TUsageContext[];
    exclude?: Boolean;
    participantEffectiveDateTime?: TDateTime;
    participantEffectivePeriod?: TPeriod;
    participantEffectiveDuration?: TQuantity;
    participantEffectiveTiming?: TTiming;
    timeFromStart?: TQuantity;
    groupMeasure?: String;
};

