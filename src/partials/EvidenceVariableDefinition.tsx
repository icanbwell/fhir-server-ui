import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEvidenceVariableDefinition } from '../types/partials/EvidenceVariableDefinition';
import Markdown from './Markdown';
import Annotation from './Annotation';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TEvidenceVariableDefinitionProps = TBaseResourceProps & {
  field?: string;
  variableDefinition: TEvidenceVariableDefinition | TEvidenceVariableDefinition[] | undefined;
};

const EvidenceVariableDefinition = ({ variableDefinition, name, resourceType }: TEvidenceVariableDefinitionProps) => {
  if (!variableDefinition) {
    return null;
  }
  const values = Array.isArray(variableDefinition) ? variableDefinition : [variableDefinition];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Markdown markdown={value.description} name="Description" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.variableRole} name="Variable Role" resourceType={resourceType} />
          <Reference reference={value.observed} name="Observed" resourceType={resourceType} />
          <Reference reference={value.intended} name="Intended" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.directnessMatch} name="Directness Match" resourceType={resourceType} />
          <Annotation annotation={value.note} name="Notes" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default EvidenceVariableDefinition;
