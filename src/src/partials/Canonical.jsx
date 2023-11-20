import { Typography, Link, Box } from '@mui/material';

const Canonical = ({ canonical, name }) => {
  return (
    canonical && (
      <Box>
        <Typography variant="body1" component="b">
            <b>{`${name}:`}</b>&nbsp;
        </Typography>
        <Link href={canonical}>{canonical}</Link>
      </Box>
    )
  );
};

export default Canonical;
