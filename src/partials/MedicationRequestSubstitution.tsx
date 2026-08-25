import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicationRequestSubstitution } from '../types/partials/MedicationRequestSubstitution';
import CodeableConcept from './CodeableConcept';
import Boolean from './Boolean';

type TMedicationRequestSubstitutionProps = TBaseResourceProps & {
  field?: string;
  substitution: TMedicationRequestSubstitution | TMedicationRequestSubstitution[] | undefined;
};

const MedicationRequestSubstitutionField = ({ substitution, name, resourceType }: TMedicationRequestSubstitutionProps) => {
  if (!substitution) {
    return null;
  }
  const values = Array.isArray(substitution) ? substitution : [substitution];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Boolean boolean={value.allowedBoolean} name="Allowed" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.allowedCodeableConcept} name="Allowed" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.reason} name="Reason" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MedicationRequestSubstitutionField;
