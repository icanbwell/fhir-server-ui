/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TQuantity } from '../partials/Quantity';
import { TAttachment } from '../partials/Attachment';
import { TCodeableConcept } from '../partials/CodeableConcept';

export type TProdCharacteristic = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    height?: TQuantity;
    width?: TQuantity;
    depth?: TQuantity;
    weight?: TQuantity;
    nominalVolume?: TQuantity;
    externalDiameter?: TQuantity;
    shape?: String;
    color?: String[];
    imprint?: String[];
    image?: TAttachment[];
    scoring?: TCodeableConcept;
};

