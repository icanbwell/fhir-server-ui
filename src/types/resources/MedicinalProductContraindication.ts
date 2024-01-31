/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TReference } from '../partials/Reference';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TMedicinalProductContraindicationOtherTherapy } from '../partials/MedicinalProductContraindicationOtherTherapy';
import { TPopulation } from '../partials/Population';

export type TMedicinalProductContraindication = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    subject?: TReference[];
    disease?: TCodeableConcept;
    diseaseStatus?: TCodeableConcept;
    comorbidity?: TCodeableConcept[];
    therapeuticIndication?: TReference[];
    otherTherapy?: TMedicinalProductContraindicationOtherTherapy[];
    population?: TPopulation[];
};

