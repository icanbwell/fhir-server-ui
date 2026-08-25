import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TPractitionerRoleAvailableTime } from '../types/partials/PractitionerRoleAvailableTime';
import Time from './Time';

type TPractitionerRoleAvailableTimeProps = TBaseResourceProps & {
  field?: string;
  availableTime: TPractitionerRoleAvailableTime | TPractitionerRoleAvailableTime[] | undefined;
};

const PractitionerRoleAvailableTimeField = ({ availableTime, name, resourceType }: TPractitionerRoleAvailableTimeProps) => {
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
          {value.allDay !== undefined && (
            <Typography component="div"><b>All Day:</b>&nbsp;{value.allDay ? 'True' : 'False'}</Typography>
          )}
          <Time time={value.availableStartTime} name="Available Start Time" resourceType={resourceType} />
          <Time time={value.availableEndTime} name="Available End Time" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default PractitionerRoleAvailableTimeField;
