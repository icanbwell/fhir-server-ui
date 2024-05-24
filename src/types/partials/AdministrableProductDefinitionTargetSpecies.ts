/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TAdministrableProductDefinitionWithdrawalPeriod } from '../partials/AdministrableProductDefinitionWithdrawalPeriod';

export type TAdministrableProductDefinitionTargetSpecies = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    code: TCodeableConcept;
    withdrawalPeriod?: TAdministrableProductDefinitionWithdrawalPeriod[];
};
