/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TDateTime } from '../simpleTypes/DateTime';
import { TReference } from '../partials/Reference';

export type TImmunizationReaction = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    date?: TDateTime;
    detail?: TReference;
    reported?: Boolean;
};

