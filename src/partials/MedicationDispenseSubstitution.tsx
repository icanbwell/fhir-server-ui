import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicationDispenseSubstitution } from '../types/partials/MedicationDispenseSubstitution';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Boolean from './Boolean';

type TMedicationDispenseSubstitutionProps = TBaseResourceProps & {
  field?: string;
  substitution: TMedicationDispenseSubstitution | TMedicationDispenseSubstitution[] | undefined;
};

const MedicationDispenseSubstitutionField = ({ substitution, name, resourceType }: TMedicationDispenseSubstitutionProps) => {
  if (!substitution) {
    return null;
  }
  const values = Array.isArray(substitution) ? substitution : [substitution];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Boolean boolean={value.wasSubstituted} name="Was Substituted" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.reason} name="Reason" resourceType={resourceType} />
          <Reference reference={value.responsibleParty} name="Responsible Party" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MedicationDispenseSubstitutionField;
