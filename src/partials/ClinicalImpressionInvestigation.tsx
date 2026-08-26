import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClinicalImpressionInvestigation } from '../types/partials/ClinicalImpressionInvestigation';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TClinicalImpressionInvestigationProps = TBaseResourceProps & {
  field?: string;
  investigation: TClinicalImpressionInvestigation | TClinicalImpressionInvestigation[] | undefined;
};

const ClinicalImpressionInvestigation = ({ investigation, name, resourceType }: TClinicalImpressionInvestigationProps) => {
  if (!investigation) {
    return null;
  }
  const values = Array.isArray(investigation) ? investigation : [investigation];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <Reference reference={value.item} name="Item" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClinicalImpressionInvestigation;
