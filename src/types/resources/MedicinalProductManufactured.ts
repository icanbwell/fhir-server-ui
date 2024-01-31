/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TQuantity } from '../partials/Quantity';
import { TReference } from '../partials/Reference';
import { TProdCharacteristic } from '../partials/ProdCharacteristic';

export type TMedicinalProductManufactured = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    manufacturedDoseForm: TCodeableConcept;
    unitOfPresentation?: TCodeableConcept;
    quantity: TQuantity;
    manufacturer?: TReference[];
    ingredient?: TReference[];
    physicalCharacteristics?: TProdCharacteristic;
    otherCharacteristics?: TCodeableConcept[];
};

