import Practitioner from '../pages/resources/Practitioner';
import Patient from '../pages/resources/Patient';
import Account from '../pages/resources/Account';
import ActivityDefinition from '../pages/resources/ActivityDefinition';
import AllergyIntolerance from '../pages/resources/AllergyIntolerance';
import ChargeItem from '../pages/resources/ChargeItem';
import DocumentReference from '../pages/resources/DocumentReference';
import Appointment from '../pages/resources/Appointment';
import AuditEvent from '../pages/resources/AuditEvent';
import Communication from '../pages/resources/Communication';
import Encounter from '../pages/resources/Encounter';
import InsurancePlan from '../pages/resources/InsurancePlan';
import Invoice from '../pages/resources/Invoice';
import Library from '../pages/resources/Library';
import Measure from '../pages/resources/Measure';
import Medication from '../pages/resources/Medication';
import MedicationAdministration from '../pages/resources/MedicationAdministration';
import MedicationDispense from '../pages/resources/MedicationDispense';
import MedicationRequest from '../pages/resources/MedicationRequest';
import Observation from '../pages/resources/Observation';
import Condition from '../pages/resources/Condition';
import Consent from '../pages/resources/Consent';
import Coverage from '../pages/resources/Coverage';
import ExplanationOfBenefit from '../pages/resources/ExplanationOfBenefit';
import HealthcareService from '../pages/resources/HealthcareService';
import Immunization from '../pages/resources/Immunization';
import Location from '../pages/resources/Location';
import MeasureReport from '../pages/resources/MeasureReport';
import MedicationStatement from '../pages/resources/MedicationStatement';
import Organization from '../pages/resources/Organization';
import OrganizationAffiliation from '../pages/resources/OrganizationAffiliation';
import Person from '../pages/resources/Person';
import PractitionerRole from '../pages/resources/PractitionerRole';
import Procedure from '../pages/resources/Procedure';
import QuestionnaireResponse from '../pages/resources/QuestionnaireResponse';
import Schedule from '../pages/resources/Schedule';
import ServiceRequest from '../pages/resources/ServiceRequest';
import Slot from '../pages/resources/Slot';
import Task from '../pages/resources/Task';
import ValueSet from '../pages/resources/ValueSet';
import DomainResource from '../pages/resources/DomainResource';
import OperationOutcome from '../pages/resources/OperationOutcome';

type TResourceItemProps = {
  resourceType: String|undefined;
  resource: any;
};

function ResourceItem({ resourceType, resource }: TResourceItemProps) {
  console.log(`ResourceItem: resourceType=${resourceType}`);
  switch (resourceType) {
    case 'Account':
      return <Account resource={resource}/>;
    case 'ActivityDefinition':
      return <ActivityDefinition resource={resource}/>;
    case 'AllergyIntolerance':
      return <AllergyIntolerance resource={resource}/>;
    case 'Appointment':
      return <Appointment resource={resource}/>;
    case 'AuditEvent':
      return <AuditEvent resource={resource}/>;
    case 'DocumentReference':
      return <DocumentReference resource={resource}/>;
    case 'ChargeItem':
      return <ChargeItem resource={resource}/>;
    case 'Communication':
      return <Communication resource={resource}/>;
    case 'Condition':
      return <Condition resource={resource}/>;
    case 'Consent':
      return <Consent resource={resource}/>;
    case 'Coverage':
      return <Coverage resource={resource}/>;
    case 'Encounter':
      return <Encounter resource={resource}/>;
    case 'ExplanationOfBenefit':
      return <ExplanationOfBenefit resource={resource}/>;
    case 'HealthcareService':
      return <HealthcareService resource={resource}/>;
    case 'Immunization':
      return <Immunization resource={resource}/>;
    case 'InsurancePlan':
      return <InsurancePlan resource={resource}/>;
    case 'Invoice':
      return <Invoice resource={resource}/>;
    case 'Library':
      return <Library resource={resource}/>;
    case 'Location':
      return <Location resource={resource}/>;
    case 'Measure':
      return <Measure resource={resource}/>;
    case 'MeasureReport':
      return <MeasureReport resource={resource}/>;
    case 'Medication':
      return <Medication resource={resource}/>;
    case 'MedicationAdministration':
      return <MedicationAdministration resource={resource}/>;
    case 'MedicationDispense':
      return <MedicationDispense resource={resource}/>;
    case 'MedicationRequest':
      return <MedicationRequest resource={resource}/>;
    case 'MedicationStatement':
      return <MedicationStatement resource={resource}/>;
    case 'Observation':
      return <Observation resource={resource}/>;
    case 'OperationOutcome':
      return <OperationOutcome resource={resource}/>;
    case 'Organization':
      return <Organization resource={resource}/>;
    case 'OrganizationAffiliation':
      return <OrganizationAffiliation resource={resource}/>;
    case 'Patient':
      return <Patient resource={resource}/>;
    case 'Person':
      return <Person resource={resource}/>;
    case 'Practitioner':
      return <Practitioner resource={resource}/>;
    case 'PractitionerRole':
      return <PractitionerRole resource={resource}/>;
    case 'Procedure':
      return <Procedure resource={resource}/>;
    case 'QuestionnaireResponse':
      return <QuestionnaireResponse resource={resource}/>;
    case 'Schedule':
      return <Schedule resource={resource}/>;
    case 'ServiceRequest':
      return <ServiceRequest resource={resource}/>;
    case 'Slot':
      return <Slot resource={resource}/>;
    case 'Task':
      return <Task resource={resource}/>;
    case 'ValueSet':
      return <ValueSet resource={resource}/>;
    default:
      return <DomainResource resource={resource}/>;
  }
}

export default ResourceItem;
