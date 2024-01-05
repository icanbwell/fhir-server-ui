import { Typography, Link, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCanonical } from '../types/simpleTypes/Canonical';

type TCanonicalProps = TBaseResourceProps & {
  canonical: TCanonical|TCanonical[]|undefined;
};

const Canonical = ({ canonical, name }: TCanonicalProps) => {
  if (canonical && !Array.isArray(canonical)) {
    canonical = [canonical];
  }
  return (
    canonical && (
      canonical.map((value: TCanonical) => (
        <Box>
          <Typography variant="body1" component="b">
              <b>{`${name}:`}</b>&nbsp;
          </Typography>
          <Link href={`${value}`}>{value}</Link>
        </Box>
      ))
    )
  );
};

export default Canonical;
