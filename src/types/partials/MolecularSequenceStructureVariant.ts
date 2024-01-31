/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TInt } from '../simpleTypes/Int';
import { TMolecularSequenceOuter } from '../partials/MolecularSequenceOuter';
import { TMolecularSequenceInner } from '../partials/MolecularSequenceInner';

export type TMolecularSequenceStructureVariant = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    variantType?: TCodeableConcept;
    exact?: Boolean;
    length?: TInt;
    outer?: TMolecularSequenceOuter;
    inner?: TMolecularSequenceInner;
};

