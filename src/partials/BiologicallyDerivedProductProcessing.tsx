import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TBiologicallyDerivedProductProcessing } from '../types/partials/BiologicallyDerivedProductProcessing';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import DateTime from './DateTime';
import Period from './Period';

type TBiologicallyDerivedProductProcessingProps = TBaseResourceProps & {
  field?: string;
  processing: TBiologicallyDerivedProductProcessing | TBiologicallyDerivedProductProcessing[] | undefined;
};

const BiologicallyDerivedProductProcessing = ({ processing, name, resourceType }: TBiologicallyDerivedProductProcessingProps) => {
  if (!processing) {
    return null;
  }
  const values = Array.isArray(processing) ? processing : [processing];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          <CodeableConcept codeableConcept={value.procedure} name="Procedure" resourceType={resourceType} />
          <Reference reference={value.additive} name="Additive" resourceType={resourceType} />
          <DateTime dateTime={value.timeDateTime} name="Time" resourceType={resourceType} />
          <Period period={value.timePeriod} name="Time Period" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default BiologicallyDerivedProductProcessing;
