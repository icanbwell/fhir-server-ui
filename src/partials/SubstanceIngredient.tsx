import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSubstanceIngredient } from '../types/partials/SubstanceIngredient';
import Ratio from './Ratio';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TSubstanceIngredientProps = TBaseResourceProps & {
  field?: string;
  ingredient: TSubstanceIngredient | TSubstanceIngredient[] | undefined;
};

const SubstanceIngredientField = ({ ingredient, name, resourceType }: TSubstanceIngredientProps) => {
  if (!ingredient) {
    return null;
  }
  const values = Array.isArray(ingredient) ? ingredient : [ingredient];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Ratio ratio={value.quantity} name="Quantity" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.substanceCodeableConcept} name="Substance" resourceType={resourceType} />
          <Reference reference={value.substanceReference} name="Substance Reference" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default SubstanceIngredientField;
