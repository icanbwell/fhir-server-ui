partials_mapping = {
    'PersonLink': {
        'partial': 'Reference',
        'field': 'target',
        'prop_name': 'reference'
    },
    'AccountCoverage': {
        'partial': 'Reference',
        'field': 'coverage',
        'prop_name': 'reference'
    },
    'AccountGuarantor': {
        'partial': 'Reference',
        'field': 'party',
        'prop_name': 'reference'
    },
    'AdverseEventSuspectEntity': {
        'partial': 'Reference',
        'field': 'instance',
        'prop_name': 'reference'
    },
    'AuditEventSource': {
        'partial': 'Reference',
        'field': 'observer',
        'prop_name': 'reference'
    },
    'CatalogEntryRelatedEntry': {
        'partial': 'Reference',
        'field': 'item',
        'prop_name': 'reference'
    },
    'ChargeItemPerformer': {
        'partial': 'Reference',
        'field': 'actor',
        'prop_name': 'reference'
    },
    'ClaimCareTeam': {
        'partial': 'Reference',
        'field': 'provider',
        'prop_name': 'reference'
    },
    'ClaimInsurance': {
        'partial': 'Reference',
        'field': 'coverage',
        'prop_name': 'reference'
    },
    'ClaimResponseInsurance': {
        'partial': 'Reference',
        'field': 'coverage',
        'prop_name': 'reference'
    },
    'ConsentActor': {
        'partial': 'Reference',
        'field': 'reference',
        'prop_name': 'reference'
    },
    'ConsentData': {
        'partial': 'Reference',
        'field': 'reference',
        'prop_name': 'reference'
    },
    'ContractSigner': {
        'partial': 'Reference',
        'field': 'party',
        'prop_name': 'reference'
    },
    'CoverageEligibilityRequestInsurance': {
        'partial': 'Reference',
        'field': 'coverage',
        'prop_name': 'reference'
    },
    'CoverageEligibilityRequestSupportingInfo': {
        'partial': 'Reference',
        'field': 'information',
        'prop_name': 'reference'
    },
    'CoverageEligibilityResponseInsurance': {
        'partial': 'Reference',
        'field': 'coverage',
        'prop_name': 'reference'
    },
    'DiagnosticReportMedia': {
        'partial': 'Reference',
        'field': 'link',
        'prop_name': 'reference'
    },
    'DocumentReferenceContent': {
        'partial': 'DocumentContent',
        'field': '',
        'prop_name': 'content'
    },
    'DocumentReferenceContext': {
        'partial': 'DocumentReferenceContext',
        'field': '',
        'prop_name': 'context'
    },
    'DocumentReferenceRelatesTo': {
        'partial': 'DocumentReferenceRelatesTo',
        'field': '',
        'prop_name': 'relatesTo'
    },
    'EffectEvidenceSynthesisResultsByExposure': {
        'partial': 'Reference',
        'field': 'riskEvidenceSynthesis',
        'prop_name': 'reference'
    },
    'EncounterDiagnosis': {
        'partial': 'EncounterDiagnosis',
        'field': '',
        'prop_name': 'diagnosis'
    },
    'EncounterLocation': {
        'partial': 'EncounterLocation',
        'field': '',
        'prop_name': 'location'
    },
    'EncounterParticipant': {
        'partial': 'EncounterParticipant',
        'field': '',
        'prop_name': 'participant'
    },
    'EncounterHospitalization': {
        'partial': 'EncounterHospitalization',
        'field': '',
        'prop_name': 'hospitalization'
    },
    'EncounterStatusHistory': {
        'partial': 'EncounterStatusHistory',
        'field': '',
        'prop_name': 'statusHistory'
    },
    'EncounterClassHistory': {
        'partial': 'EncounterClassHistory',
        'field': '',
        'prop_name': 'classHistory'
    },
    'EpisodeOfCareDiagnosis': {
        'partial': 'Reference',
        'field': 'condition',
        'prop_name': 'reference'
    },
    'ExplanationOfBenefitCareTeam': {
        'partial': 'Reference',
        'field': 'provider',
        'prop_name': 'reference'
    },
    'ExplanationOfBenefitInsurance': {
        'partial': 'Reference',
        'field': 'coverage',
        'prop_name': 'reference'
    },
    'GroupMember': {
        'partial': 'Reference',
        'field': 'entity',
        'prop_name': 'reference'
    },
    'ImagingStudyPerformer': {
        'partial': 'Reference',
        'field': 'actor',
        'prop_name': 'reference'
    },
    'ImmunizationPerformer': {
        'partial': 'Reference',
        'field': 'actor',
        'prop_name': 'reference'
    },
    'ImplementationGuideResource': {
        'partial': 'Reference',
        'field': 'reference',
        'prop_name': 'reference'
    },
    'InvoiceParticipant': {
        'partial': 'Reference',
        'field': 'actor',
        'prop_name': 'reference'
    },
    'LinkageItem': {
        'partial': 'Reference',
        'field': 'resource',
        'prop_name': 'reference'
    },
    'ListEntry': {
        'partial': 'Reference',
        'field': 'item',
        'prop_name': 'reference'
    },
    'MedicationAdministrationPerformer': {
        'partial': 'Reference',
        'field': 'actor',
        'prop_name': 'reference'
    },
    'MedicationDispensePerformer': {
        'partial': 'Reference',
        'field': 'actor',
        'prop_name': 'reference'
    },
    'MedicationKnowledgeRegulatory': {
        'partial': 'Reference',
        'field': 'regulatoryAuthority',
        'prop_name': 'reference'
    },
    'PatientLink': {
        'partial': 'Reference',
        'field': 'other',
        'prop_name': 'reference'
    },
    'ProcedureFocalDevice': {
        'partial': 'Reference',
        'field': 'manipulated',
        'prop_name': 'reference'
    },
    'ProcedurePerformer': {
        'partial': 'Reference',
        'field': 'actor',
        'prop_name': 'reference'
    },
    'ProvenanceAgent': {
        'partial': 'Reference',
        'field': 'who',
        'prop_name': 'reference'
    },
    'ProvenanceEntity': {
        'partial': 'Reference',
        'field': 'what',
        'prop_name': 'reference'
    },
    'VerificationResultValidator': {
        'partial': 'Reference',
        'field': 'organization',
        'prop_name': 'reference'
    },
    'Signature': {
        'partial': 'Reference',
        'field': 'who',
        'prop_name': 'reference'
    },
    'SubscriptionChannel': {
        'partial': 'SubscriptionChannel',
        'field': '',
        'prop_name': 'channel'
    },
    'SubscriptionStatusNotificationEvent': {
        'partial': 'SubscriptionStatusNotificationEvent',
        'field': '',
        'prop_name': 'notificationEvent'
    },
    'SubscriptionTopicResourceTrigger': {
        'partial': 'SubscriptionTopicResourceTrigger',
        'field': '',
        'prop_name': 'resourceTrigger'
    },
    'SubscriptionTopicEventTrigger': {
        'partial': 'SubscriptionTopicEventTrigger',
        'field': '',
        'prop_name': 'eventTrigger'
    },
    'SubscriptionTopicCanFilterBy': {
        'partial': 'SubscriptionTopicCanFilterBy',
        'field': '',
        'prop_name': 'canFilterBy'
    },
    'SubscriptionTopicNotificationShape': {
        'partial': 'SubscriptionTopicNotificationShape',
        'field': '',
        'prop_name': 'notificationShape'
    },

    # --- Phase 2: resource-specific backbone elements from the FHIR field coverage gap analysis ---
    'ActivityDefinitionParticipant': {'partial': 'ActivityDefinitionParticipant', 'field': '', 'prop_name': 'participant'},
    'ActivityDefinitionDynamicValue': {'partial': 'ActivityDefinitionDynamicValue', 'field': '', 'prop_name': 'dynamicValue'},
    'AdministrableProductDefinitionRouteOfAdministration': {'partial': 'AdministrableProductDefinitionRouteOfAdministration', 'field': '', 'prop_name': 'routeOfAdministration'},
    'AdministrableProductDefinitionProperty': {'partial': 'AdministrableProductDefinitionProperty', 'field': '', 'prop_name': 'property'},
    'AllergyIntoleranceReaction': {'partial': 'AllergyIntoleranceReaction', 'field': '', 'prop_name': 'reaction'},
    'AppointmentParticipant': {'partial': 'AppointmentParticipant', 'field': '', 'prop_name': 'participant'},
    'AuditEventAgent': {'partial': 'AuditEventAgent', 'field': '', 'prop_name': 'agent'},
    'AuditEventEntity': {'partial': 'AuditEventEntity', 'field': '', 'prop_name': 'entity'},
    'BiologicallyDerivedProductCollection': {'partial': 'BiologicallyDerivedProductCollection', 'field': '', 'prop_name': 'collection'},
    'BiologicallyDerivedProductStorage': {'partial': 'BiologicallyDerivedProductStorage', 'field': '', 'prop_name': 'storage'},
    'BiologicallyDerivedProductProcessing': {'partial': 'BiologicallyDerivedProductProcessing', 'field': '', 'prop_name': 'processing'},
    'BundleEntry': {'partial': 'BundleEntry', 'field': '', 'prop_name': 'entry'},
    'BundleLink': {'partial': 'BundleLink', 'field': '', 'prop_name': 'link'},
    'CapabilityStatementRest': {'partial': 'CapabilityStatementRest', 'field': '', 'prop_name': 'rest'},
    'CapabilityStatementSoftware': {'partial': 'CapabilityStatementSoftware', 'field': '', 'prop_name': 'software'},
    'CapabilityStatementImplementation': {'partial': 'CapabilityStatementImplementation', 'field': '', 'prop_name': 'implementation'},
    'CarePlanActivity': {'partial': 'CarePlanActivity', 'field': '', 'prop_name': 'activity'},
    'CareTeamParticipant': {'partial': 'CareTeamParticipant', 'field': '', 'prop_name': 'participant'},
    'ChargeItemDefinitionPropertyGroup': {'partial': 'ChargeItemDefinitionPropertyGroup', 'field': '', 'prop_name': 'propertyGroup'},
    'ChargeItemDefinitionApplicability': {'partial': 'ChargeItemDefinitionApplicability', 'field': '', 'prop_name': 'applicability'},
    'CitationCitedArtifact': {'partial': 'CitationCitedArtifact', 'field': '', 'prop_name': 'citedArtifact'},
    'CitationSummary': {'partial': 'CitationSummary', 'field': '', 'prop_name': 'summary'},
    'CitationClassification': {'partial': 'CitationClassification', 'field': '', 'prop_name': 'classification'},
    'ClaimItem': {'partial': 'ClaimItem', 'field': '', 'prop_name': 'item'},
    'ClaimDiagnosis': {'partial': 'ClaimDiagnosis', 'field': '', 'prop_name': 'diagnosis'},
    'ClaimProcedure': {'partial': 'ClaimProcedure', 'field': '', 'prop_name': 'procedure'},
    'ClaimPayee': {'partial': 'ClaimPayee', 'field': '', 'prop_name': 'payee'},
    'ClaimResponseItem': {'partial': 'ClaimResponseItem', 'field': '', 'prop_name': 'item'},
    'ClaimResponseAdjudication': {'partial': 'ClaimResponseAdjudication', 'field': '', 'prop_name': 'adjudication'},
    'ClaimResponseTotal': {'partial': 'ClaimResponseTotal', 'field': '', 'prop_name': 'total'},
    'ClaimResponsePayment': {'partial': 'ClaimResponsePayment', 'field': '', 'prop_name': 'payment'},
    'ClaimResponseError': {'partial': 'ClaimResponseError', 'field': '', 'prop_name': 'error'},
    'ClinicalImpressionFinding': {'partial': 'ClinicalImpressionFinding', 'field': '', 'prop_name': 'finding'},
    'ClinicalImpressionInvestigation': {'partial': 'ClinicalImpressionInvestigation', 'field': '', 'prop_name': 'investigation'},
    'ClinicalUseDefinitionContraindication': {'partial': 'ClinicalUseDefinitionContraindication', 'field': '', 'prop_name': 'contraindication'},
    'ClinicalUseDefinitionInteraction': {'partial': 'ClinicalUseDefinitionInteraction', 'field': '', 'prop_name': 'interaction'},
    'ClinicalUseDefinitionWarning': {'partial': 'ClinicalUseDefinitionWarning', 'field': '', 'prop_name': 'warning'},
    'ClinicalUseDefinitionUndesirableEffect': {'partial': 'ClinicalUseDefinitionUndesirableEffect', 'field': '', 'prop_name': 'undesirableEffect'},
    'ClinicalUseDefinitionIndication': {'partial': 'ClinicalUseDefinitionIndication', 'field': '', 'prop_name': 'indication'},
    'CodeSystemConcept': {'partial': 'CodeSystemConcept', 'field': '', 'prop_name': 'concept'},
    'CodeSystemProperty': {'partial': 'CodeSystemProperty', 'field': '', 'prop_name': 'property'},
    'CodeSystemFilter': {'partial': 'CodeSystemFilter', 'field': '', 'prop_name': 'filter'},
    'CommunicationPayload': {'partial': 'CommunicationPayload', 'field': '', 'prop_name': 'payload'},
    'CommunicationRequestPayload': {'partial': 'CommunicationRequestPayload', 'field': '', 'prop_name': 'payload'},
    'CompartmentDefinitionResource': {'partial': 'CompartmentDefinitionResource', 'field': '', 'prop_name': 'resource'},
    'CompositionSection': {'partial': 'CompositionSection', 'field': '', 'prop_name': 'section'},
    'CompositionAttester': {'partial': 'CompositionAttester', 'field': '', 'prop_name': 'attester'},
    'CompositionEvent': {'partial': 'CompositionEvent', 'field': '', 'prop_name': 'event'},
    'ConceptMapGroup': {'partial': 'ConceptMapGroup', 'field': '', 'prop_name': 'group'},
    'ConditionStage': {'partial': 'ConditionStage', 'field': '', 'prop_name': 'stage'},
    'ConsentProvision': {'partial': 'ConsentProvision', 'field': '', 'prop_name': 'provision'},
    'ConsentPolicy': {'partial': 'ConsentPolicy', 'field': '', 'prop_name': 'policy'},
    'ConsentVerification': {'partial': 'ConsentVerification', 'field': '', 'prop_name': 'verification'},
    'ContractTerm': {'partial': 'ContractTerm', 'field': '', 'prop_name': 'term'},
    'ContractLegal': {'partial': 'ContractLegal', 'field': '', 'prop_name': 'legal'},
    'CoverageEligibilityRequestItem': {'partial': 'CoverageEligibilityRequestItem', 'field': '', 'prop_name': 'item'},
    'CoverageEligibilityResponseError': {'partial': 'CoverageEligibilityResponseError', 'field': '', 'prop_name': 'error'},
    'DetectedIssueMitigation': {'partial': 'DetectedIssueMitigation', 'field': '', 'prop_name': 'mitigation'},
    'DetectedIssueEvidence': {'partial': 'DetectedIssueEvidence', 'field': '', 'prop_name': 'evidence'},
    'DeviceUdiCarrier': {'partial': 'DeviceUdiCarrier', 'field': '', 'prop_name': 'udiCarrier'},
    'DeviceDeviceName': {'partial': 'DeviceDeviceName', 'field': '', 'prop_name': 'deviceName'},
    'DeviceDefinitionUdiDeviceIdentifier': {'partial': 'DeviceDefinitionUdiDeviceIdentifier', 'field': '', 'prop_name': 'udiDeviceIdentifier'},
    'DeviceMetricCalibration': {'partial': 'DeviceMetricCalibration', 'field': '', 'prop_name': 'calibration'},
    'DeviceRequestParameter': {'partial': 'DeviceRequestParameter', 'field': '', 'prop_name': 'parameter'},
    'EpisodeOfCareStatusHistory': {'partial': 'EpisodeOfCareStatusHistory', 'field': '', 'prop_name': 'statusHistory'},
    'EvidenceVariableDefinition': {'partial': 'EvidenceVariableDefinition', 'field': '', 'prop_name': 'variableDefinition'},
    'EvidenceStatistic': {'partial': 'EvidenceStatistic', 'field': '', 'prop_name': 'statistic'},
    'EvidenceCertainty': {'partial': 'EvidenceCertainty', 'field': '', 'prop_name': 'certainty'},
    'EvidenceReportSection': {'partial': 'EvidenceReportSection', 'field': '', 'prop_name': 'section'},
    'EvidenceReportSubject': {'partial': 'EvidenceReportSubject', 'field': '', 'prop_name': 'subject'},
    'EvidenceReportRelatesTo': {'partial': 'EvidenceReportRelatesTo', 'field': '', 'prop_name': 'relatesTo'},
    'EvidenceVariableCharacteristic': {'partial': 'EvidenceVariableCharacteristic', 'field': '', 'prop_name': 'characteristic'},
    'EvidenceVariableCategory': {'partial': 'EvidenceVariableCategory', 'field': '', 'prop_name': 'category'},
    'ExampleScenarioProcess': {'partial': 'ExampleScenarioProcess', 'field': '', 'prop_name': 'process'},
    'ExampleScenarioActor': {'partial': 'ExampleScenarioActor', 'field': '', 'prop_name': 'actor'},
    'ExampleScenarioInstance': {'partial': 'ExampleScenarioInstance', 'field': '', 'prop_name': 'instance'},
    'ExplanationOfBenefitItem': {'partial': 'ExplanationOfBenefitItem', 'field': '', 'prop_name': 'item'},
    'ExplanationOfBenefitTotal': {'partial': 'ExplanationOfBenefitTotal', 'field': '', 'prop_name': 'total'},
    'ExplanationOfBenefitAdjudication': {'partial': 'ExplanationOfBenefitAdjudication', 'field': '', 'prop_name': 'adjudication'},
    'ExplanationOfBenefitPayment': {'partial': 'ExplanationOfBenefitPayment', 'field': '', 'prop_name': 'payment'},
    'ExplanationOfBenefitDiagnosis': {'partial': 'ExplanationOfBenefitDiagnosis', 'field': '', 'prop_name': 'diagnosis'},
    'ExplanationOfBenefitPayee': {'partial': 'ExplanationOfBenefitPayee', 'field': '', 'prop_name': 'payee'},
    'ExplanationOfBenefitBenefitBalance': {'partial': 'ExplanationOfBenefitBenefitBalance', 'field': '', 'prop_name': 'benefitBalance'},
    'ExplanationOfBenefitProcessNote': {'partial': 'ExplanationOfBenefitProcessNote', 'field': '', 'prop_name': 'processNote'},
    'FamilyMemberHistoryCondition': {'partial': 'FamilyMemberHistoryCondition', 'field': '', 'prop_name': 'condition'},
    'GoalTarget': {'partial': 'GoalTarget', 'field': '', 'prop_name': 'target'},
    'GraphDefinitionLink': {'partial': 'GraphDefinitionLink', 'field': '', 'prop_name': 'link'},
    'GroupCharacteristic': {'partial': 'GroupCharacteristic', 'field': '', 'prop_name': 'characteristic'},
    'HealthcareServiceEligibility': {'partial': 'HealthcareServiceEligibility', 'field': '', 'prop_name': 'eligibility'},
    'HealthcareServiceAvailableTime': {'partial': 'HealthcareServiceAvailableTime', 'field': '', 'prop_name': 'availableTime'},
    'ImagingStudySeries': {'partial': 'ImagingStudySeries', 'field': '', 'prop_name': 'series'},
    'ImmunizationReaction': {'partial': 'ImmunizationReaction', 'field': '', 'prop_name': 'reaction'},
    'ImmunizationProtocolApplied': {'partial': 'ImmunizationProtocolApplied', 'field': '', 'prop_name': 'protocolApplied'},
    'ImmunizationRecommendationRecommendation': {'partial': 'ImmunizationRecommendationRecommendation', 'field': '', 'prop_name': 'recommendation'},
    'ImplementationGuideDefinition': {'partial': 'ImplementationGuideDefinition', 'field': '', 'prop_name': 'definition'},
    'ImplementationGuideDependsOn': {'partial': 'ImplementationGuideDependsOn', 'field': '', 'prop_name': 'dependsOn'},
    'ImplementationGuideManifest': {'partial': 'ImplementationGuideManifest', 'field': '', 'prop_name': 'manifest'},
    'IngredientSubstance': {'partial': 'IngredientSubstance', 'field': '', 'prop_name': 'substance'},
    'IngredientManufacturer': {'partial': 'IngredientManufacturer', 'field': '', 'prop_name': 'manufacturer'},
    'InsurancePlanPlan': {'partial': 'InsurancePlanPlan', 'field': '', 'prop_name': 'plan'},
    'InsurancePlanCoverage': {'partial': 'InsurancePlanCoverage', 'field': '', 'prop_name': 'coverage'},
    'LocationPosition': {'partial': 'LocationPosition', 'field': '', 'prop_name': 'position'},
    'LocationHoursOfOperation': {'partial': 'LocationHoursOfOperation', 'field': '', 'prop_name': 'hoursOfOperation'},
    'MeasureGroup': {'partial': 'MeasureGroup', 'field': '', 'prop_name': 'group'},
    'MeasureSupplementalData': {'partial': 'MeasureSupplementalData', 'field': '', 'prop_name': 'supplementalData'},
    'MeasureReportGroup': {'partial': 'MeasureReportGroup', 'field': '', 'prop_name': 'group'},
    'MedicationIngredient': {'partial': 'MedicationIngredient', 'field': '', 'prop_name': 'ingredient'},
    'MedicationBatch': {'partial': 'MedicationBatch', 'field': '', 'prop_name': 'batch'},
    'MedicationAdministrationDosage': {'partial': 'MedicationAdministrationDosage', 'field': '', 'prop_name': 'dosage'},
    'MedicationDispenseSubstitution': {'partial': 'MedicationDispenseSubstitution', 'field': '', 'prop_name': 'substitution'},
    'MedicationKnowledgeIngredient': {'partial': 'MedicationKnowledgeIngredient', 'field': '', 'prop_name': 'ingredient'},
    'MedicationKnowledgeAdministrationGuidelines': {'partial': 'MedicationKnowledgeAdministrationGuidelines', 'field': '', 'prop_name': 'administrationGuidelines'},
    'MedicationKnowledgeDrugCharacteristic': {'partial': 'MedicationKnowledgeDrugCharacteristic', 'field': '', 'prop_name': 'drugCharacteristic'},
    'MedicationRequestDispenseRequest': {'partial': 'MedicationRequestDispenseRequest', 'field': '', 'prop_name': 'dispenseRequest'},
    'MedicationRequestSubstitution': {'partial': 'MedicationRequestSubstitution', 'field': '', 'prop_name': 'substitution'},
    'MedicinalProductDefinitionName': {'partial': 'MedicinalProductDefinitionName', 'field': '', 'prop_name': 'name_'},
    'MedicinalProductDefinitionCharacteristic': {'partial': 'MedicinalProductDefinitionCharacteristic', 'field': '', 'prop_name': 'characteristic'},
    'MessageDefinitionFocus': {'partial': 'MessageDefinitionFocus', 'field': '', 'prop_name': 'focus'},
    'MessageHeaderSource': {'partial': 'MessageHeaderSource', 'field': '', 'prop_name': 'source'},
    'MessageHeaderDestination': {'partial': 'MessageHeaderDestination', 'field': '', 'prop_name': 'destination'},
    'MessageHeaderResponse': {'partial': 'MessageHeaderResponse', 'field': '', 'prop_name': 'response'},
    'MolecularSequenceVariant': {'partial': 'MolecularSequenceVariant', 'field': '', 'prop_name': 'variant'},
    'MolecularSequenceReferenceSeq': {'partial': 'MolecularSequenceReferenceSeq', 'field': '', 'prop_name': 'referenceSeq'},
    'MolecularSequenceQuality': {'partial': 'MolecularSequenceQuality', 'field': '', 'prop_name': 'quality'},
    'MolecularSequenceStructureVariant': {'partial': 'MolecularSequenceStructureVariant', 'field': '', 'prop_name': 'structureVariant'},
    'NutritionOrderOralDiet': {'partial': 'NutritionOrderOralDiet', 'field': '', 'prop_name': 'oralDiet'},
    'NutritionOrderEnteralFormula': {'partial': 'NutritionOrderEnteralFormula', 'field': '', 'prop_name': 'enteralFormula'},
    'NutritionOrderSupplement': {'partial': 'NutritionOrderSupplement', 'field': '', 'prop_name': 'supplement'},
    'NutritionProductNutrient': {'partial': 'NutritionProductNutrient', 'field': '', 'prop_name': 'nutrient'},
    'NutritionProductIngredient': {'partial': 'NutritionProductIngredient', 'field': '', 'prop_name': 'ingredient'},
    'ObservationComponent': {'partial': 'ObservationComponent', 'field': '', 'prop_name': 'component'},
    'OperationDefinitionParameter': {'partial': 'OperationDefinitionParameter', 'field': '', 'prop_name': 'parameter'},
    'OrganizationContact': {'partial': 'OrganizationContact', 'field': '', 'prop_name': 'contact'},
    'PackagedProductDefinitionPackage': {'partial': 'PackagedProductDefinitionPackage', 'field': '', 'prop_name': 'package'},
    'ParametersParameter': {'partial': 'ParametersParameter', 'field': '', 'prop_name': 'parameter'},
    'PatientCommunication': {'partial': 'PatientCommunication', 'field': '', 'prop_name': 'communication'},
    'PaymentReconciliationDetail': {'partial': 'PaymentReconciliationDetail', 'field': '', 'prop_name': 'detail'},
    'PaymentReconciliationProcessNote': {'partial': 'PaymentReconciliationProcessNote', 'field': '', 'prop_name': 'processNote'},
    'PlanDefinitionGoal': {'partial': 'PlanDefinitionGoal', 'field': '', 'prop_name': 'goal'},
    'PlanDefinitionAction': {'partial': 'PlanDefinitionAction', 'field': '', 'prop_name': 'action'},
    'PractitionerQualification': {'partial': 'PractitionerQualification', 'field': '', 'prop_name': 'qualification'},
    'PractitionerRoleAvailableTime': {'partial': 'PractitionerRoleAvailableTime', 'field': '', 'prop_name': 'availableTime'},
    'QuestionnaireItem': {'partial': 'QuestionnaireItem', 'field': '', 'prop_name': 'item'},
    'RegulatedAuthorizationCase': {'partial': 'RegulatedAuthorizationCase', 'field': '', 'prop_name': 'case'},
    'RelatedPersonCommunication': {'partial': 'RelatedPersonCommunication', 'field': '', 'prop_name': 'communication'},
    'RequestGroupAction': {'partial': 'RequestGroupAction', 'field': '', 'prop_name': 'action'},
    'ResearchElementDefinitionCharacteristic': {'partial': 'ResearchElementDefinitionCharacteristic', 'field': '', 'prop_name': 'characteristic'},
    'ResearchStudyArm': {'partial': 'ResearchStudyArm', 'field': '', 'prop_name': 'arm'},
    'ResearchStudyObjective': {'partial': 'ResearchStudyObjective', 'field': '', 'prop_name': 'objective'},
    'RiskAssessmentPrediction': {'partial': 'RiskAssessmentPrediction', 'field': '', 'prop_name': 'prediction'},
    'SearchParameterComponent': {'partial': 'SearchParameterComponent', 'field': '', 'prop_name': 'component'},
    'SpecimenCollection': {'partial': 'SpecimenCollection', 'field': '', 'prop_name': 'collection'},
    'SpecimenContainer': {'partial': 'SpecimenContainer', 'field': '', 'prop_name': 'container'},
    'SpecimenDefinitionTypeTested': {'partial': 'SpecimenDefinitionTypeTested', 'field': '', 'prop_name': 'typeTested'},
    'StructureDefinitionSnapshot': {'partial': 'StructureDefinitionSnapshot', 'field': '', 'prop_name': 'snapshot'},
    'StructureDefinitionDifferential': {'partial': 'StructureDefinitionDifferential', 'field': '', 'prop_name': 'differential'},
    'StructureMapGroup': {'partial': 'StructureMapGroup', 'field': '', 'prop_name': 'group'},
    'StructureMapStructure': {'partial': 'StructureMapStructure', 'field': '', 'prop_name': 'structure'},
    'SubstanceIngredient': {'partial': 'SubstanceIngredient', 'field': '', 'prop_name': 'ingredient'},
    'SubstanceInstance': {'partial': 'SubstanceInstance', 'field': '', 'prop_name': 'instance'},
    'SubstanceDefinitionStructure': {'partial': 'SubstanceDefinitionStructure', 'field': '', 'prop_name': 'structure'},
    'SubstanceDefinitionName': {'partial': 'SubstanceDefinitionName', 'field': '', 'prop_name': 'name_'},
    'SubstanceDefinitionCode': {'partial': 'SubstanceDefinitionCode', 'field': '', 'prop_name': 'code'},
    'SupplyDeliverySuppliedItem': {'partial': 'SupplyDeliverySuppliedItem', 'field': '', 'prop_name': 'suppliedItem'},
    'SupplyRequestParameter': {'partial': 'SupplyRequestParameter', 'field': '', 'prop_name': 'parameter'},
    'TaskInput': {'partial': 'TaskInput', 'field': '', 'prop_name': 'input'},
    'TaskOutput': {'partial': 'TaskOutput', 'field': '', 'prop_name': 'output'},
    'TaskRestriction': {'partial': 'TaskRestriction', 'field': '', 'prop_name': 'restriction'},
    'TerminologyCapabilitiesCodeSystem': {'partial': 'TerminologyCapabilitiesCodeSystem', 'field': '', 'prop_name': 'codeSystem'},
    'TerminologyCapabilitiesSoftware': {'partial': 'TerminologyCapabilitiesSoftware', 'field': '', 'prop_name': 'software'},
    'TestReportTest': {'partial': 'TestReportTest', 'field': '', 'prop_name': 'test'},
    'TestReportSetup': {'partial': 'TestReportSetup', 'field': '', 'prop_name': 'setup'},
    'TestReportParticipant': {'partial': 'TestReportParticipant', 'field': '', 'prop_name': 'participant'},
    'TestScriptTest': {'partial': 'TestScriptTest', 'field': '', 'prop_name': 'test'},
    'TestScriptSetup': {'partial': 'TestScriptSetup', 'field': '', 'prop_name': 'setup'},
    'TestScriptVariable': {'partial': 'TestScriptVariable', 'field': '', 'prop_name': 'variable'},
    'ValueSetCompose': {'partial': 'ValueSetCompose', 'field': '', 'prop_name': 'compose'},
    'ValueSetExpansion': {'partial': 'ValueSetExpansion', 'field': '', 'prop_name': 'expansion'},
    'VerificationResultPrimarySource': {'partial': 'VerificationResultPrimarySource', 'field': '', 'prop_name': 'primarySource'},
    'VerificationResultAttestation': {'partial': 'VerificationResultAttestation', 'field': '', 'prop_name': 'attestation'},
    'VisionPrescriptionLensSpecification': {'partial': 'VisionPrescriptionLensSpecification', 'field': '', 'prop_name': 'lensSpecification'},
}
