import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { THealthcareServiceEligibility } from '../types/partials/HealthcareServiceEligibility';
import CodeableConcept from './CodeableConcept';

type THealthcareServiceEligibilityProps = TBaseResourceProps & {
  field?: string;
  eligibility: THealthcareServiceEligibility | THealthcareServiceEligibility[] | undefined;
};

const HealthcareServiceEligibility = ({ eligibility, name, resourceType }: THealthcareServiceEligibilityProps) => {
  if (!eligibility) {
    return null;
  }
  const values = Array.isArray(eligibility) ? eligibility : [eligibility];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          {value.comment && <Typography component="div"><b>Comment:</b>&nbsp;{`${value.comment}`}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default HealthcareServiceEligibility;
