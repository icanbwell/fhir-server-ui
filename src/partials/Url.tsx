import { Typography, Link, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TUrl } from '../types/simpleTypes/Url';

type TUrlProps = TBaseResourceProps & {
  url: TUrl | TUrl[] | undefined;
};

function UrlField({ name, url }: TUrlProps) {
  if (url && !Array.isArray(url)) {
    url = [url];
  }
  return (
    url && url.map((value: TUrl, index) => (
      <Box key={index}>
        <Typography variant="body1" sx={{ display: 'inline' }}>
          <b>{name}:</b>&nbsp;
        </Typography>
        <Link href={`${value}`}>{value}</Link>
      </Box>
    ))
  );
}

export default UrlField;
