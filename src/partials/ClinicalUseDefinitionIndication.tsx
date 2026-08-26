import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClinicalUseDefinitionIndication } from '../types/partials/ClinicalUseDefinitionIndication';
import CodeableReference from './CodeableReference';
import Range from './Range';
import Reference from './Reference';

type TClinicalUseDefinitionIndicationProps = TBaseResourceProps & {
  field?: string;
  indication: TClinicalUseDefinitionIndication | TClinicalUseDefinitionIndication[] | undefined;
};

const ClinicalUseDefinitionIndication = ({ indication, name, resourceType }: TClinicalUseDefinitionIndicationProps) => {
  if (!indication) {
    return null;
  }
  const values = Array.isArray(indication) ? indication : [indication];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableReference codeableReference={value.diseaseSymptomProcedure} name="Disease/Symptom/Procedure" resourceType={resourceType} />
          <CodeableReference codeableReference={value.diseaseStatus} name="Disease Status" resourceType={resourceType} />
          <CodeableReference codeableReference={value.comorbidity} name="Comorbidity" resourceType={resourceType} />
          <CodeableReference codeableReference={value.intendedEffect} name="Intended Effect" resourceType={resourceType} />
          <Range range={value.durationRange} name="Duration Range" resourceType={resourceType} />
          {value.durationString && (
            <Typography component="div"><b>Duration:</b>&nbsp;{value.durationString}</Typography>
          )}
          <Reference reference={value.undesirableEffect} name="Undesirable Effect" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClinicalUseDefinitionIndication;
