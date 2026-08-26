import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TProductShelfLife } from '../types/partials/ProductShelfLife';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';

type TProductShelfLifeProps = TBaseResourceProps & {
  productShelfLife: TProductShelfLife | TProductShelfLife[] | undefined;
};

const ProductShelfLifeField = ({ productShelfLife, name, resourceType }: TProductShelfLifeProps) => {
  if (!productShelfLife) {
    return null;
  }
  const values = Array.isArray(productShelfLife) ? productShelfLife : [productShelfLife];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Quantity quantity={value.period} name="Period" resourceType={resourceType} />
          <CodeableConcept
            codeableConcept={value.specialPrecautionsForStorage}
            name="Special Precautions For Storage"
            resourceType={resourceType}
          />
        </Box>
      ))}
    </Box>
  );
};

export default ProductShelfLifeField;
