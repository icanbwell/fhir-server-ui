import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClaimPayee } from '../types/partials/ClaimPayee';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TClaimPayeeProps = TBaseResourceProps & {
  field?: string;
  payee: TClaimPayee | TClaimPayee[] | undefined;
};

const ClaimPayee = ({ payee, name, resourceType }: TClaimPayeeProps) => {
  if (!payee) {
    return null;
  }
  const values = Array.isArray(payee) ? payee : [payee];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Reference reference={value.party} name="Party" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClaimPayee;
