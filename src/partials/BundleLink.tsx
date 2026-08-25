import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TBundleLink } from '../types/partials/BundleLink';
import Uri from './Uri';

type TBundleLinkProps = TBaseResourceProps & {
  field?: string;
  link: TBundleLink | TBundleLink[] | undefined;
};

const BundleLink = ({ link, name, resourceType }: TBundleLinkProps) => {
  if (!link) {
    return null;
  }
  const values = Array.isArray(link) ? link : [link];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.relation && <Typography component="div"><b>Relation:</b>&nbsp;{value.relation}</Typography>}
          <Uri uri={value.url} name="URL" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default BundleLink;
