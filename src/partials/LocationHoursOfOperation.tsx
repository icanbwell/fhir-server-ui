import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TLocationHoursOfOperation } from '../types/partials/LocationHoursOfOperation';
import Boolean from './Boolean';

type TLocationHoursOfOperationProps = TBaseResourceProps & {
  field?: string;
  hoursOfOperation: TLocationHoursOfOperation | TLocationHoursOfOperation[] | undefined;
};

const LocationHoursOfOperationField = ({ hoursOfOperation, name, resourceType }: TLocationHoursOfOperationProps) => {
  if (!hoursOfOperation) {
    return null;
  }
  const values = Array.isArray(hoursOfOperation) ? hoursOfOperation : [hoursOfOperation];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.daysOfWeek && value.daysOfWeek.length > 0 && (
            <Typography component="div"><b>Days of Week:</b>&nbsp;{value.daysOfWeek.join(', ')}</Typography>
          )}
          <Boolean boolean={value.allDay} name="All Day" resourceType={resourceType} />
          {value.openingTime && <Typography component="div"><b>Opening Time:</b>&nbsp;{value.openingTime}</Typography>}
          {value.closingTime && <Typography component="div"><b>Closing Time:</b>&nbsp;{value.closingTime}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default LocationHoursOfOperationField;
