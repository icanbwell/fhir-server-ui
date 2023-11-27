/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TReference } from '../partials/Reference';
import { TCanonical } from '../simpleTypes/Canonical';
import { TId } from '../simpleTypes/Id';

export type TImplementationGuideResource = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    reference: TReference;
    fhirVersion?: String[];
    name?: String;
    description?: String;
    exampleBoolean?: Boolean;
    exampleCanonical?: TCanonical;
    groupingId?: TId;
};

