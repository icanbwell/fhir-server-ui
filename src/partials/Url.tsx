import { Typography, Link, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TUrl } from '../types/simpleTypes/Url';

type TUrlProps = TBaseResourceProps & {
  url: TUrl | TUrl[] | undefined;
};

// FHIR `url` values can come from external/federated data and are rendered as a clickable link -
// only allow-listed schemes are safe to navigate to (e.g. a stored `javascript:` URI would
// execute on click). Anything else renders as plain text instead of a Link.
const SAFE_URL_SCHEME_REGEX = /^(https?|mailto|tel|ftp):/i;

function UrlField({ name, url }: TUrlProps) {
  if (url && !Array.isArray(url)) {
    url = [url];
  }
  return (
    url && url.map((value: TUrl, index) => {
      const text = `${value}`;
      return (
        <Box key={index}>
          <Typography variant="body1" sx={{ display: 'inline' }}>
            <b>{name}:</b>&nbsp;
          </Typography>
          {SAFE_URL_SCHEME_REGEX.test(text) ? <Link href={text}>{value}</Link> : <span>{value}</span>}
        </Box>
      );
    })
  );
}

export default UrlField;
