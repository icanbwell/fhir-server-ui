import React from 'react';
import Typography from '@mui/material/Typography';
import { Link } from '@mui/material';
import { TResource } from '../types/resources/Resource';

const Json = ({ resource, error }: { resource: TResource, error?: boolean }) => {
  const queryParams = new URLSearchParams(error ? window.location.search : '');
  queryParams.set('_format', 'json');

  const pathName = error ? window.location.pathname : `/4_0_0/${resource.resourceType}/${resource.id}`;
  return (
    <React.Fragment>
      <Typography variant="h4">Raw Json</Typography>
      <Link
        href={`${pathName}?${queryParams.toString()}`}
        target="_blank"
        rel="noopener noreferrer"
      >{`${pathName}?${queryParams.toString()}`}</Link>
    </React.Fragment>
  );
};

export default Json;
