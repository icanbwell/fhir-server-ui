import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTestScriptSetup } from '../types/partials/TestScriptSetup';

type TTestScriptSetupProps = TBaseResourceProps & {
  field?: string;
  setup: TTestScriptSetup | TTestScriptSetup[] | undefined;
};

const TestScriptSetup = ({ setup, name }: TTestScriptSetupProps) => {
  if (!setup) {
    return null;
  }
  const values = Array.isArray(setup) ? setup : [setup];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.action && value.action.length > 0 && (
            <Box sx={{ ml: 2 }}>
              {value.action.filter((a) => a).map((action, aIndex) => (
                <Typography component="div" key={aIndex}>
                  <b>Action:</b>&nbsp;
                  {action.operation?.description || action.operation?.label || action.operation?.type?.code}
                  {action.operation && action.assert && ' | '}
                  {action.assert && (action.assert.label || action.assert.description)}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default TestScriptSetup;
