import { Typography, Link, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TUri } from '../types/simpleTypes/Uri';

type TUriProps = TBaseResourceProps & {
  uri: TUri|TUri[]|undefined;
};

function Uri({ name, uri }: TUriProps) {
  if (uri && !Array.isArray(uri)) {
    uri = [uri];
  }
  return (
    uri && uri.map((value: TUri, index) => (
      <Box key={index}>
        <Typography variant="body1" sx={{ display: 'inline' }}>
          <b>{name}:</b>&nbsp;
        </Typography>
        <Link href={`${value}`}>{value}</Link>
      </Box>
    ))
  );
}

export default Uri;
