import Address from './Address';
import Annotation from './Annotation';
import Attachment from './Attachment';
import BinaryContent from './BinaryContent';
import Boolean from './Boolean';
import Canonical from './Canonical';
import Code from './Code';
import CodeableConcept from './CodeableConcept';
import CodeableReference from './CodeableReference';
import Coding from './Coding';
import ContactPoint from './ContactPoint';
import DataRequirement from './DataRequirement';
import DateField from './Date';
import DateTime from './DateTime';
import Decimal from './Decimal';
import DispenseRequest from './DispenseRequest';
import DocumentContent from './DocumentContent';
import DocumentReferenceContextPartial from './DocumentReferenceContext';
import DocumentReferenceRelatesTo from './DocumentReferenceRelatesTo';
import Dosage from './Dosage';
import EncounterParticipant from './EncounterParticipant';
import EncounterHospitalization from './EncounterHospitalization';
import EncounterDiagnosis from './EncounterDiagnosis';
import EncounterLocation from './EncounterLocation';
import EncounterStatusHistory from './EncounterStatusHistory';
import EncounterClassHistory from './EncounterClassHistory';
import Extension from './Extension';
import HumanName from './HumanName';
import Identifier from './Identifier';
import Instant from './Instant';
import Int from './Int';
import Integer from './Integer';
import InvoiceLineItem from './InvoiceLineItem';
import InvoicePriceComponent from './InvoicePriceComponent';
import Markdown from './Markdown';
import MarketingStatus from './MarketingStatus';
import Meta from './Meta';
import Money from './Money';
import NameValue from './NameValue';
import Narrative from './Narrative';
import ObservationReferenceRange from './ObservationReferenceRange';
import OperationOutcomeIssue from './OperationOutcomeIssue';
import ParameterDefinition from './ParameterDefinition';
import PatientContact from './PatientContact';
import Period from './Period';
import ProdCharacteristic from './ProdCharacteristic';
import ProductShelfLife from './ProductShelfLife';
import Quantity from './Quantity';
import QuestionnaireResponseItem from './QuestionnaireResponseItem';
import RangeField from './Range';
import Ratio from './Ratio';
import Reference from './Reference';
import RelatedArtifact from './RelatedArtifact';
import ReverseReference from './ReverseReference';
import SampledData from './SampledData';
import StringField from './String';
import SubscriptionChannel from './SubscriptionChannel';
import SubscriptionStatusNotificationEvent from './SubscriptionStatusNotificationEvent';
import SubscriptionTopicCanFilterBy from './SubscriptionTopicCanFilterBy';
import SubscriptionTopicEventTrigger from './SubscriptionTopicEventTrigger';
import SubscriptionTopicNotificationShape from './SubscriptionTopicNotificationShape';
import SubscriptionTopicResourceTrigger from './SubscriptionTopicResourceTrigger';
import Time from './Time';
import Timing from './Timing';
import TriggerDefinition from './TriggerDefinition';
import UnsignedInt from './UnsignedInt';
import Uri from './Uri';
import UrlField from './Url';

