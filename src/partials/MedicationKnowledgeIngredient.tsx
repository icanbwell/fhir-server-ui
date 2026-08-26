import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicationKnowledgeIngredient } from '../types/partials/MedicationKnowledgeIngredient';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Ratio from './Ratio';
import Boolean from './Boolean';

type TMedicationKnowledgeIngredientProps = TBaseResourceProps & {
  field?: string;
  ingredient: TMedicationKnowledgeIngredient | TMedicationKnowledgeIngredient[] | undefined;
};

const MedicationKnowledgeIngredientField = ({ ingredient, name, resourceType }: TMedicationKnowledgeIngredientProps) => {
  if (!ingredient) {
    return null;
  }
  const values = Array.isArray(ingredient) ? ingredient : [ingredient];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <CodeableConcept codeableConcept={value.itemCodeableConcept} name="Item" resourceType={resourceType} />
          <Reference reference={value.itemReference} name="Item Reference" resourceType={resourceType} />
          <Boolean boolean={value.isActive} name="Is Active" resourceType={resourceType} />
          <Ratio ratio={value.strength} name="Strength" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MedicationKnowledgeIngredientField;
