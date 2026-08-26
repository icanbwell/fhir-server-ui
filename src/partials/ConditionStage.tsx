import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TConditionStage } from '../types/partials/ConditionStage';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TConditionStageProps = TBaseResourceProps & {
  field?: string;
  stage: TConditionStage | TConditionStage[] | undefined;
};

const ConditionStage = ({ stage, name, resourceType }: TConditionStageProps) => {
  if (!stage) {
    return null;
  }
  const values = Array.isArray(stage) ? stage : [stage];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.summary} name="Summary" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Reference reference={value.assessment} name="Assessment" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ConditionStage;
