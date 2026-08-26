import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClinicalImpressionFinding } from '../types/partials/ClinicalImpressionFinding';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TClinicalImpressionFindingProps = TBaseResourceProps & {
  field?: string;
  finding: TClinicalImpressionFinding | TClinicalImpressionFinding[] | undefined;
};

const ClinicalImpressionFinding = ({ finding, name, resourceType }: TClinicalImpressionFindingProps) => {
  if (!finding) {
    return null;
  }
  const values = Array.isArray(finding) ? finding : [finding];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.itemCodeableConcept} name="Item" resourceType={resourceType} />
          <Reference reference={value.itemReference} name="Item Reference" resourceType={resourceType} />
          {value.basis && (
            <Typography component="div"><b>Basis:</b>&nbsp;{value.basis}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ClinicalImpressionFinding;
