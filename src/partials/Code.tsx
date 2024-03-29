import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCode } from '../types/simpleTypes/Code';

type TCodeProps = TBaseResourceProps & {
  code: TCode|TCode[]|undefined;
};

const Code = ({ code, name }: TCodeProps) => {
  if (!code) {
    return null;
  }
  if (!Array.isArray(code)) {
    code = [code];
  }

  return (
    <Box>
      {code.map((value: TCode) => (
        <Typography variant="body1" component="span">
          <b>{name}:</b>&nbsp;{value}
        </Typography>
      ))}
    </Box>
  );
};

export default Code;
