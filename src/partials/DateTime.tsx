import { Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDateTime } from '../types/simpleTypes/DateTime';

type TDateTimeProps = TBaseResourceProps & {
  dateTime: TDateTime|undefined;
};

const DateTime = ({ name, dateTime }: TDateTimeProps) => {
  if (!dateTime) {
    return null;
  }

  return (
    <Typography component="div">
      <b>{name}:</b>&nbsp;{dateTime}
    </Typography>
  );
};

export default DateTime;
