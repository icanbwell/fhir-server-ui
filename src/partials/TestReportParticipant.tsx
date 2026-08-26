import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTestReportParticipant } from '../types/partials/TestReportParticipant';

type TTestReportParticipantProps = TBaseResourceProps & {
  field?: string;
  participant: TTestReportParticipant | TTestReportParticipant[] | undefined;
};

const TestReportParticipant = ({ participant, name }: TTestReportParticipantProps) => {
  if (!participant) {
    return null;
  }
  const values = Array.isArray(participant) ? participant : [participant];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>
          <Typography component="div"><b>URI:</b>&nbsp;{String(value.uri)}</Typography>
          {value.display && <Typography component="div"><b>Display:</b>&nbsp;{value.display}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default TestReportParticipant;
