/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TReference } from '../partials/Reference';
import { TAdverseEventCausality } from '../partials/AdverseEventCausality';

export type TAdverseEventSuspectEntity = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    instance: TReference;
    causality?: TAdverseEventCausality[];
};

