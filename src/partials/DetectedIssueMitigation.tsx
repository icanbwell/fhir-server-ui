import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDetectedIssueMitigation } from '../types/partials/DetectedIssueMitigation';
import CodeableConcept from './CodeableConcept';
import DateTime from './DateTime';
import Reference from './Reference';

type TDetectedIssueMitigationProps = TBaseResourceProps & {
  field?: string;
  mitigation: TDetectedIssueMitigation | TDetectedIssueMitigation[] | undefined;
};

const DetectedIssueMitigation = ({ mitigation, name, resourceType }: TDetectedIssueMitigationProps) => {
  if (!mitigation) {
    return null;
  }
  const values = Array.isArray(mitigation) ? mitigation : [mitigation];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.action} name="Action" resourceType={resourceType} />
          <DateTime dateTime={value.date} name="Date" resourceType={resourceType} />
          <Reference reference={value.author} name="Author" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default DetectedIssueMitigation;
