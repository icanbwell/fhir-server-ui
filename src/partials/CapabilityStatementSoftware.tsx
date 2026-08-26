import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCapabilityStatementSoftware } from '../types/partials/CapabilityStatementSoftware';
import DateTime from './DateTime';

type TCapabilityStatementSoftwareProps = TBaseResourceProps & {
  field?: string;
  software: TCapabilityStatementSoftware | TCapabilityStatementSoftware[] | undefined;
};

const CapabilityStatementSoftware = ({ software, name, resourceType }: TCapabilityStatementSoftwareProps) => {
  if (!software) {
    return null;
  }
  const values = Array.isArray(software) ? software : [software];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          {value.version && <Typography component="div"><b>Version:</b>&nbsp;{value.version}</Typography>}
          <DateTime dateTime={value.releaseDate} name="Release Date" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CapabilityStatementSoftware;
