import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDataRequirement } from '../types/partials/DataRequirement';
import CodeableConcept from './CodeableConcept';

type TDataRequirementProps = TBaseResourceProps & {
  dataRequirement: TDataRequirement | TDataRequirement[] | undefined;
};

const DataRequirementField = ({ dataRequirement, name, resourceType }: TDataRequirementProps) => {
  if (!dataRequirement) {
    return null;
  }
  const values = Array.isArray(dataRequirement) ? dataRequirement : [dataRequirement];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>
          {value.profile && value.profile.length > 0 && (
            <Typography component="div"><b>Profile:</b>&nbsp;{value.profile.join(', ')}</Typography>
          )}
          <CodeableConcept
            codeableConcept={value.subjectCodeableConcept}
            name="Subject"
            resourceType={resourceType}
          />
          {value.mustSupport && value.mustSupport.length > 0 && (
            <Typography component="div"><b>Must Support:</b>&nbsp;{value.mustSupport.join(', ')}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default DataRequirementField;
