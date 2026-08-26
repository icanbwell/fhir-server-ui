import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TImplementationGuideDependsOn } from '../types/partials/ImplementationGuideDependsOn';

type TImplementationGuideDependsOnProps = TBaseResourceProps & {
  field?: string;
  dependsOn: TImplementationGuideDependsOn | TImplementationGuideDependsOn[] | undefined;
};

const ImplementationGuideDependsOnField = ({ dependsOn, name }: TImplementationGuideDependsOnProps) => {
  if (!dependsOn) {
    return null;
  }
  const values = Array.isArray(dependsOn) ? dependsOn : [dependsOn];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>URI:</b>&nbsp;{value.uri}</Typography>
          {value.packageId && <Typography component="div"><b>Package Id:</b>&nbsp;{value.packageId}</Typography>}
          {value.version && <Typography component="div"><b>Version:</b>&nbsp;{value.version}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default ImplementationGuideDependsOnField;
