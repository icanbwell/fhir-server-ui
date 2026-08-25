import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExplanationOfBenefitPayment } from '../types/partials/ExplanationOfBenefitPayment';
import CodeableConcept from './CodeableConcept';
import Money from './Money';
import Identifier from './Identifier';

type TExplanationOfBenefitPaymentProps = TBaseResourceProps & {
  field?: string;
  payment: TExplanationOfBenefitPayment | TExplanationOfBenefitPayment[] | undefined;
};

const ExplanationOfBenefitPayment = ({ payment, name, resourceType }: TExplanationOfBenefitPaymentProps) => {
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
          <Money money={value.adjustment} name="Adjustment" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.adjustmentReason} name="Adjustment Reason" resourceType={resourceType} />
          {value.date && <Typography component="div"><b>Date:</b>&nbsp;{`${value.date}`}</Typography>}
          <Money money={value.amount} name="Amount" resourceType={resourceType} />
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ExplanationOfBenefitPayment;
