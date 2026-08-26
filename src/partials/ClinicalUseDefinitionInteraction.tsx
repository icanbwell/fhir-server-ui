import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClinicalUseDefinitionInteraction } from '../types/partials/ClinicalUseDefinitionInteraction';
import CodeableConcept from './CodeableConcept';
import CodeableReference from './CodeableReference';

type TClinicalUseDefinitionInteractionProps = TBaseResourceProps & {
  field?: string;
  interaction: TClinicalUseDefinitionInteraction | TClinicalUseDefinitionInteraction[] | undefined;
};

const ClinicalUseDefinitionInteraction = ({ interaction, name, resourceType }: TClinicalUseDefinitionInteractionProps) => {
  if (!interaction) {
    return null;
  }
  const values = Array.isArray(interaction) ? interaction : [interaction];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableReference codeableReference={value.effect} name="Effect" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.incidence} name="Incidence" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.management} name="Management" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClinicalUseDefinitionInteraction;
