import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClaimResponsePayment } from '../types/partials/ClaimResponsePayment';
import CodeableConcept from './CodeableConcept';
import Money from './Money';
import DateField from './Date';
import Identifier from './Identifier';

type TClaimResponsePaymentProps = TBaseResourceProps & {
  field?: string;
  payment: TClaimResponsePayment | TClaimResponsePayment[] | undefined;
};

const ClaimResponsePayment = ({ payment, name, resourceType }: TClaimResponsePaymentProps) => {
  if (!payment) {
    return null;
  }
  const values = Array.isArray(payment) ? payment : [payment];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Money money={value.amount} name="Amount" resourceType={resourceType} />
          <Money money={value.adjustment} name="Adjustment" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.adjustmentReason} name="Adjustment Reason" resourceType={resourceType} />
          <DateField date={value.date} name="Date" resourceType={resourceType} />
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClaimResponsePayment;
