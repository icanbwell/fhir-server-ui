import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEvidenceReportSubject } from '../types/partials/EvidenceReportSubject';
import Annotation from './Annotation';

type TEvidenceReportSubjectProps = TBaseResourceProps & {
  field?: string;
  subject: TEvidenceReportSubject | TEvidenceReportSubject[] | undefined;
};

const EvidenceReportSubject = ({ subject, name, resourceType }: TEvidenceReportSubjectProps) => {
  if (!subject) {
    return null;
  }
  const values = Array.isArray(subject) ? subject : [subject];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.characteristic && value.characteristic.length > 0 && (
            <Typography component="div"><b>Characteristics:</b>&nbsp;{value.characteristic.length}</Typography>
          )}
          <Annotation annotation={value.note} name="Notes" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default EvidenceReportSubject;
