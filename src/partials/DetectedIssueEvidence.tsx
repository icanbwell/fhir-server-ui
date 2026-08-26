import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDetectedIssueEvidence } from '../types/partials/DetectedIssueEvidence';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TDetectedIssueEvidenceProps = TBaseResourceProps & {
  field?: string;
  evidence: TDetectedIssueEvidence | TDetectedIssueEvidence[] | undefined;
};

const DetectedIssueEvidence = ({ evidence, name, resourceType }: TDetectedIssueEvidenceProps) => {
  if (!evidence) {
    return null;
  }
  const values = Array.isArray(evidence) ? evidence : [evidence];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <Reference reference={value.detail} name="Detail" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default DetectedIssueEvidence;
