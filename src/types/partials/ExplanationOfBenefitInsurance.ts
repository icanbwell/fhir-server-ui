/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TReference } from '../partials/Reference';

export type TExplanationOfBenefitInsurance = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    focal: Boolean;
    coverage: TReference;
    preAuthRef?: String[];
};

