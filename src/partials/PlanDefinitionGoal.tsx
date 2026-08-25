import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TPlanDefinitionGoal } from '../types/partials/PlanDefinitionGoal';
import CodeableConcept from './CodeableConcept';
import RelatedArtifact from './RelatedArtifact';

type TPlanDefinitionGoalProps = TBaseResourceProps & {
  field?: string;
  goal: TPlanDefinitionGoal | TPlanDefinitionGoal[] | undefined;
};

const PlanDefinitionGoalField = ({ goal, name, resourceType }: TPlanDefinitionGoalProps) => {
  if (!goal) {
    return null;
  }
  const values = Array.isArray(goal) ? goal : [goal];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.category} name="Category" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.description} name="Description" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.priority} name="Priority" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.start} name="Start" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.addresses} name="Addresses" resourceType={resourceType} />
          <RelatedArtifact relatedArtifact={value.documentation} name="Documentation" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default PlanDefinitionGoalField;
