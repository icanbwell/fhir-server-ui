import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExampleScenarioInstance } from '../types/partials/ExampleScenarioInstance';

type TExampleScenarioInstanceProps = TBaseResourceProps & {
  field?: string;
  instance: TExampleScenarioInstance | TExampleScenarioInstance[] | undefined;
};

const ExampleScenarioInstance = ({ instance, name }: TExampleScenarioInstanceProps) => {
  if (!instance) {
    return null;
  }
  const values = Array.isArray(instance) ? instance : [instance];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Resource Id:</b>&nbsp;{`${value.resourceId}`}</Typography>
          <Typography component="div"><b>Resource Type:</b>&nbsp;{`${value.resourceType}`}</Typography>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{`${value.name}`}</Typography>}
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{`${value.description}`}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default ExampleScenarioInstance;
