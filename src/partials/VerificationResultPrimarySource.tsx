import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TVerificationResultPrimarySource } from '../types/partials/VerificationResultPrimarySource';
import Reference from './Reference';
import CodeableConcept from './CodeableConcept';

type TVerificationResultPrimarySourceProps = TBaseResourceProps & {
  field?: string;
  primarySource: TVerificationResultPrimarySource | TVerificationResultPrimarySource[] | undefined;
};

const VerificationResultPrimarySource = ({ primarySource, name, resourceType }: TVerificationResultPrimarySourceProps) => {
  if (!primarySource) {
    return null;
  }
  const values = Array.isArray(primarySource) ? primarySource : [primarySource];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Reference reference={value.who} name="Who" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.communicationMethod} name="Communication Method" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.validationStatus} name="Validation Status" resourceType={resourceType} />
          {value.validationDate && (
            <Typography component="div"><b>Validation Date:</b>&nbsp;{String(value.validationDate)}</Typography>
          )}
          <CodeableConcept codeableConcept={value.canPushUpdates} name="Can Push Updates" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default VerificationResultPrimarySource;
