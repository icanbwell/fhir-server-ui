import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClinicalUseDefinitionWarning } from '../types/partials/ClinicalUseDefinitionWarning';
import CodeableConcept from './CodeableConcept';
import Markdown from './Markdown';

type TClinicalUseDefinitionWarningProps = TBaseResourceProps & {
  field?: string;
  warning: TClinicalUseDefinitionWarning | TClinicalUseDefinitionWarning[] | undefined;
};

const ClinicalUseDefinitionWarning = ({ warning, name, resourceType }: TClinicalUseDefinitionWarningProps) => {
  if (!warning) {
    return null;
  }
  const values = Array.isArray(warning) ? warning : [warning];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <Markdown markdown={value.description} name="Description" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClinicalUseDefinitionWarning;
