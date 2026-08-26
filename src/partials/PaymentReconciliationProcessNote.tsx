import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TPaymentReconciliationProcessNote } from '../types/partials/PaymentReconciliationProcessNote';

type TPaymentReconciliationProcessNoteProps = TBaseResourceProps & {
  field?: string;
  processNote: TPaymentReconciliationProcessNote | TPaymentReconciliationProcessNote[] | undefined;
};

const PaymentReconciliationProcessNoteField = ({ processNote, name }: TPaymentReconciliationProcessNoteProps) => {
  if (!processNote) {
    return null;
  }
  const values = Array.isArray(processNote) ? processNote : [processNote];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.type && <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>}
          {value.text && <Typography component="div"><b>Text:</b>&nbsp;{value.text}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default PaymentReconciliationProcessNoteField;
