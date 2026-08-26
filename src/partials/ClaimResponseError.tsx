import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClaimResponseError } from '../types/partials/ClaimResponseError';
import CodeableConcept from './CodeableConcept';
import Int from './Int';

type TClaimResponseErrorProps = TBaseResourceProps & {
  field?: string;
  error: TClaimResponseError | TClaimResponseError[] | undefined;
};

const ClaimResponseError = ({ error, name, resourceType }: TClaimResponseErrorProps) => {
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
          <Int int={value.itemSequence} name="Item Sequence" resourceType={resourceType} />
          <Int int={value.detailSequence} name="Detail Sequence" resourceType={resourceType} />
          <Int int={value.subDetailSequence} name="Sub Detail Sequence" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClaimResponseError;
