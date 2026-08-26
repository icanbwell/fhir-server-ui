import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCoverageEligibilityRequestItem } from '../types/partials/CoverageEligibilityRequestItem';
import CodeableConcept from './CodeableConcept';
import Money from './Money';
import Quantity from './Quantity';
import Reference from './Reference';

type TCoverageEligibilityRequestItemProps = TBaseResourceProps & {
  field?: string;
  item: TCoverageEligibilityRequestItem | TCoverageEligibilityRequestItem[] | undefined;
};

const CoverageEligibilityRequestItem = ({ item, name, resourceType }: TCoverageEligibilityRequestItemProps) => {
  if (!item) {
    return null;
  }
  const values = Array.isArray(item) ? item : [item];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.category} name="Category" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.productOrService} name="Product Or Service" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.modifier} name="Modifier" resourceType={resourceType} />
          <Reference reference={value.provider} name="Provider" resourceType={resourceType} />
          <Quantity quantity={value.quantity} name="Quantity" resourceType={resourceType} />
          <Money money={value.unitPrice} name="Unit Price" resourceType={resourceType} />
          <Reference reference={value.facility} name="Facility" resourceType={resourceType} />
          <Reference reference={value.detail} name="Detail" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CoverageEligibilityRequestItem;
