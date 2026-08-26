import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEvidenceReportRelatesTo } from '../types/partials/EvidenceReportRelatesTo';
import Identifier from './Identifier';
import Reference from './Reference';

type TEvidenceReportRelatesToProps = TBaseResourceProps & {
  field?: string;
  relatesTo: TEvidenceReportRelatesTo | TEvidenceReportRelatesTo[] | undefined;
};

const EvidenceReportRelatesTo = ({ relatesTo, name, resourceType }: TEvidenceReportRelatesToProps) => {
  if (!relatesTo) {
    return null;
  }
  const values = Array.isArray(relatesTo) ? relatesTo : [relatesTo];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.code && <Typography component="div"><b>Code:</b>&nbsp;{value.code}</Typography>}
          <Identifier identifier={value.targetIdentifier} name="Target Identifier" resourceType={resourceType} />
          <Reference reference={value.targetReference} name="Target Reference" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default EvidenceReportRelatesTo;
