import { Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TInt } from '../types/simpleTypes/Int';

type TIntProps = TBaseResourceProps & {
  int: TInt | undefined;
};

const Int = ({ name, int }: TIntProps) => {
  if (int === undefined || int === null) {
    return null;
  }

  return (
    <Typography component="div">
      <b>{name}:</b>&nbsp;{`${int}`}
    </Typography>
  );
};

export default Int;
