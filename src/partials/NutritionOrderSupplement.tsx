import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TNutritionOrderSupplement } from '../types/partials/NutritionOrderSupplement';
import CodeableConcept from './CodeableConcept';
import Timing from './Timing';
import Quantity from './Quantity';

type TNutritionOrderSupplementProps = TBaseResourceProps & {
  field?: string;
  supplement: TNutritionOrderSupplement | TNutritionOrderSupplement[] | undefined;
};

const NutritionOrderSupplementField = ({ supplement, name, resourceType }: TNutritionOrderSupplementProps) => {
  if (!supplement) {
    return null;
  }
  const values = Array.isArray(supplement) ? supplement : [supplement];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          {value.productName && (
            <Typography component="div"><b>Product Name:</b>&nbsp;{`${value.productName}`}</Typography>
          )}
          <Timing timing={value.schedule} name="Schedule" resourceType={resourceType} />
          <Quantity quantity={value.quantity} name="Quantity" resourceType={resourceType} />
          {value.instruction && (
            <Typography component="div"><b>Instruction:</b>&nbsp;{`${value.instruction}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default NutritionOrderSupplementField;
