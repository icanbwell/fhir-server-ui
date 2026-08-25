import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TNutritionProductIngredient } from '../types/partials/NutritionProductIngredient';
import CodeableReference from './CodeableReference';
import Ratio from './Ratio';

type TNutritionProductIngredientProps = TBaseResourceProps & {
  field?: string;
  ingredient: TNutritionProductIngredient | TNutritionProductIngredient[] | undefined;
};

const NutritionProductIngredientField = ({ ingredient, name, resourceType }: TNutritionProductIngredientProps) => {
  if (!ingredient) {
    return null;
  }
  const values = Array.isArray(ingredient) ? ingredient : [ingredient];

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

export default NutritionProductIngredientField;
