import { Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDate } from '../types/simpleTypes/Date';

type TDateProps = TBaseResourceProps & {
  date: TDate | undefined;
};

const DateField = ({ name, date }: TDateProps) => {
  if (!date) {
    return null;
  }

  return (
    <Typography component="div">
      <b>{name}:</b>&nbsp;{date}
    </Typography>
  );
};

export default DateField;
