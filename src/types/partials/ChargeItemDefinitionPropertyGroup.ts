/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TChargeItemDefinitionApplicability } from '../partials/ChargeItemDefinitionApplicability';
import { TChargeItemDefinitionPriceComponent } from '../partials/ChargeItemDefinitionPriceComponent';

export type TChargeItemDefinitionPropertyGroup = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    applicability?: TChargeItemDefinitionApplicability[];
    priceComponent?: TChargeItemDefinitionPriceComponent[];
};

