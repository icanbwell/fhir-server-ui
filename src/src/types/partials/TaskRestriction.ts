/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TInt } from '../simpleTypes/Int';
import { TPeriod } from '../partials/Period';
import { TReference } from '../partials/Reference';

export type TTaskRestriction = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    repetitions?: TInt;
    period?: TPeriod;
    recipient?: TReference[];
};

