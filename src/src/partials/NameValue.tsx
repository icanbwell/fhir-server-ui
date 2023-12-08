import { Typography, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';

type TNameValueProps = TBaseResourceProps & {
  value: String|Boolean|undefined;
};

const NameValue = ({ name, value }: TNameValueProps) => {
  // Return null if value is not defined
  if (value === undefined) {
    return null;
  }

  return (
    <Box>
      <Typography variant="body1" component="div">
        <b>{name}:</b>&nbsp;{`${value}`}
      </Typography>
    </Box>
  );
};

export default NameValue;
