import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCompositionEvent } from '../types/partials/CompositionEvent';
import CodeableConcept from './CodeableConcept';
import Period from './Period';
import Reference from './Reference';

type TCompositionEventProps = TBaseResourceProps & {
  field?: string;
  event: TCompositionEvent | TCompositionEvent[] | undefined;
};

const CompositionEvent = ({ event, name, resourceType }: TCompositionEventProps) => {
  if (!event) {
    return null;
  }
  const values = Array.isArray(event) ? event : [event];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <Period period={value.period} name="Period" resourceType={resourceType} />
          <Reference reference={value.detail} name="Detail" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CompositionEvent;
