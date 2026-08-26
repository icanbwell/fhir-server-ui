import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TActivityDefinitionDynamicValue } from '../types/partials/ActivityDefinitionDynamicValue';

type TActivityDefinitionDynamicValueProps = TBaseResourceProps & {
  field?: string;
  dynamicValue: TActivityDefinitionDynamicValue | TActivityDefinitionDynamicValue[] | undefined;
};

const ActivityDefinitionDynamicValue = ({ dynamicValue, name }: TActivityDefinitionDynamicValueProps) => {
  if (!dynamicValue) {
    return null;
  }
  const values = Array.isArray(dynamicValue) ? dynamicValue : [dynamicValue];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.path && <Typography component="div"><b>Path:</b>&nbsp;{value.path}</Typography>}
          {value.expression?.language && (
            <Typography component="div"><b>Expression Language:</b>&nbsp;{value.expression.language}</Typography>
          )}
          {value.expression?.expression && (
            <Typography component="div"><b>Expression:</b>&nbsp;{value.expression.expression}</Typography>
          )}
          {value.expression?.description && (
            <Typography component="div"><b>Expression Description:</b>&nbsp;{value.expression.description}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ActivityDefinitionDynamicValue;
