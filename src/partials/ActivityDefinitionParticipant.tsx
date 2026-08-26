import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TActivityDefinitionParticipant } from '../types/partials/ActivityDefinitionParticipant';
import CodeableConcept from './CodeableConcept';

type TActivityDefinitionParticipantProps = TBaseResourceProps & {
  field?: string;
  participant: TActivityDefinitionParticipant | TActivityDefinitionParticipant[] | undefined;
};

const ActivityDefinitionParticipant = ({ participant, name, resourceType }: TActivityDefinitionParticipantProps) => {
  if (!participant) {
    return null;
  }
  const values = Array.isArray(participant) ? participant : [participant];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.type && <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>}
          <CodeableConcept codeableConcept={value.role} name="Role" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ActivityDefinitionParticipant;
