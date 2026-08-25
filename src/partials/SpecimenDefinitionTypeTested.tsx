import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSpecimenDefinitionTypeTested } from '../types/partials/SpecimenDefinitionTypeTested';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';

type TSpecimenDefinitionTypeTestedProps = TBaseResourceProps & {
  field?: string;
  typeTested: TSpecimenDefinitionTypeTested | TSpecimenDefinitionTypeTested[] | undefined;
};

const SpecimenDefinitionTypeTestedField = ({ typeTested, name, resourceType }: TSpecimenDefinitionTypeTestedProps) => {
  if (!typeTested) {
    return null;
  }
  const values = Array.isArray(typeTested) ? typeTested : [typeTested];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.isDerived !== undefined && <Typography component="div"><b>Is Derived:</b>&nbsp;{String(value.isDerived)}</Typography>}
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          {value.preference && <Typography component="div"><b>Preference:</b>&nbsp;{value.preference}</Typography>}
          {value.requirement && <Typography component="div"><b>Requirement:</b>&nbsp;{value.requirement}</Typography>}
          <Quantity quantity={value.retentionTime} name="Retention Time" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.rejectionCriterion} name="Rejection Criterion" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default SpecimenDefinitionTypeTestedField;
