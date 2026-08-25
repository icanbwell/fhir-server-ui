import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TNutritionProductNutrient } from '../types/partials/NutritionProductNutrient';
import CodeableReference from './CodeableReference';
import Ratio from './Ratio';

type TNutritionProductNutrientProps = TBaseResourceProps & {
  field?: string;
  nutrient: TNutritionProductNutrient | TNutritionProductNutrient[] | undefined;
};

const NutritionProductNutrientField = ({ nutrient, name, resourceType }: TNutritionProductNutrientProps) => {
  if (!nutrient) {
    return null;
  }
  const values = Array.isArray(nutrient) ? nutrient : [nutrient];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableReference codeableReference={value.item} name="Item" resourceType={resourceType} />
          {value.amount &&
            value.amount.map((ratio, ratioIndex) => (
              <Ratio key={ratioIndex} ratio={ratio} name="Amount" resourceType={resourceType} />
            ))}
        </Box>
      ))}
    </Box>
  );
};

export default NutritionProductNutrientField;
