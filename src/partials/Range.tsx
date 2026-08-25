import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TRange } from '../types/partials/Range';
import Quantity from './Quantity';

type TRangeProps = TBaseResourceProps & {
  range: TRange | TRange[] | undefined;
};

const RangeField = ({ range, name, resourceType }: TRangeProps) => {
  if (!range) {
    return null;
  }
  const values = Array.isArray(range) ? range : [range];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index}>
          <Quantity quantity={value.low} name="Low" resourceType={resourceType} />
          <Quantity quantity={value.high} name="High" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default RangeField;
