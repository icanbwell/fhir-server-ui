import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TLocationPosition } from '../types/partials/LocationPosition';

type TLocationPositionProps = TBaseResourceProps & {
  field?: string;
  position: TLocationPosition | TLocationPosition[] | undefined;
};

const LocationPositionField = ({ position, name }: TLocationPositionProps) => {
  if (!position) {
    return null;
  }
  const values = Array.isArray(position) ? position : [position];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Longitude:</b>&nbsp;{`${value.longitude}`}</Typography>
          <Typography component="div"><b>Latitude:</b>&nbsp;{`${value.latitude}`}</Typography>
          {value.altitude !== undefined && (
            <Typography component="div"><b>Altitude:</b>&nbsp;{`${value.altitude}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default LocationPositionField;
