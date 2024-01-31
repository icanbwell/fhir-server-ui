/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TQuantity } from '../partials/Quantity';
import { TBase64Binary } from '../simpleTypes/Base64Binary';

export type TMedicationKnowledgeDrugCharacteristic = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    type?: TCodeableConcept;
    valueCodeableConcept?: TCodeableConcept;
    valueString?: String;
    valueQuantity?: TQuantity;
    valueBase64Binary?: TBase64Binary;
};

