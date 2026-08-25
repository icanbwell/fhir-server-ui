import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSubstanceInstance } from '../types/partials/SubstanceInstance';
import Identifier from './Identifier';
import DateTime from './DateTime';
import Quantity from './Quantity';

type TSubstanceInstanceProps = TBaseResourceProps & {
  field?: string;
  instance: TSubstanceInstance | TSubstanceInstance[] | undefined;
};

const SubstanceInstanceField = ({ instance, name, resourceType }: TSubstanceInstanceProps) => {
  if (!instance) {
    return null;
  }
  const values = Array.isArray(instance) ? instance : [instance];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
          <DateTime dateTime={value.expiry} name="Expiry" resourceType={resourceType} />
          <Quantity quantity={value.quantity} name="Quantity" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default SubstanceInstanceField;
