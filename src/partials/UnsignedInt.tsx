import { Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TUnsignedInt } from '../types/simpleTypes/UnsignedInt';

type TUnsignedIntProps = TBaseResourceProps & {
  unsignedInt: TUnsignedInt | undefined;
};

const UnsignedInt = ({ name, unsignedInt }: TUnsignedIntProps) => {
  if (unsignedInt === undefined || unsignedInt === null) {
    return null;
  }

  return (
    <Typography component="div">
      <b>{name}:</b>&nbsp;{`${unsignedInt}`}
    </Typography>
  );
};

export default UnsignedInt;
