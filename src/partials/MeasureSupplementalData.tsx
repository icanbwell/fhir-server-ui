import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMeasureSupplementalData } from '../types/partials/MeasureSupplementalData';
import CodeableConcept from './CodeableConcept';

type TMeasureSupplementalDataProps = TBaseResourceProps & {
  field?: string;
  supplementalData: TMeasureSupplementalData | TMeasureSupplementalData[] | undefined;
};

const MeasureSupplementalDataField = ({ supplementalData, name, resourceType }: TMeasureSupplementalDataProps) => {
  if (!supplementalData) {
    return null;
  }
  const values = Array.isArray(supplementalData) ? supplementalData : [supplementalData];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.usage} name="Usage" resourceType={resourceType} />
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          {value.criteria?.expression && (
            <Typography component="div"><b>Criteria:</b>&nbsp;{value.criteria.expression}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MeasureSupplementalDataField;
