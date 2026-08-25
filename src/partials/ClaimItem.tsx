import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClaimItem } from '../types/partials/ClaimItem';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Money from './Money';
import Date from './Date';

type TClaimItemProps = TBaseResourceProps & {
  field?: string;
  item: TClaimItem | TClaimItem[] | undefined;
};

const ClaimItem = ({ item, name, resourceType }: TClaimItemProps) => {
  if (!item) {
    return null;
  }
  const values = Array.isArray(item) ? item : [item];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.sequence !== undefined && value.sequence !== null && (
            <Typography component="div"><b>Sequence:</b>&nbsp;{`${value.sequence}`}</Typography>
          )}
          <CodeableConcept codeableConcept={value.productOrService} name="Product or Service" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.category} name="Category" resourceType={resourceType} />
          <Date date={value.servicedDate} name="Serviced Date" resourceType={resourceType} />
          <Quantity quantity={value.quantity} name="Quantity" resourceType={resourceType} />
          <Money money={value.unitPrice} name="Unit Price" resourceType={resourceType} />
          <Money money={value.net} name="Net" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClaimItem;
