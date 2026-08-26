import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TPlanDefinitionAction } from '../types/partials/PlanDefinitionAction';
import CodeableConcept from './CodeableConcept';
import RelatedArtifact from './RelatedArtifact';
import Reference from './Reference';

type TPlanDefinitionActionProps = TBaseResourceProps & {
  field?: string;
  action: TPlanDefinitionAction | TPlanDefinitionAction[] | undefined;
};

const PlanDefinitionActionField = ({ action, name, resourceType }: TPlanDefinitionActionProps) => {
  if (!action) {
    return null;
  }
  const values = Array.isArray(action) ? action : [action];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.title && <Typography component="div"><b>Title:</b>&nbsp;{value.title}</Typography>}
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          {value.textEquivalent && <Typography component="div"><b>Text Equivalent:</b>&nbsp;{value.textEquivalent}</Typography>}
          {value.priority && <Typography component="div"><b>Priority:</b>&nbsp;{value.priority}</Typography>}
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.subjectCodeableConcept} name="Subject" resourceType={resourceType} />
          <Reference reference={value.subjectReference} name="Subject" resourceType={resourceType} />
          <RelatedArtifact relatedArtifact={value.documentation} name="Documentation" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default PlanDefinitionActionField;
