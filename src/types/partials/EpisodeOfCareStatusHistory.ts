/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TPeriod } from '../partials/Period';

export type TEpisodeOfCareStatusHistory = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    status: String;
    period: TPeriod;
};
