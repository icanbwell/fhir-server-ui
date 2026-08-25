import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TNutritionOrderOralDiet } from '../types/partials/NutritionOrderOralDiet';
import CodeableConcept from './CodeableConcept';
import Timing from './Timing';

type TNutritionOrderOralDietProps = TBaseResourceProps & {
  field?: string;
  oralDiet: TNutritionOrderOralDiet | TNutritionOrderOralDiet[] | undefined;
};

const NutritionOrderOralDietField = ({ oralDiet, name, resourceType }: TNutritionOrderOralDietProps) => {
  if (!oralDiet) {
    return null;
  }
  const values = Array.isArray(oralDiet) ? oralDiet : [oralDiet];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Timing timing={value.schedule} name="Schedule" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.fluidConsistencyType} name="Fluid Consistency Type" resourceType={resourceType} />
          {value.instruction && (
            <Typography component="div"><b>Instruction:</b>&nbsp;{`${value.instruction}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default NutritionOrderOralDietField;
