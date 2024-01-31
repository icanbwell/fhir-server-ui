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
import { TDate } from '../simpleTypes/Date';
import { TGoalTarget } from '../partials/GoalTarget';
import { TAnnotation } from '../partials/Annotation';

export type TGoal = {
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
    lifecycleStatus: String;
    achievementStatus?: TCodeableConcept;
    category?: TCodeableConcept[];
    priority?: TCodeableConcept;
    description: TCodeableConcept;
    subject: TReference;
    startDate?: TDate;
    startCodeableConcept?: TCodeableConcept;
    target?: TGoalTarget[];
    statusDate?: TDate;
    statusReason?: String;
    expressedBy?: TReference;
    addresses?: TReference[];
    note?: TAnnotation[];
    outcomeCode?: TCodeableConcept[];
    outcomeReference?: TReference[];
};

