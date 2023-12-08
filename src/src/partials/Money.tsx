import { Typography, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMoney } from '../types/partials/Money';

type TMoneyProps = TBaseResourceProps & {
  money: TMoney|undefined;
};

const Money = ({ name, money }: TMoneyProps) => {
  // Return null if value is not defined
  if (money === undefined) {
    return null;
  }
  if (name === undefined || name.length === 0) {
    return (
    <Box>
      <Typography variant="body1" component="div">
        ${`${money.value}`}
      </Typography>
    </Box>
    );
  } else {
  return (
    <Box>
      <Typography variant="body1" component="div">
        <b>{name}:</b>&nbsp;${`${money.value}`}
      </Typography>
    </Box>
    );
  }
};

export default Money;

