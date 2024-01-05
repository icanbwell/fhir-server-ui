import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TNarrative } from '../types/partials/Narrative';

type TNarrativeProps = TBaseResourceProps & {
  narrative: TNarrative|undefined;
};

const Narrative = ({ narrative, name }: TNarrativeProps) => {
  if (narrative !== undefined && narrative.div !== undefined) {
    return (
      <Box>
        <Typography variant="h4">{name}</Typography>&nbsp;
        <Box dangerouslySetInnerHTML={{ __html: `${narrative.div}` }} />
      </Box>
    );
  } else {
    return null;
  }
};

export default Narrative;
