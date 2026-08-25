import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTerminologyCapabilitiesSoftware } from '../types/partials/TerminologyCapabilitiesSoftware';

type TTerminologyCapabilitiesSoftwareProps = TBaseResourceProps & {
  field?: string;
  software: TTerminologyCapabilitiesSoftware | TTerminologyCapabilitiesSoftware[] | undefined;
};

const TerminologyCapabilitiesSoftware = ({ software, name }: TTerminologyCapabilitiesSoftwareProps) => {
  if (!software) {
    return null;
  }
  const values = Array.isArray(software) ? software : [software];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>
          {value.version && <Typography component="div"><b>Version:</b>&nbsp;{value.version}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default TerminologyCapabilitiesSoftware;
