import { Typography, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';

type TStringProps = TBaseResourceProps & {
  string: String | String[] | undefined;
};

const StringField = ({ name, string }: TStringProps) => {
  if (!string) {
    return null;
  }
  const values = Array.isArray(string) ? string : [string];

  return (
    <Box>
      {values.map((value, index) => (
        <Typography variant="body1" component="div" key={index}>
          <b>{name}:</b>&nbsp;{`${value}`}
        </Typography>
      ))}
    </Box>
  );
};

export default StringField;
