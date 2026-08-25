import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCitationClassification } from '../types/partials/CitationClassification';
import CodeableConcept from './CodeableConcept';

type TCitationClassificationProps = TBaseResourceProps & {
  field?: string;
  classification: TCitationClassification | TCitationClassification[] | undefined;
};

const CitationClassification = ({ classification, name, resourceType }: TCitationClassificationProps) => {
  if (!classification) {
    return null;
  }
  const values = Array.isArray(classification) ? classification : [classification];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.classifier} name="Classifier" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CitationClassification;
