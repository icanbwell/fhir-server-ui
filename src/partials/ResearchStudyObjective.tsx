import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TResearchStudyObjective } from '../types/partials/ResearchStudyObjective';
import CodeableConcept from './CodeableConcept';

type TResearchStudyObjectiveProps = TBaseResourceProps & {
  field?: string;
  objective: TResearchStudyObjective | TResearchStudyObjective[] | undefined;
};

const ResearchStudyObjectiveField = ({ objective, name, resourceType }: TResearchStudyObjectiveProps) => {
  if (!objective) {
    return null;
  }
  const values = Array.isArray(objective) ? objective : [objective];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ResearchStudyObjectiveField;
