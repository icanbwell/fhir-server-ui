import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TRelatedPersonCommunication } from '../types/partials/RelatedPersonCommunication';
import CodeableConcept from './CodeableConcept';

type TRelatedPersonCommunicationProps = TBaseResourceProps & {
  field?: string;
  communication: TRelatedPersonCommunication | TRelatedPersonCommunication[] | undefined;
};

const RelatedPersonCommunicationField = ({ communication, name, resourceType }: TRelatedPersonCommunicationProps) => {
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

export default RelatedPersonCommunicationField;
