import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCareTeamParticipant } from '../types/partials/CareTeamParticipant';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Period from './Period';

type TCareTeamParticipantProps = TBaseResourceProps & {
  field?: string;
  participant: TCareTeamParticipant | TCareTeamParticipant[] | undefined;
};

const CareTeamParticipant = ({ participant, name, resourceType }: TCareTeamParticipantProps) => {
  if (!participant) {
    return null;
  }
  const values = Array.isArray(participant) ? participant : [participant];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.role} name="Role" resourceType={resourceType} />
          <Reference reference={value.member} name="Member" resourceType={resourceType} />
          <Reference reference={value.onBehalfOf} name="On Behalf Of" resourceType={resourceType} />
          <Period period={value.period} name="Period" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CareTeamParticipant;
