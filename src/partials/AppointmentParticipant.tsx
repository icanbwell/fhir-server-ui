import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TAppointmentParticipant } from '../types/partials/AppointmentParticipant';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Period from './Period';

type TAppointmentParticipantProps = TBaseResourceProps & {
  field?: string;
  participant: TAppointmentParticipant | TAppointmentParticipant[] | undefined;
};

const AppointmentParticipant = ({ participant, name, resourceType }: TAppointmentParticipantProps) => {
  if (!participant) {
    return null;
  }
  const values = Array.isArray(participant) ? participant : [participant];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Reference reference={value.actor} name="Actor" resourceType={resourceType} />
          {value.required && <Typography component="div"><b>Required:</b>&nbsp;{value.required}</Typography>}
          {value.status && <Typography component="div"><b>Status:</b>&nbsp;{value.status}</Typography>}
          <Period period={value.period} name="Period" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default AppointmentParticipant;
