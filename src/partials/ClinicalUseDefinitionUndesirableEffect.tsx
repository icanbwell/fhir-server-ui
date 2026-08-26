import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClinicalUseDefinitionUndesirableEffect } from '../types/partials/ClinicalUseDefinitionUndesirableEffect';
import CodeableConcept from './CodeableConcept';
import CodeableReference from './CodeableReference';

type TClinicalUseDefinitionUndesirableEffectProps = TBaseResourceProps & {
  field?: string;
  undesirableEffect: TClinicalUseDefinitionUndesirableEffect | TClinicalUseDefinitionUndesirableEffect[] | undefined;
};

const ClinicalUseDefinitionUndesirableEffect = ({
  undesirableEffect,
  name,
  resourceType,
}: TClinicalUseDefinitionUndesirableEffectProps) => {
  if (!undesirableEffect) {
    return null;
  }
  const values = Array.isArray(undesirableEffect) ? undesirableEffect : [undesirableEffect];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableReference codeableReference={value.symptomConditionEffect} name="Symptom/Condition Effect" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.classification} name="Classification" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.frequencyOfOccurrence} name="Frequency of Occurrence" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClinicalUseDefinitionUndesirableEffect;
