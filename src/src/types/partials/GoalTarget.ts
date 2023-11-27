/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TQuantity } from '../partials/Quantity';
import { TRange } from '../partials/Range';
import { TInt } from '../simpleTypes/Int';
import { TRatio } from '../partials/Ratio';
import { TDate } from '../simpleTypes/Date';

export type TGoalTarget = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    measure?: TCodeableConcept;
    detailQuantity?: TQuantity;
    detailRange?: TRange;
    detailCodeableConcept?: TCodeableConcept;
    detailString?: String;
    detailBoolean?: Boolean;
    detailInteger?: TInt;
    detailRatio?: TRatio;
    dueDate?: TDate;
    dueDuration?: TQuantity;
};

