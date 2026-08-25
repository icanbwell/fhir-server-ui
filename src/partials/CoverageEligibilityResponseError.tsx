import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCoverageEligibilityResponseError } from '../types/partials/CoverageEligibilityResponseError';
import CodeableConcept from './CodeableConcept';

type TCoverageEligibilityResponseErrorProps = TBaseResourceProps & {
  field?: string;
  error: TCoverageEligibilityResponseError | TCoverageEligibilityResponseError[] | undefined;
};

const CoverageEligibilityResponseError = ({ error, name, resourceType }: TCoverageEligibilityResponseErrorProps) => {
  if (!error) {
    return null;
  }
  const values = Array.isArray(error) ? error : [error];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CoverageEligibilityResponseError;
