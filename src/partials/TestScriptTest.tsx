import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTestScriptTest } from '../types/partials/TestScriptTest';

type TTestScriptTestProps = TBaseResourceProps & {
  field?: string;
  test: TTestScriptTest | TTestScriptTest[] | undefined;
};

const TestScriptTest = ({ test, name }: TTestScriptTestProps) => {
  if (!test) {
    return null;
  }
  const values = Array.isArray(test) ? test : [test];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
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

export default TestScriptTest;
