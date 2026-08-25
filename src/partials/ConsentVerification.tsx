import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TConsentVerification } from '../types/partials/ConsentVerification';
import DateTime from './DateTime';
import Reference from './Reference';

type TConsentVerificationProps = TBaseResourceProps & {
  field?: string;
  verification: TConsentVerification | TConsentVerification[] | undefined;
};

const ConsentVerification = ({ verification, name, resourceType }: TConsentVerificationProps) => {
  if (!verification) {
    return null;
  }
  const values = Array.isArray(verification) ? verification : [verification];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.verified !== undefined && (
            <Typography component="div"><b>Verified:</b>&nbsp;{value.verified ? 'True' : 'False'}</Typography>
          )}
          <Reference reference={value.verifiedWith} name="Verified With" resourceType={resourceType} />
          <DateTime dateTime={value.verificationDate} name="Verification Date" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ConsentVerification;
