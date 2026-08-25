import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TBundleEntry } from '../types/partials/BundleEntry';
import Uri from './Uri';
import BundleLink from './BundleLink';

type TBundleEntryProps = TBaseResourceProps & {
  field?: string;
  entry: TBundleEntry | TBundleEntry[] | undefined;
};

const BundleEntry = ({ entry, name, resourceType }: TBundleEntryProps) => {
  if (!entry) {
    return null;
  }
  const values = Array.isArray(entry) ? entry : [entry];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Uri uri={value.fullUrl} name="Full URL" resourceType={resourceType} />
          {value.search?.mode && <Typography component="div"><b>Search Mode:</b>&nbsp;{value.search.mode}</Typography>}
          {value.request?.method && <Typography component="div"><b>Request Method:</b>&nbsp;{value.request.method}</Typography>}
          {value.response?.status && <Typography component="div"><b>Response Status:</b>&nbsp;{value.response.status}</Typography>}
          <BundleLink link={value.link} name="Link" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default BundleEntry;
