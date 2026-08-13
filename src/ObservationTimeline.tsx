import {
  VerticalTimeline as OriginalVerticalTimeline,
  VerticalTimelineElement as OriginalVerticalTimelineElement,
} from 'react-vertical-timeline-component';
// set to any: https://github.com/stephane-monnot/react-vertical-timeline/issues/171
const VerticalTimeline: any = OriginalVerticalTimeline;
const VerticalTimelineElement: any = OriginalVerticalTimelineElement;

import 'react-vertical-timeline-component/style.min.css';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';

const renderTimelineElements = (observations: any) => {
  return observations.map((observation: any, index: number) => (
    <VerticalTimelineElement
      className="vertical-timeline-element--work"
      contentStyle={{ background: '#2E3586', color: '#fff' }}
      contentArrowStyle={{ borderRight: '7px solid #2E3586' }}
      key={index}
      date={observation.date}
      iconStyle={{ background: '#2E3586', color: '#fff' }}
      icon={<MedicalInformationIcon />}
    >
      <h3 className="vertical-timeline-element-title">{observation.code}</h3>
      <p className="vertical-timeline-element-subtitle">
        {observation.category}
      </p>
      <p>{`Value: ${observation.value}`}</p>
    </VerticalTimelineElement>
  ));
};

const observations = [
  {
    date: 'May 26, 2022',
    category: 'Laboratory',
    code: 'Total score [DAST-10] (LOINC code: 82667-7)',
    value: 2,
  },
  {
    date: 'May 9, 2019',
    category: 'Laboratory',
    code: 'Total score [DAST-10] (LOINC code: 82667-7)',
    value: 1,
  },
  {
    date: 'May 3, 2018',
    category: 'Laboratory',
    code: 'Total score [DAST-10] (LOINC code: 82667-7)',
    value: 2,
  },
];

const ObservationTimeline = () => {
  return (
    <VerticalTimeline>{renderTimelineElements(observations)}</VerticalTimeline>
  );
};

export default ObservationTimeline;
