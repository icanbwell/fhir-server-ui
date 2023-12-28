/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TInt } from '../simpleTypes/Int';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TTiming } from '../partials/Timing';
import { TDosageDoseAndRate } from '../partials/DosageDoseAndRate';
import { TRatio } from '../partials/Ratio';
import { TQuantity } from '../partials/Quantity';

export type TDosage = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    sequence?: TInt;
    text?: String;
    additionalInstruction?: TCodeableConcept[];
    patientInstruction?: String;
    timing?: TTiming;
    asNeededBoolean?: Boolean;
    asNeededCodeableConcept?: TCodeableConcept;
    site?: TCodeableConcept;
    route?: TCodeableConcept;
    method?: TCodeableConcept;
    doseAndRate?: TDosageDoseAndRate[];
    maxDosePerPeriod?: TRatio;
    maxDosePerAdministration?: TQuantity;
    maxDosePerLifetime?: TQuantity;
};
