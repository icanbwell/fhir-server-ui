import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCompositionAttester } from '../types/partials/CompositionAttester';
import DateTime from './DateTime';
import Reference from './Reference';
import StringField from './String';

type TCompositionAttesterProps = TBaseResourceProps & {
  field?: string;
  attester: TCompositionAttester | TCompositionAttester[] | undefined;
};

const CompositionAttester = ({ attester, name, resourceType }: TCompositionAttesterProps) => {
  if (!attester) {
    return null;
  }
  const values = Array.isArray(attester) ? attester : [attester];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <StringField string={value.mode} name="Mode" resourceType={resourceType} />
          <DateTime dateTime={value.time} name="Time" resourceType={resourceType} />
          <Reference reference={value.party} name="Party" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CompositionAttester;
