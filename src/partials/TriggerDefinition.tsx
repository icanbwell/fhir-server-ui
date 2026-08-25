import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTriggerDefinition } from '../types/partials/TriggerDefinition';

type TTriggerDefinitionProps = TBaseResourceProps & {
  triggerDefinition: TTriggerDefinition | TTriggerDefinition[] | undefined;
};

const TriggerDefinitionField = ({ triggerDefinition, name }: TTriggerDefinitionProps) => {
  if (!triggerDefinition) {
    return null;
  }
  const values = Array.isArray(triggerDefinition) ? triggerDefinition : [triggerDefinition];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          {value.timingDate && <Typography component="div"><b>Timing Date:</b>&nbsp;{value.timingDate}</Typography>}
          {value.timingDateTime && (
            <Typography component="div"><b>Timing Date/Time:</b>&nbsp;{value.timingDateTime}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default TriggerDefinitionField;
