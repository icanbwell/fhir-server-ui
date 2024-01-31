/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TQuantity } from '../partials/Quantity';
import { TMedicationKnowledgeRelatedMedicationKnowledge } from '../partials/MedicationKnowledgeRelatedMedicationKnowledge';
import { TMedicationKnowledgeMonograph } from '../partials/MedicationKnowledgeMonograph';
import { TMedicationKnowledgeIngredient } from '../partials/MedicationKnowledgeIngredient';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TMedicationKnowledgeCost } from '../partials/MedicationKnowledgeCost';
import { TMedicationKnowledgeMonitoringProgram } from '../partials/MedicationKnowledgeMonitoringProgram';
import { TMedicationKnowledgeAdministrationGuidelines } from '../partials/MedicationKnowledgeAdministrationGuidelines';
import { TMedicationKnowledgeMedicineClassification } from '../partials/MedicationKnowledgeMedicineClassification';
import { TMedicationKnowledgePackaging } from '../partials/MedicationKnowledgePackaging';
import { TMedicationKnowledgeDrugCharacteristic } from '../partials/MedicationKnowledgeDrugCharacteristic';
import { TMedicationKnowledgeRegulatory } from '../partials/MedicationKnowledgeRegulatory';
import { TMedicationKnowledgeKinetics } from '../partials/MedicationKnowledgeKinetics';

export type TMedicationKnowledge = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    code?: TCodeableConcept;
    status?: String;
    manufacturer?: TReference;
    doseForm?: TCodeableConcept;
    amount?: TQuantity;
    synonym?: String[];
    relatedMedicationKnowledge?: TMedicationKnowledgeRelatedMedicationKnowledge[];
    associatedMedication?: TReference[];
    productType?: TCodeableConcept[];
    monograph?: TMedicationKnowledgeMonograph[];
    ingredient?: TMedicationKnowledgeIngredient[];
    preparationInstruction?: TMarkdown;
    intendedRoute?: TCodeableConcept[];
    cost?: TMedicationKnowledgeCost[];
    monitoringProgram?: TMedicationKnowledgeMonitoringProgram[];
    administrationGuidelines?: TMedicationKnowledgeAdministrationGuidelines[];
    medicineClassification?: TMedicationKnowledgeMedicineClassification[];
    packaging?: TMedicationKnowledgePackaging;
    drugCharacteristic?: TMedicationKnowledgeDrugCharacteristic[];
    contraindication?: TReference[];
    regulatory?: TMedicationKnowledgeRegulatory[];
    kinetics?: TMedicationKnowledgeKinetics[];
};