import ActivityDefinitionDynamicValue from './ActivityDefinitionDynamicValue';
import ActivityDefinitionParticipant from './ActivityDefinitionParticipant';
import AdministrableProductDefinitionProperty from './AdministrableProductDefinitionProperty';
import AdministrableProductDefinitionRouteOfAdministration from './AdministrableProductDefinitionRouteOfAdministration';
import AllergyIntoleranceReaction from './AllergyIntoleranceReaction';
import AppointmentParticipant from './AppointmentParticipant';
import AuditEventAgent from './AuditEventAgent';
import AuditEventEntity from './AuditEventEntity';
import BiologicallyDerivedProductCollection from './BiologicallyDerivedProductCollection';
import BiologicallyDerivedProductProcessing from './BiologicallyDerivedProductProcessing';
import BiologicallyDerivedProductStorage from './BiologicallyDerivedProductStorage';
import BundleEntry from './BundleEntry';
import BundleLink from './BundleLink';
import CapabilityStatementImplementation from './CapabilityStatementImplementation';
import CapabilityStatementRest from './CapabilityStatementRest';
import CapabilityStatementSoftware from './CapabilityStatementSoftware';
import CarePlanActivity from './CarePlanActivity';
import CareTeamParticipant from './CareTeamParticipant';
import ChargeItemDefinitionApplicability from './ChargeItemDefinitionApplicability';
import ChargeItemDefinitionPropertyGroup from './ChargeItemDefinitionPropertyGroup';
import CitationCitedArtifact from './CitationCitedArtifact';
import CitationClassification from './CitationClassification';
import CitationSummary from './CitationSummary';
import ClaimDiagnosis from './ClaimDiagnosis';
import ClaimItem from './ClaimItem';
import ClaimPayee from './ClaimPayee';
import ClaimProcedure from './ClaimProcedure';
import ClaimResponseAdjudication from './ClaimResponseAdjudication';
import ClaimResponseError from './ClaimResponseError';
import ClaimResponseItem from './ClaimResponseItem';
import ClaimResponsePayment from './ClaimResponsePayment';
import ClaimResponseTotal from './ClaimResponseTotal';
import ClinicalImpressionFinding from './ClinicalImpressionFinding';
import ClinicalImpressionInvestigation from './ClinicalImpressionInvestigation';
import ClinicalUseDefinitionContraindication from './ClinicalUseDefinitionContraindication';
import ClinicalUseDefinitionIndication from './ClinicalUseDefinitionIndication';
import ClinicalUseDefinitionInteraction from './ClinicalUseDefinitionInteraction';
import ClinicalUseDefinitionUndesirableEffect from './ClinicalUseDefinitionUndesirableEffect';
import ClinicalUseDefinitionWarning from './ClinicalUseDefinitionWarning';
import CodeSystemConcept from './CodeSystemConcept';
import CodeSystemFilter from './CodeSystemFilter';
import CodeSystemProperty from './CodeSystemProperty';
import CommunicationPayload from './CommunicationPayload';
import CommunicationRequestPayload from './CommunicationRequestPayload';
import CompartmentDefinitionResource from './CompartmentDefinitionResource';
import CompositionAttester from './CompositionAttester';
import CompositionEvent from './CompositionEvent';
import CompositionSection from './CompositionSection';
import ConceptMapGroup from './ConceptMapGroup';
import ConditionStage from './ConditionStage';
import ConsentPolicy from './ConsentPolicy';
import ConsentProvision from './ConsentProvision';
import ConsentVerification from './ConsentVerification';
import ContractLegal from './ContractLegal';
import ContractTerm from './ContractTerm';
import CoverageEligibilityRequestItem from './CoverageEligibilityRequestItem';
import CoverageEligibilityResponseError from './CoverageEligibilityResponseError';
import DetectedIssueEvidence from './DetectedIssueEvidence';
import DetectedIssueMitigation from './DetectedIssueMitigation';
import DeviceDefinitionUdiDeviceIdentifier from './DeviceDefinitionUdiDeviceIdentifier';
import DeviceDeviceName from './DeviceDeviceName';
import DeviceMetricCalibration from './DeviceMetricCalibration';
import DeviceRequestParameter from './DeviceRequestParameter';
import DeviceUdiCarrier from './DeviceUdiCarrier';
import EpisodeOfCareStatusHistory from './EpisodeOfCareStatusHistory';
import EvidenceCertainty from './EvidenceCertainty';
import EvidenceReportRelatesTo from './EvidenceReportRelatesTo';
import EvidenceReportSection from './EvidenceReportSection';
import EvidenceReportSubject from './EvidenceReportSubject';
import EvidenceStatistic from './EvidenceStatistic';
import EvidenceVariableCategory from './EvidenceVariableCategory';
import EvidenceVariableCharacteristic from './EvidenceVariableCharacteristic';
import EvidenceVariableDefinition from './EvidenceVariableDefinition';
import ExampleScenarioActor from './ExampleScenarioActor';
import ExampleScenarioInstance from './ExampleScenarioInstance';
import ExampleScenarioProcess from './ExampleScenarioProcess';
import ExplanationOfBenefitAdjudication from './ExplanationOfBenefitAdjudication';
import ExplanationOfBenefitBenefitBalance from './ExplanationOfBenefitBenefitBalance';
import ExplanationOfBenefitDiagnosis from './ExplanationOfBenefitDiagnosis';
import ExplanationOfBenefitItem from './ExplanationOfBenefitItem';
import ExplanationOfBenefitPayee from './ExplanationOfBenefitPayee';
import ExplanationOfBenefitPayment from './ExplanationOfBenefitPayment';
import ExplanationOfBenefitProcessNote from './ExplanationOfBenefitProcessNote';
import ExplanationOfBenefitTotal from './ExplanationOfBenefitTotal';
import FamilyMemberHistoryCondition from './FamilyMemberHistoryCondition';
import GoalTarget from './GoalTarget';
import GraphDefinitionLink from './GraphDefinitionLink';
import GroupCharacteristic from './GroupCharacteristic';
import HealthcareServiceAvailableTime from './HealthcareServiceAvailableTime';
import HealthcareServiceEligibility from './HealthcareServiceEligibility';
import ImagingStudySeries from './ImagingStudySeries';
import ImmunizationProtocolApplied from './ImmunizationProtocolApplied';
import ImmunizationReaction from './ImmunizationReaction';
import ImmunizationRecommendationRecommendation from './ImmunizationRecommendationRecommendation';
import ImplementationGuideDefinition from './ImplementationGuideDefinition';
import ImplementationGuideDependsOn from './ImplementationGuideDependsOn';
import ImplementationGuideManifest from './ImplementationGuideManifest';
import IngredientManufacturer from './IngredientManufacturer';
import IngredientSubstance from './IngredientSubstance';
import InsurancePlanCoverage from './InsurancePlanCoverage';
import InsurancePlanPlan from './InsurancePlanPlan';
import LocationHoursOfOperation from './LocationHoursOfOperation';
import LocationPosition from './LocationPosition';
import MeasureGroup from './MeasureGroup';
import MeasureReportGroup from './MeasureReportGroup';
import MeasureSupplementalData from './MeasureSupplementalData';
import MedicationAdministrationDosage from './MedicationAdministrationDosage';
import MedicationBatch from './MedicationBatch';
import MedicationDispenseSubstitution from './MedicationDispenseSubstitution';
import MedicationIngredient from './MedicationIngredient';
import MedicationKnowledgeAdministrationGuidelines from './MedicationKnowledgeAdministrationGuidelines';
import MedicationKnowledgeDrugCharacteristic from './MedicationKnowledgeDrugCharacteristic';
import MedicationKnowledgeIngredient from './MedicationKnowledgeIngredient';
import MedicationRequestDispenseRequest from './MedicationRequestDispenseRequest';
import MedicationRequestSubstitution from './MedicationRequestSubstitution';
import MedicinalProductDefinitionCharacteristic from './MedicinalProductDefinitionCharacteristic';
import MedicinalProductDefinitionName from './MedicinalProductDefinitionName';
import MessageDefinitionFocus from './MessageDefinitionFocus';
import MessageHeaderDestination from './MessageHeaderDestination';
import MessageHeaderResponse from './MessageHeaderResponse';
import MessageHeaderSource from './MessageHeaderSource';
import MolecularSequenceQuality from './MolecularSequenceQuality';
import MolecularSequenceReferenceSeq from './MolecularSequenceReferenceSeq';
import MolecularSequenceStructureVariant from './MolecularSequenceStructureVariant';
import MolecularSequenceVariant from './MolecularSequenceVariant';
import NutritionOrderEnteralFormula from './NutritionOrderEnteralFormula';
import NutritionOrderOralDiet from './NutritionOrderOralDiet';
import NutritionOrderSupplement from './NutritionOrderSupplement';
import NutritionProductIngredient from './NutritionProductIngredient';
import NutritionProductNutrient from './NutritionProductNutrient';
import ObservationComponent from './ObservationComponent';
import OperationDefinitionParameter from './OperationDefinitionParameter';
import OrganizationContact from './OrganizationContact';
import PackagedProductDefinitionPackage from './PackagedProductDefinitionPackage';
import ParametersParameter from './ParametersParameter';
import PatientCommunication from './PatientCommunication';
import PaymentReconciliationDetail from './PaymentReconciliationDetail';
import PaymentReconciliationProcessNote from './PaymentReconciliationProcessNote';
import PlanDefinitionAction from './PlanDefinitionAction';
import PlanDefinitionGoal from './PlanDefinitionGoal';
import PractitionerQualification from './PractitionerQualification';
import PractitionerRoleAvailableTime from './PractitionerRoleAvailableTime';
import QuestionnaireItem from './QuestionnaireItem';
import RegulatedAuthorizationCase from './RegulatedAuthorizationCase';
import RelatedPersonCommunication from './RelatedPersonCommunication';
import RequestGroupAction from './RequestGroupAction';
import ResearchElementDefinitionCharacteristic from './ResearchElementDefinitionCharacteristic';
import ResearchStudyArm from './ResearchStudyArm';
import ResearchStudyObjective from './ResearchStudyObjective';
import RiskAssessmentPrediction from './RiskAssessmentPrediction';
import SearchParameterComponent from './SearchParameterComponent';
import SpecimenCollection from './SpecimenCollection';
import SpecimenContainer from './SpecimenContainer';
import SpecimenDefinitionTypeTested from './SpecimenDefinitionTypeTested';
import StructureDefinitionDifferential from './StructureDefinitionDifferential';
import StructureDefinitionSnapshot from './StructureDefinitionSnapshot';
import StructureMapGroup from './StructureMapGroup';
import StructureMapStructure from './StructureMapStructure';
import SubstanceDefinitionCode from './SubstanceDefinitionCode';
import SubstanceDefinitionName from './SubstanceDefinitionName';
import SubstanceDefinitionStructure from './SubstanceDefinitionStructure';
import SubstanceIngredient from './SubstanceIngredient';
import SubstanceInstance from './SubstanceInstance';
import SupplyDeliverySuppliedItem from './SupplyDeliverySuppliedItem';
import SupplyRequestParameter from './SupplyRequestParameter';
import TaskInput from './TaskInput';
import TaskOutput from './TaskOutput';
import TaskRestriction from './TaskRestriction';
import TerminologyCapabilitiesCodeSystem from './TerminologyCapabilitiesCodeSystem';
import TerminologyCapabilitiesSoftware from './TerminologyCapabilitiesSoftware';
import TestReportParticipant from './TestReportParticipant';
import TestReportSetup from './TestReportSetup';
import TestReportTest from './TestReportTest';
import TestScriptSetup from './TestScriptSetup';
import TestScriptTest from './TestScriptTest';
import TestScriptVariable from './TestScriptVariable';
import ValueSetCompose from './ValueSetCompose';
import ValueSetExpansion from './ValueSetExpansion';
import VerificationResultAttestation from './VerificationResultAttestation';
import VerificationResultPrimarySource from './VerificationResultPrimarySource';
import VisionPrescriptionLensSpecification from './VisionPrescriptionLensSpecification';

