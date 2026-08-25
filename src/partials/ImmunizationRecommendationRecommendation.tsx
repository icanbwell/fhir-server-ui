import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TImmunizationRecommendationRecommendation } from '../types/partials/ImmunizationRecommendationRecommendation';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TImmunizationRecommendationRecommendationProps = TBaseResourceProps & {
  field?: string;
  recommendation: TImmunizationRecommendationRecommendation | TImmunizationRecommendationRecommendation[] | undefined;
};

const ImmunizationRecommendationRecommendationField = ({
  recommendation,
  name,
  resourceType,
}: TImmunizationRecommendationRecommendationProps) => {
  if (!recommendation) {
    return null;
  }
  const values = Array.isArray(recommendation) ? recommendation : [recommendation];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.vaccineCode} name="Vaccine Code" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.targetDisease} name="Target Disease" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.forecastStatus} name="Forecast Status" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.forecastReason} name="Forecast Reason" resourceType={resourceType} />
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          {value.series && <Typography component="div"><b>Series:</b>&nbsp;{value.series}</Typography>}
          <Reference reference={value.supportingImmunization} name="Supporting Immunization" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ImmunizationRecommendationRecommendationField;
