import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TPatientCommunication } from '../types/partials/PatientCommunication';
import CodeableConcept from './CodeableConcept';

type TPatientCommunicationProps = TBaseResourceProps & {
  field?: string;
  communication: TPatientCommunication | TPatientCommunication[] | undefined;
};

const PatientCommunicationField = ({ communication, name, resourceType }: TPatientCommunicationProps) => {
  if (!communication) {
    return null;
  }
  const values = Array.isArray(communication) ? communication : [communication];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.language} name="Language" resourceType={resourceType} />
          {value.preferred !== undefined && (
            <Typography component="div"><b>Preferred:</b>&nbsp;{value.preferred ? 'True' : 'False'}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default PatientCommunicationField;
