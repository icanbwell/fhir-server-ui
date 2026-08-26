import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TIngredientSubstance } from '../types/partials/IngredientSubstance';
import CodeableReference from './CodeableReference';
import Ratio from './Ratio';
import CodeableConcept from './CodeableConcept';

type TIngredientSubstanceProps = TBaseResourceProps & {
  field?: string;
  substance: TIngredientSubstance | TIngredientSubstance[] | undefined;
};

const IngredientSubstanceField = ({ substance, name, resourceType }: TIngredientSubstanceProps) => {
  if (!substance) {
    return null;
  }
  const values = Array.isArray(substance) ? substance : [substance];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableReference codeableReference={value.code} name="Code" resourceType={resourceType} />
          {value.strength && value.strength.length > 0 && (
            <Box sx={{ mb: 1 }}>
              {value.strength.map((s, sIndex) => (
                <Box key={sIndex}>
                  <Ratio ratio={s.presentationRatio} name="Presentation Ratio" resourceType={resourceType} />
                  <Ratio ratio={s.concentrationRatio} name="Concentration Ratio" resourceType={resourceType} />
                  {s.textPresentation && (
                    <Typography component="div"><b>Text Presentation:</b>&nbsp;{s.textPresentation}</Typography>
                  )}
                  {s.textConcentration && (
                    <Typography component="div"><b>Text Concentration:</b>&nbsp;{s.textConcentration}</Typography>
                  )}
                  <CodeableConcept codeableConcept={s.country} name="Country" resourceType={resourceType} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default IngredientSubstanceField;
