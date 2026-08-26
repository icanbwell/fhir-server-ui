import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TRiskAssessmentPrediction } from '../types/partials/RiskAssessmentPrediction';
import CodeableConcept from './CodeableConcept';
import Range from './Range';
import Period from './Period';

type TRiskAssessmentPredictionProps = TBaseResourceProps & {
  field?: string;
  prediction: TRiskAssessmentPrediction | TRiskAssessmentPrediction[] | undefined;
};

const RiskAssessmentPredictionField = ({ prediction, name, resourceType }: TRiskAssessmentPredictionProps) => {
  if (!prediction) {
    return null;
  }
  const values = Array.isArray(prediction) ? prediction : [prediction];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.outcome} name="Outcome" resourceType={resourceType} />
          {value.probabilityDecimal !== undefined && (
            <Typography component="div"><b>Probability:</b>&nbsp;{`${value.probabilityDecimal}`}</Typography>
          )}
          <Range range={value.probabilityRange} name="Probability Range" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.qualitativeRisk} name="Qualitative Risk" resourceType={resourceType} />
          {value.relativeRisk !== undefined && (
            <Typography component="div"><b>Relative Risk:</b>&nbsp;{`${value.relativeRisk}`}</Typography>
          )}
          <Period period={value.whenPeriod} name="When" resourceType={resourceType} />
          <Range range={value.whenRange} name="When" resourceType={resourceType} />
          {value.rationale && <Typography component="div"><b>Rationale:</b>&nbsp;{value.rationale}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default RiskAssessmentPredictionField;
