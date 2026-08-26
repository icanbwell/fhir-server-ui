import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSubstanceDefinitionCode } from '../types/partials/SubstanceDefinitionCode';
import CodeableConcept from './CodeableConcept';
import DateTime from './DateTime';
import Annotation from './Annotation';
import Reference from './Reference';

type TSubstanceDefinitionCodeProps = TBaseResourceProps & {
  field?: string;
  code: TSubstanceDefinitionCode | TSubstanceDefinitionCode[] | undefined;
};

const SubstanceDefinitionCodeField = ({ code, name, resourceType }: TSubstanceDefinitionCodeProps) => {
  if (!code) {
    return null;
  }
  const values = Array.isArray(code) ? code : [code];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.status} name="Status" resourceType={resourceType} />
          <DateTime dateTime={value.statusDate} name="Status Date" resourceType={resourceType} />
          <Annotation annotation={value.note} name="Note" resourceType={resourceType} />
          <Reference reference={value.source} name="Source" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default SubstanceDefinitionCodeField;
