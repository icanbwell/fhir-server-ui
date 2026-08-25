import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExampleScenarioActor } from '../types/partials/ExampleScenarioActor';
import Markdown from './Markdown';

type TExampleScenarioActorProps = TBaseResourceProps & {
  field?: string;
  actor: TExampleScenarioActor | TExampleScenarioActor[] | undefined;
};

const ExampleScenarioActor = ({ actor, name, resourceType }: TExampleScenarioActorProps) => {
  if (!actor) {
    return null;
  }
  const values = Array.isArray(actor) ? actor : [actor];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          {value.actorId && <Typography component="div"><b>Actor Id:</b>&nbsp;{value.actorId}</Typography>}
          {value.type && <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>}
          <Markdown markdown={value.description} name="Description" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ExampleScenarioActor;
