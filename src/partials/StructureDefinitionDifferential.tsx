import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TStructureDefinitionDifferential } from '../types/partials/StructureDefinitionDifferential';

type TStructureDefinitionDifferentialProps = TBaseResourceProps & {
  field?: string;
  differential: TStructureDefinitionDifferential | TStructureDefinitionDifferential[] | undefined;
};

const StructureDefinitionDifferentialField = ({ differential, name }: TStructureDefinitionDifferentialProps) => {
  if (!differential) {
    return null;
  }
  const values = Array.isArray(differential) ? differential : [differential];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.element && (
            <Typography component="div">
              <b>Elements:</b>&nbsp;{value.element.length}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default StructureDefinitionDifferentialField;
