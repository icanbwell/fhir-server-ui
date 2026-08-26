import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTestScriptVariable } from '../types/partials/TestScriptVariable';

type TTestScriptVariableProps = TBaseResourceProps & {
  field?: string;
  variable: TTestScriptVariable | TTestScriptVariable[] | undefined;
};

const TestScriptVariable = ({ variable, name }: TTestScriptVariableProps) => {
  if (!variable) {
    return null;
  }
  const values = Array.isArray(variable) ? variable : [variable];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          {value.expression && <Typography component="div"><b>Expression:</b>&nbsp;{value.expression}</Typography>}
          {value.path && <Typography component="div"><b>Path:</b>&nbsp;{value.path}</Typography>}
          {value.headerField && <Typography component="div"><b>Header Field:</b>&nbsp;{value.headerField}</Typography>}
          {value.sourceId && <Typography component="div"><b>Source Id:</b>&nbsp;{String(value.sourceId)}</Typography>}
          {value.defaultValue && <Typography component="div"><b>Default Value:</b>&nbsp;{value.defaultValue}</Typography>}
          {value.hint && <Typography component="div"><b>Hint:</b>&nbsp;{value.hint}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default TestScriptVariable;
