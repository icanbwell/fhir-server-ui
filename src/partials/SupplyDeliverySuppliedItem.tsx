import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSupplyDeliverySuppliedItem } from '../types/partials/SupplyDeliverySuppliedItem';
import Quantity from './Quantity';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TSupplyDeliverySuppliedItemProps = TBaseResourceProps & {
  field?: string;
  suppliedItem: TSupplyDeliverySuppliedItem | TSupplyDeliverySuppliedItem[] | undefined;
};

const SupplyDeliverySuppliedItemField = ({ suppliedItem, name, resourceType }: TSupplyDeliverySuppliedItemProps) => {
  if (!suppliedItem) {
    return null;
  }
  const values = Array.isArray(suppliedItem) ? suppliedItem : [suppliedItem];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Quantity quantity={value.quantity} name="Quantity" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.itemCodeableConcept} name="Item" resourceType={resourceType} />
          <Reference reference={value.itemReference} name="Item Reference" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default SupplyDeliverySuppliedItemField;
