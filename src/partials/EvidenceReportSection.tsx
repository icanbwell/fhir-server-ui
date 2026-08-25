import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEvidenceReportSection } from '../types/partials/EvidenceReportSection';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Narrative from './Narrative';

type TEvidenceReportSectionProps = TBaseResourceProps & {
  field?: string;
  section: TEvidenceReportSection | TEvidenceReportSection[] | undefined;
};

const EvidenceReportSection = ({ section, name, resourceType }: TEvidenceReportSectionProps) => {
  if (!section) {
    return null;
  }
  const values = Array.isArray(section) ? section : [section];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.title && <Typography component="div"><b>Title:</b>&nbsp;{value.title}</Typography>}
          {value.mode && <Typography component="div"><b>Mode:</b>&nbsp;{value.mode}</Typography>}
          <CodeableConcept codeableConcept={value.focus} name="Focus" resourceType={resourceType} />
          <Reference reference={value.focusReference} name="Focus Reference" resourceType={resourceType} />
          <Reference reference={value.author} name="Author" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.orderedBy} name="Ordered By" resourceType={resourceType} />
          <Narrative narrative={value.text} name="Text" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default EvidenceReportSection;
