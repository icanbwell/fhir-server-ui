import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TNutritionOrderEnteralFormula } from '../types/partials/NutritionOrderEnteralFormula';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';

type TNutritionOrderEnteralFormulaProps = TBaseResourceProps & {
  field?: string;
  enteralFormula: TNutritionOrderEnteralFormula | TNutritionOrderEnteralFormula[] | undefined;
};

const NutritionOrderEnteralFormulaField = ({ enteralFormula, name, resourceType }: TNutritionOrderEnteralFormulaProps) => {
  if (!enteralFormula) {
    return null;
  }
  const values = Array.isArray(enteralFormula) ? enteralFormula : [enteralFormula];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.baseFormulaType} name="Base Formula Type" resourceType={resourceType} />
          {value.baseFormulaProductName && (
            <Typography component="div"><b>Base Formula Product Name:</b>&nbsp;{`${value.baseFormulaProductName}`}</Typography>
          )}
          <CodeableConcept codeableConcept={value.additiveType} name="Additive Type" resourceType={resourceType} />
          {value.additiveProductName && (
            <Typography component="div"><b>Additive Product Name:</b>&nbsp;{`${value.additiveProductName}`}</Typography>
          )}
          <Quantity quantity={value.caloricDensity} name="Caloric Density" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.routeofAdministration} name="Route of Administration" resourceType={resourceType} />
          <Quantity quantity={value.maxVolumeToDeliver} name="Max Volume To Deliver" resourceType={resourceType} />
          {value.administrationInstruction && (
            <Typography component="div"><b>Administration Instruction:</b>&nbsp;{`${value.administrationInstruction}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default NutritionOrderEnteralFormulaField;
