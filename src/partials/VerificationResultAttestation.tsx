import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TVerificationResultAttestation } from '../types/partials/VerificationResultAttestation';
import Reference from './Reference';
import CodeableConcept from './CodeableConcept';

type TVerificationResultAttestationProps = TBaseResourceProps & {
  field?: string;
  attestation: TVerificationResultAttestation | TVerificationResultAttestation[] | undefined;
};

const VerificationResultAttestation = ({ attestation, name, resourceType }: TVerificationResultAttestationProps) => {
  if (!attestation) {
    return null;
  }
  const values = Array.isArray(attestation) ? attestation : [attestation];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Reference reference={value.who} name="Who" resourceType={resourceType} />
          <Reference reference={value.onBehalfOf} name="On Behalf Of" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.communicationMethod} name="Communication Method" resourceType={resourceType} />
          {value.date && <Typography component="div"><b>Date:</b>&nbsp;{String(value.date)}</Typography>}
          {value.sourceIdentityCertificate && (
            <Typography component="div"><b>Source Identity Certificate:</b>&nbsp;{value.sourceIdentityCertificate}</Typography>
          )}
          {value.proxyIdentityCertificate && (
            <Typography component="div"><b>Proxy Identity Certificate:</b>&nbsp;{value.proxyIdentityCertificate}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default VerificationResultAttestation;
