import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { TBaseResourceProps } from '../types/baseTypes';
import { TInstant } from '../types/simpleTypes/Instant';

type TInstantProps = TBaseResourceProps & {
  instant: TInstant|undefined;
};

const Instant = ({ name, instant }: TInstantProps) => {
  return instant ? (
    <Box>
      <Typography variant="body1">
        <b>{name}:</b>&nbsp;{`${instant}`}
      </Typography>
    </Box>
  ) : null;
};

export default Instant;
