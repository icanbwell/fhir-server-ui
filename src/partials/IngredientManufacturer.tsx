import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TIngredientManufacturer } from '../types/partials/IngredientManufacturer';
import Reference from './Reference';

type TIngredientManufacturerProps = TBaseResourceProps & {
  field?: string;
  manufacturer: TIngredientManufacturer | TIngredientManufacturer[] | undefined;
};

const IngredientManufacturerField = ({ manufacturer, name, resourceType }: TIngredientManufacturerProps) => {
  if (!manufacturer) {
    return null;
  }
  const values = Array.isArray(manufacturer) ? manufacturer : [manufacturer];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.role && <Typography component="div"><b>Role:</b>&nbsp;{value.role}</Typography>}
          <Reference reference={value.manufacturer} name="Manufacturer" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default IngredientManufacturerField;
