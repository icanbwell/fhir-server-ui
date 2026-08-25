import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCodeableReference } from '../types/partials/CodeableReference';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TCodeableReferenceProps = TBaseResourceProps & {
  codeableReference: TCodeableReference | TCodeableReference[] | undefined;
};

const CodeableReferenceField = ({ codeableReference, name, resourceType }: TCodeableReferenceProps) => {
  if (!codeableReference) {
    return null;
  }
  const values = Array.isArray(codeableReference) ? codeableReference : [codeableReference];

  return (
    <Box>
      {values.map((value, index) => (
        <Box key={index}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
          <CodeableConcept codeableConcept={value.concept} name="Concept" resourceType={resourceType} />
          <Reference reference={value.reference} name="Reference" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CodeableReferenceField;
