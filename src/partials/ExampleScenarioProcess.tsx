import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExampleScenarioProcess } from '../types/partials/ExampleScenarioProcess';
import Markdown from './Markdown';

type TExampleScenarioProcessProps = TBaseResourceProps & {
  field?: string;
  process: TExampleScenarioProcess | TExampleScenarioProcess[] | undefined;
};

const ExampleScenarioProcess = ({ process, name, resourceType }: TExampleScenarioProcessProps) => {
  if (!process) {
    return null;
  }
  const values = Array.isArray(process) ? process : [process];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.title && <Typography component="div"><b>Title:</b>&nbsp;{value.title}</Typography>}
          <Markdown markdown={value.description} name="Description" resourceType={resourceType} />
          <Markdown markdown={value.preConditions} name="Pre-Conditions" resourceType={resourceType} />
          <Markdown markdown={value.postConditions} name="Post-Conditions" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ExampleScenarioProcess;
