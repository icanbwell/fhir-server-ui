/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TDateTime } from '../simpleTypes/DateTime';
import { TReference } from '../partials/Reference';
import { TVisionPrescriptionLensSpecification } from '../partials/VisionPrescriptionLensSpecification';

export type TVisionPrescription = {
    resourceType?: String;
    id?: String;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    identifier?: TIdentifier[];
    status: String;
    created: TDateTime;
    patient: TReference;
    encounter?: TReference;
    dateWritten: TDateTime;
    prescriber: TReference;
    lensSpecification: TVisionPrescriptionLensSpecification[];
};

