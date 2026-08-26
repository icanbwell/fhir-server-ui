import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTestReportSetup } from '../types/partials/TestReportSetup';

type TTestReportSetupProps = TBaseResourceProps & {
  field?: string;
  setup: TTestReportSetup | TTestReportSetup[] | undefined;
};

const TestReportSetup = ({ setup, name }: TTestReportSetupProps) => {
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
                  {action.operation && `operation result: ${action.operation.result}`}
                  {action.operation && action.assert && ' | '}
                  {action.assert && `assert result: ${action.assert.result}`}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default TestReportSetup;