export default {
  Address,
  Annotation,
  Attachment,
  BinaryContent,
  Boolean,
  Canonical,
  Code,
  CodeableConcept,
  CodeableReference,
  Coding,
  ContactPoint,
  DataRequirement,
  Date: DateField,
  DateTime,
  Decimal,
  DispenseRequest,
  DocumentContent,
  DocumentReferenceContext: DocumentReferenceContextPartial,
  DocumentReferenceRelatesTo,
  Dosage,
  EncounterParticipant,
  EncounterHospitalization,
  EncounterDiagnosis,
  EncounterLocation,
  EncounterStatusHistory,
  EncounterClassHistory,
  Extension,
  HumanName,
  Identifier,
  Instant,
  Int,
  Integer,
  InvoiceLineItem,
  InvoicePriceComponent,
  Markdown,
  MarketingStatus,
  Meta,
  Money,
  NameValue,
  Narrative,
  ObservationReferenceRange,
  OperationOutcomeIssue,
  ParameterDefinition,
  PatientContact,
  Period,
  ProdCharacteristic,
  ProductShelfLife,
  Quantity,
  QuestionnaireResponseItem,
  Range: RangeField,
  Ratio,
  Reference,
  RelatedArtifact,
  ReverseReference,
  SampledData,
  String: StringField,
  SubscriptionChannel,
  SubscriptionStatusNotificationEvent,
  SubscriptionTopicCanFilterBy,
  SubscriptionTopicEventTrigger,
  SubscriptionTopicNotificationShape,
  SubscriptionTopicResourceTrigger,
  Time,
  Timing,
  TriggerDefinition,
  UnsignedInt,
  Uri,
  Url: UrlField,
  ActivityDefinitionDynamicValue,
  ActivityDefinitionParticipant,
  AdministrableProductDefinitionProperty,
  AdministrableProductDefinitionRouteOfAdministration,
  AllergyIntoleranceReaction,
  AppointmentParticipant,
  AuditEventAgent,
  AuditEventEntity,
  BiologicallyDerivedProductCollection,
  BiologicallyDerivedProductProcessing,
  BiologicallyDerivedProductStorage,
  BundleEntry,
  BundleLink,
  CapabilityStatementImplementation,
  CapabilityStatementRest,
  CapabilityStatementSoftware,
  CarePlanActivity,
  CareTeamParticipant,
  ChargeItemDefinitionApplicability,
  ChargeItemDefinitionPropertyGroup,
  CitationCitedArtifact,
  CitationClassification,
  CitationSummary,
  ClaimDiagnosis,
  ClaimItem,
  ClaimPayee,
  ClaimProcedure,
  ClaimResponseAdjudication,
  ClaimResponseError,
  ClaimResponseItem,
  ClaimResponsePayment,
  ClaimResponseTotal,
  ClinicalImpressionFinding,
  ClinicalImpressionInvestigation,
  ClinicalUseDefinitionContraindication,
  ClinicalUseDefinitionIndication,
  ClinicalUseDefinitionInteraction,
  ClinicalUseDefinitionUndesirableEffect,
  ClinicalUseDefinitionWarning,
  CodeSystemConcept,
  CodeSystemFilter,
  CodeSystemProperty,
  CommunicationPayload,
  CommunicationRequestPayload,
  CompartmentDefinitionResource,
  CompositionAttester,
  CompositionEvent,
  CompositionSection,
  ConceptMapGroup,
  ConditionStage,
  ConsentPolicy,
  ConsentProvision,
  ConsentVerification,
  ContractLegal,
  ContractTerm,
  CoverageEligibilityRequestItem,
  CoverageEligibilityResponseError,
  DetectedIssueEvidence,
  DetectedIssueMitigation,
  DeviceDefinitionUdiDeviceIdentifier,
  DeviceDeviceName,
  DeviceMetricCalibration,
  DeviceRequestParameter,
  DeviceUdiCarrier,
  EpisodeOfCareStatusHistory,
  EvidenceCertainty,
  EvidenceReportRelatesTo,
  EvidenceReportSection,
  EvidenceReportSubject,
  EvidenceStatistic,
  EvidenceVariableCategory,
  EvidenceVariableCharacteristic,
  EvidenceVariableDefinition,
  ExampleScenarioActor,
  ExampleScenarioInstance,
  ExampleScenarioProcess,
  ExplanationOfBenefitAdjudication,
  ExplanationOfBenefitBenefitBalance,
  ExplanationOfBenefitDiagnosis,
  ExplanationOfBenefitItem,
  ExplanationOfBenefitPayee,
  ExplanationOfBenefitPayment,
  ExplanationOfBenefitProcessNote,
  ExplanationOfBenefitTotal,
  FamilyMemberHistoryCondition,
  GoalTarget,
  GraphDefinitionLink,
  GroupCharacteristic,
  HealthcareServiceAvailableTime,
  HealthcareServiceEligibility,
  ImagingStudySeries,
  ImmunizationProtocolApplied,
  ImmunizationReaction,
  ImmunizationRecommendationRecommendation,
  ImplementationGuideDefinition,
  ImplementationGuideDependsOn,
  ImplementationGuideManifest,
  IngredientManufacturer,
  IngredientSubstance,
  InsurancePlanCoverage,
  InsurancePlanPlan,
  LocationHoursOfOperation,
  LocationPosition,
  MeasureGroup,
  MeasureReportGroup,
  MeasureSupplementalData,
  MedicationAdministrationDosage,
  MedicationBatch,
  MedicationDispenseSubstitution,
  MedicationIngredient,
  MedicationKnowledgeAdministrationGuidelines,
  MedicationKnowledgeDrugCharacteristic,
  MedicationKnowledgeIngredient,
  MedicationRequestDispenseRequest,
  MedicationRequestSubstitution,
  MedicinalProductDefinitionCharacteristic,
  MedicinalProductDefinitionName,
  MessageDefinitionFocus,
  MessageHeaderDestination,
  MessageHeaderResponse,
  MessageHeaderSource,
  MolecularSequenceQuality,
  MolecularSequenceReferenceSeq,
  MolecularSequenceStructureVariant,
  MolecularSequenceVariant,
  NutritionOrderEnteralFormula,
  NutritionOrderOralDiet,
  NutritionOrderSupplement,
  NutritionProductIngredient,
  NutritionProductNutrient,
  ObservationComponent,
  OperationDefinitionParameter,
  OrganizationContact,
  PackagedProductDefinitionPackage,
  ParametersParameter,
  PatientCommunication,
  PaymentReconciliationDetail,
  PaymentReconciliationProcessNote,
  PlanDefinitionAction,
  PlanDefinitionGoal,
  PractitionerQualification,
  PractitionerRoleAvailableTime,
  QuestionnaireItem,
  RegulatedAuthorizationCase,
  RelatedPersonCommunication,
  RequestGroupAction,
  ResearchElementDefinitionCharacteristic,
  ResearchStudyArm,
  ResearchStudyObjective,
  RiskAssessmentPrediction,
  SearchParameterComponent,
  SpecimenCollection,
  SpecimenContainer,
  SpecimenDefinitionTypeTested,
  StructureDefinitionDifferential,
  StructureDefinitionSnapshot,
  StructureMapGroup,
  StructureMapStructure,
  SubstanceDefinitionCode,
  SubstanceDefinitionName,
  SubstanceDefinitionStructure,
  SubstanceIngredient,
  SubstanceInstance,
  SupplyDeliverySuppliedItem,
  SupplyRequestParameter,
  TaskInput,
  TaskOutput,
  TaskRestriction,
  TerminologyCapabilitiesCodeSystem,
  TerminologyCapabilitiesSoftware,
  TestReportParticipant,
  TestReportSetup,
  TestReportTest,
  TestScriptSetup,
  TestScriptTest,
  TestScriptVariable,
  ValueSetCompose,
  ValueSetExpansion,
  VerificationResultAttestation,
  VerificationResultPrimarySource,
  VisionPrescriptionLensSpecification,
};
