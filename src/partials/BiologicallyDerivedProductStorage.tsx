import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TBiologicallyDerivedProductStorage } from '../types/partials/BiologicallyDerivedProductStorage';
import Period from './Period';

type TBiologicallyDerivedProductStorageProps = TBaseResourceProps & {
  field?: string;
  storage: TBiologicallyDerivedProductStorage | TBiologicallyDerivedProductStorage[] | undefined;
};

const BiologicallyDerivedProductStorage = ({ storage, name, resourceType }: TBiologicallyDerivedProductStorageProps) => {
  if (!storage) {
    return null;
  }
  const values = Array.isArray(storage) ? storage : [storage];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          {value.temperature !== undefined && (
            <Typography component="div"><b>Temperature:</b>&nbsp;{`${value.temperature}`}{value.scale ? ` ${value.scale}` : ''}</Typography>
          )}
          <Period period={value.duration} name="Duration" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default BiologicallyDerivedProductStorage;
