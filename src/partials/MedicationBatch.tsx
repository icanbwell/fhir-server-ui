import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicationBatch } from '../types/partials/MedicationBatch';
import DateTime from './DateTime';

type TMedicationBatchProps = TBaseResourceProps & {
  field?: string;
  batch: TMedicationBatch | TMedicationBatch[] | undefined;
};

const MedicationBatchField = ({ batch, name, resourceType }: TMedicationBatchProps) => {
  if (!batch) {
    return null;
  }
  const values = Array.isArray(batch) ? batch : [batch];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          {value.lotNumber && <Typography component="div"><b>Lot Number:</b>&nbsp;{value.lotNumber}</Typography>}
          <DateTime dateTime={value.expirationDate} name="Expiration Date" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MedicationBatchField;
