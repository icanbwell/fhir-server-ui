import { Typography, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';

type TIntegerProps = TBaseResourceProps & {
  integer: Number|undefined;
};

const Integer = ({ name, integer }: TIntegerProps) => {
  if (integer !== undefined) {
    return (
      <Box>
        <Typography variant="body1" component="div">
          <b>{name}:</b>&nbsp;{`${integer}`}
        </Typography>
      </Box>
    );
  } else {
    return null;
  }
};

export default Integer;
