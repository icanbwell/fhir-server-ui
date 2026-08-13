import {
  VerticalTimeline as OriginalVerticalTimeline,
  VerticalTimelineElement as OriginalVerticalTimelineElement,
} from 'react-vertical-timeline-component';
// set to any: https://github.com/stephane-monnot/react-vertical-timeline/issues/171
const VerticalTimeline: any = OriginalVerticalTimeline;
const VerticalTimelineElement: any = OriginalVerticalTimelineElement;
import 'react-vertical-timeline-component/style.min.css';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import SettingsAccessibilityIcon from '@mui/icons-material/SettingsAccessibility';
import MedicationIcon from '@mui/icons-material/Medication';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BiotechIcon from '@mui/icons-material/Biotech';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

function getIcon(patientEvent: any) {
  // https://mui.com/material-ui/material-icons/
  switch (patientEvent.resourceType) {
    case 'Patient':
      return <SettingsAccessibilityIcon />;
    case 'Condition':
      return <HealthAndSafetyIcon />;
    case 'Observation':
      return <BiotechIcon />;
    case 'Immunization':
      return <VaccinesIcon />;
    case 'ExplanationOfBenefit':
    case 'Coverage':
      return <AttachMoneyIcon />;
    case 'MedicationDispense':
    case 'MedicationRequest':
      return <MedicationIcon />;
    default:
      return <MedicalInformationIcon />;
  }
}

const renderTimelineElements = (patientEvents: any) => {
  return patientEvents.map((patientEvent: any, index: number) => (
    <VerticalTimelineElement
      className="vertical-timeline-element--work"
      contentStyle={{ background: '#2E3586', color: '#fff' }}
      contentArrowStyle={{ borderRight: '7px solid #2E3586' }}
      key={index}
      date={patientEvent.date}
      iconStyle={{ background: '#2E3586', color: '#fff' }}
      icon={getIcon(patientEvent)}
    >
      <h3 className="vertical-timeline-element-title">
        {patientEvent.resourceType}
      </h3>
      <p className="vertical-timeline-element-subtitle">{patientEvent.event}</p>
      <p>{`${patientEvent.eventSummary}`}</p>
    </VerticalTimelineElement>
  ));
};

/**
 * create a timeline of all the events in this person's health record in one list sorted by date of the event.  Return the result in the following json format: { "date", "event", "resourceType", "eventSummary"}.  First create a list, convert event date into a date format and then sort it by the date of the event in ascending order.  Make sure your sorting is correct.
 */
const patientEvents = [
  {
    date: '1983-12-01',
    event: 'Birth Date',
    resourceType: 'Patient',
    eventSummary: 'Patient was born on December 1, 1983.',
  },
  {
    date: '2019-01-15',
    event: 'Diagnosis',
    resourceType: 'Encounter',
    eventSummary: 'Patient diagnosed with pneumonia',
  },
  {
    date: '2019-02-03',
    event: 'Medication Prescription',
    resourceType: 'MedicationRequest',
    eventSummary: 'Prescription for antibiotics to treat pneumonia.',
  },
  {
    date: '2019-02-10',
    event: 'Follow-up Appointment',
    resourceType: 'Appointment',
    eventSummary:
      'Patient scheduled for a follow-up appointment to monitor pneumonia treatment.',
  },
  {
    date: '2019-03-05',
    event: 'Laboratory Test',
    resourceType: 'DiagnosticReport',
    eventSummary: 'Blood test results show improvement in pneumonia infection.',
  },
  {
    date: '2019-03-15',
    event: 'Discharge',
    resourceType: 'Encounter',
    eventSummary:
      'Patient discharged from hospital after successful treatment of pneumonia.',
  },
];

const PatientTimeline = () => {
  return (
    <VerticalTimeline>{renderTimelineElements(patientEvents)}</VerticalTimeline>
  );
};

export default PatientTimeline;
