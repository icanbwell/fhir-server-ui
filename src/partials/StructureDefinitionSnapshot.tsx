import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TStructureDefinitionSnapshot } from '../types/partials/StructureDefinitionSnapshot';

type TStructureDefinitionSnapshotProps = TBaseResourceProps & {
  field?: string;
  snapshot: TStructureDefinitionSnapshot | TStructureDefinitionSnapshot[] | undefined;
};

const StructureDefinitionSnapshotField = ({ snapshot, name }: TStructureDefinitionSnapshotProps) => {
  if (!snapshot) {
    return null;
  }
  const values = Array.isArray(snapshot) ? snapshot : [snapshot];

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

export default StructureDefinitionSnapshotField;
