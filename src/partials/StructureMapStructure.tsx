import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TStructureMapStructure } from '../types/partials/StructureMapStructure';

type TStructureMapStructureProps = TBaseResourceProps & {
  field?: string;
  structure: TStructureMapStructure | TStructureMapStructure[] | undefined;
};

const StructureMapStructureField = ({ structure, name }: TStructureMapStructureProps) => {
  if (!structure) {
    return null;
  }
  const values = Array.isArray(structure) ? structure : [structure];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.url && <Typography component="div"><b>URL:</b>&nbsp;{value.url}</Typography>}
          {value.mode && <Typography component="div"><b>Mode:</b>&nbsp;{value.mode}</Typography>}
          {value.alias && <Typography component="div"><b>Alias:</b>&nbsp;{value.alias}</Typography>}
          {value.documentation && <Typography component="div"><b>Documentation:</b>&nbsp;{value.documentation}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default StructureMapStructureField;
