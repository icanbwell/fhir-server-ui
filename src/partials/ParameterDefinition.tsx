import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TParameterDefinition } from '../types/partials/ParameterDefinition';

type TParameterDefinitionProps = TBaseResourceProps & {
  parameterDefinition: TParameterDefinition | TParameterDefinition[] | undefined;
};

const ParameterDefinitionField = ({ parameterDefinition, name }: TParameterDefinitionProps) => {
  if (!parameterDefinition) {
    return null;
  }
  const values = Array.isArray(parameterDefinition) ? parameterDefinition : [parameterDefinition];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          <Typography component="div"><b>Use:</b>&nbsp;{value.use}</Typography>
          <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>
          {value.min !== undefined && value.min !== null && (
            <Typography component="div"><b>Min:</b>&nbsp;{`${value.min}`}</Typography>
          )}
          {value.max && <Typography component="div"><b>Max:</b>&nbsp;{value.max}</Typography>}
          {value.documentation && (
            <Typography component="div"><b>Documentation:</b>&nbsp;{value.documentation}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ParameterDefinitionField;
