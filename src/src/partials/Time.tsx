import { Typography, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTime } from '../types/simpleTypes/Time';

type TTimeProps = TBaseResourceProps & {
  time: TTime|undefined;
};

const Time = ({ name, time }: TTimeProps) => {
  if (time) {
    return (
      <Box>
        <Typography variant="body1" component="div">
          <b>{name}:</b>&nbsp;{time}
        </Typography>
      </Box>
    );
  } else {
    return null;
  }
};

export default Time;
