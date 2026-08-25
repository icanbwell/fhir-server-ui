import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TStructureMapGroup } from '../types/partials/StructureMapGroup';

type TStructureMapGroupProps = TBaseResourceProps & {
  field?: string;
  group: TStructureMapGroup | TStructureMapGroup[] | undefined;
};

const StructureMapGroupField = ({ group, name }: TStructureMapGroupProps) => {
  if (!group) {
    return null;
  }
  const values = Array.isArray(group) ? group : [group];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          {value.typeMode && <Typography component="div"><b>Type Mode:</b>&nbsp;{value.typeMode}</Typography>}
          {value.documentation && <Typography component="div"><b>Documentation:</b>&nbsp;{value.documentation}</Typography>}
          {value.input && (
            <Typography component="div"><b>Inputs:</b>&nbsp;{value.input.length}</Typography>
          )}
          {value.rule && (
            <Typography component="div"><b>Rules:</b>&nbsp;{value.rule.length}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default StructureMapGroupField;
