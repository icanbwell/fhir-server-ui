import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { THealthcareServiceAvailableTime } from '../types/partials/HealthcareServiceAvailableTime';

type THealthcareServiceAvailableTimeProps = TBaseResourceProps & {
  field?: string;
  availableTime: THealthcareServiceAvailableTime | THealthcareServiceAvailableTime[] | undefined;
};

const HealthcareServiceAvailableTime = ({ availableTime, name }: THealthcareServiceAvailableTimeProps) => {
  if (!availableTime) {
    return null;
  }
  const values = Array.isArray(availableTime) ? availableTime : [availableTime];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.daysOfWeek && value.daysOfWeek.length > 0 && (
            <Typography component="div"><b>Days Of Week:</b>&nbsp;{value.daysOfWeek.join(', ')}</Typography>
          )}
          {value.allDay !== undefined && value.allDay !== null && (
            <Typography component="div"><b>All Day:</b>&nbsp;{value.allDay ? 'True' : 'False'}</Typography>
          )}
          {value.availableStartTime && <Typography component="div"><b>Available Start Time:</b>&nbsp;{`${value.availableStartTime}`}</Typography>}
          {value.availableEndTime && <Typography component="div"><b>Available End Time:</b>&nbsp;{`${value.availableEndTime}`}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default HealthcareServiceAvailableTime;
