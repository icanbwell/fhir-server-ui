import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEvidenceVariableCategory } from '../types/partials/EvidenceVariableCategory';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Range from './Range';

type TEvidenceVariableCategoryProps = TBaseResourceProps & {
  field?: string;
  category: TEvidenceVariableCategory | TEvidenceVariableCategory[] | undefined;
};

const EvidenceVariableCategory = ({ category, name, resourceType }: TEvidenceVariableCategoryProps) => {
  if (!category) {
    return null;
  }
  const values = Array.isArray(category) ? category : [category];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          <CodeableConcept codeableConcept={value.valueCodeableConcept} name="Value Codeable Concept" resourceType={resourceType} />
          <Quantity quantity={value.valueQuantity} name="Value Quantity" resourceType={resourceType} />
          <Range range={value.valueRange} name="Value Range" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default EvidenceVariableCategory;
