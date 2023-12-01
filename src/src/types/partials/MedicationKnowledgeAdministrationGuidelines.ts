/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TMedicationKnowledgeDosage } from '../partials/MedicationKnowledgeDosage';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TMedicationKnowledgePatientCharacteristics } from '../partials/MedicationKnowledgePatientCharacteristics';

export type TMedicationKnowledgeAdministrationGuidelines = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    dosage?: TMedicationKnowledgeDosage[];
    indicationCodeableConcept?: TCodeableConcept;
    indicationReference?: TReference;
    patientCharacteristics?: TMedicationKnowledgePatientCharacteristics[];
};

