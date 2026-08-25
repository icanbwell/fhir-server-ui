import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TConsentPolicy } from '../types/partials/ConsentPolicy';
import Uri from './Uri';

type TConsentPolicyProps = TBaseResourceProps & {
  field?: string;
  policy: TConsentPolicy | TConsentPolicy[] | undefined;
};

const ConsentPolicy = ({ policy, name, resourceType }: TConsentPolicyProps) => {
  if (!policy) {
    return null;
  }
  const values = Array.isArray(policy) ? policy : [policy];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Uri uri={value.authority} name="Authority" resourceType={resourceType} />
          <Uri uri={value.uri} name="URI" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ConsentPolicy;
