import { Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';

type TDecimalProps = TBaseResourceProps & {
  decimal: Number|undefined;
};

const Decimal = ({ name, decimal }: TDecimalProps) => {
  if (!decimal) {
    return null;
  }

  return (
    <Typography component="div">
      <b>{name}:</b>&nbsp;{`${decimal}`}
    </Typography>
  );
};

export default Decimal;
