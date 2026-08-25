import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEpisodeOfCareStatusHistory } from '../types/partials/EpisodeOfCareStatusHistory';
import Period from './Period';

type TEpisodeOfCareStatusHistoryProps = TBaseResourceProps & {
  field?: string;
  statusHistory: TEpisodeOfCareStatusHistory | TEpisodeOfCareStatusHistory[] | undefined;
};

const EpisodeOfCareStatusHistory = ({ statusHistory, name, resourceType }: TEpisodeOfCareStatusHistoryProps) => {
  if (!statusHistory) {
    return null;
  }
  const values = Array.isArray(statusHistory) ? statusHistory : [statusHistory];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.status && <Typography component="div"><b>Status:</b>&nbsp;{value.status}</Typography>}
          <Period period={value.period} name="Period" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default EpisodeOfCareStatusHistory;
