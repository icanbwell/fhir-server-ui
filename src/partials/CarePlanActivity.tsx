import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCarePlanActivity } from '../types/partials/CarePlanActivity';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Annotation from './Annotation';

type TCarePlanActivityProps = TBaseResourceProps & {
  field?: string;
  activity: TCarePlanActivity | TCarePlanActivity[] | undefined;
};

const CarePlanActivity = ({ activity, name, resourceType }: TCarePlanActivityProps) => {
  if (!activity) {
    return null;
  }
  const values = Array.isArray(activity) ? activity : [activity];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.detail?.status && (
            <Typography component="div"><b>Status:</b>&nbsp;{value.detail.status}</Typography>
          )}
          {value.detail?.description && (
            <Typography component="div"><b>Description:</b>&nbsp;{value.detail.description}</Typography>
          )}
          <CodeableConcept codeableConcept={value.detail?.code} name="Code" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.outcomeCodeableConcept} name="Outcome" resourceType={resourceType} />
          <Reference reference={value.outcomeReference} name="Outcome Reference" resourceType={resourceType} />
          <Reference reference={value.reference} name="Reference" resourceType={resourceType} />
          <Annotation annotation={value.progress} name="Progress" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CarePlanActivity;
