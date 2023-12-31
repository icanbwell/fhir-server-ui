/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TReference } from '../partials/Reference';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TQuantity } from '../partials/Quantity';
import { TRange } from '../partials/Range';
import { TRatio } from '../partials/Ratio';

export type TSubstanceSpecificationRelationship = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    substanceReference?: TReference;
    substanceCodeableConcept?: TCodeableConcept;
    relationship?: TCodeableConcept;
    isDefining?: Boolean;
    amountQuantity?: TQuantity;
    amountRange?: TRange;
    amountRatio?: TRatio;
    amountString?: String;
    amountRatioLowLimit?: TRatio;
    amountType?: TCodeableConcept;
    source?: TReference[];
};

