import { Box, Typography } from '@mui/material';
import DOMPurify from 'dompurify';
import { TBaseResourceProps } from '../types/baseTypes';
import { TNarrative } from '../types/partials/Narrative';

type TNarrativeProps = TBaseResourceProps & {
  narrative: TNarrative | undefined;
};

const Narrative = ({ narrative, name }: TNarrativeProps) => {
  if (narrative !== undefined && narrative.div !== undefined) {
    return (
      <Box>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>&nbsp;
        <Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(`${narrative.div}`) }} />
      </Box>
    );
  } else {
    return null;
  }
};

export default Narrative;
