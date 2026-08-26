import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TPaymentReconciliationDetail } from '../types/partials/PaymentReconciliationDetail';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Identifier from './Identifier';
import Money from './Money';
import DateField from './Date';

type TPaymentReconciliationDetailProps = TBaseResourceProps & {
  field?: string;
  detail: TPaymentReconciliationDetail | TPaymentReconciliationDetail[] | undefined;
};

const PaymentReconciliationDetailField = ({ detail, name, resourceType }: TPaymentReconciliationDetailProps) => {
  if (!detail) {
    return null;
  }
  const values = Array.isArray(detail) ? detail : [detail];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Reference reference={value.request} name="Request" resourceType={resourceType} />
          <Reference reference={value.submitter} name="Submitter" resourceType={resourceType} />
          <Reference reference={value.response} name="Response" resourceType={resourceType} />
          <Reference reference={value.responsible} name="Responsible" resourceType={resourceType} />
          <Reference reference={value.payee} name="Payee" resourceType={resourceType} />
          <DateField date={value.date} name="Date" resourceType={resourceType} />
          <Money money={value.amount} name="Amount" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default PaymentReconciliationDetailField;
