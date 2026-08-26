import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClinicalUseDefinitionContraindication } from '../types/partials/ClinicalUseDefinitionContraindication';
import CodeableReference from './CodeableReference';
import Reference from './Reference';

type TClinicalUseDefinitionContraindicationProps = TBaseResourceProps & {
  field?: string;
  contraindication: TClinicalUseDefinitionContraindication | TClinicalUseDefinitionContraindication[] | undefined;
};

const ClinicalUseDefinitionContraindication = ({
  contraindication,
  name,
  resourceType,
}: TClinicalUseDefinitionContraindicationProps) => {
  if (!contraindication) {
    return null;
  }
  const values = Array.isArray(contraindication) ? contraindication : [contraindication];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableReference codeableReference={value.diseaseSymptomProcedure} name="Disease/Symptom/Procedure" resourceType={resourceType} />
          <CodeableReference codeableReference={value.diseaseStatus} name="Disease Status" resourceType={resourceType} />
          <CodeableReference codeableReference={value.comorbidity} name="Comorbidity" resourceType={resourceType} />
          <Reference reference={value.indication} name="Indication" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClinicalUseDefinitionContraindication;
