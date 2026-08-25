import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTaskRestriction } from '../types/partials/TaskRestriction';
import Period from './Period';
import Reference from './Reference';

type TTaskRestrictionProps = TBaseResourceProps & {
  field?: string;
  restriction: TTaskRestriction | TTaskRestriction[] | undefined;
};

const TaskRestriction = ({ restriction, name, resourceType }: TTaskRestrictionProps) => {
  if (!restriction) {
    return null;
  }
  const values = Array.isArray(restriction) ? restriction : [restriction];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.repetitions !== undefined && (
            <Typography component="div"><b>Repetitions:</b>&nbsp;{String(value.repetitions)}</Typography>
          )}
          <Period period={value.period} name="Period" resourceType={resourceType} />
          <Reference reference={value.recipient} name="Recipient" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default TaskRestriction;
