import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TResearchStudyArm } from '../types/partials/ResearchStudyArm';
import CodeableConcept from './CodeableConcept';

type TResearchStudyArmProps = TBaseResourceProps & {
  field?: string;
  arm: TResearchStudyArm | TResearchStudyArm[] | undefined;
};

const ResearchStudyArmField = ({ arm, name, resourceType }: TResearchStudyArmProps) => {
  if (!arm) {
    return null;
  }
  const values = Array.isArray(arm) ? arm : [arm];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default ResearchStudyArmField;
