import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { TBaseResourceProps } from '../types/baseTypes';

type TBooleanProps = TBaseResourceProps & {
  boolean: Boolean|undefined;
};

const Boolean = ({ boolean, name }: TBooleanProps) => {
  if (boolean !== undefined) {
    return (
      <Box>
        <Typography variant="body1">
          <b>{name}:</b>&nbsp;{boolean ? 'True' : 'False'}
        </Typography>
      </Box>
    );
  } else {
    return null;
  }
};

export default Boolean;
