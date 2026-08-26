import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TImmunizationReaction } from '../types/partials/ImmunizationReaction';
import DateTime from './DateTime';
import Reference from './Reference';
import Boolean from './Boolean';

type TImmunizationReactionProps = TBaseResourceProps & {
  field?: string;
  reaction: TImmunizationReaction | TImmunizationReaction[] | undefined;
};

const ImmunizationReactionField = ({ reaction, name, resourceType }: TImmunizationReactionProps) => {
  if (!reaction) {
    return null;
  }
  const values = Array.isArray(reaction) ? reaction : [reaction];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <DateTime dateTime={value.date} name="Date" resourceType={resourceType} />
          <Reference reference={value.detail} name="Detail" resourceType={resourceType} />
          <Boolean boolean={value.reported} name="Reported" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ImmunizationReactionField;
