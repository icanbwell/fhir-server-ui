import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TFamilyMemberHistoryCondition } from '../types/partials/FamilyMemberHistoryCondition';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Range from './Range';
import Period from './Period';
import Annotation from './Annotation';

type TFamilyMemberHistoryConditionProps = TBaseResourceProps & {
  field?: string;
  condition: TFamilyMemberHistoryCondition | TFamilyMemberHistoryCondition[] | undefined;
};

const FamilyMemberHistoryCondition = ({ condition, name, resourceType }: TFamilyMemberHistoryConditionProps) => {
  if (!condition) {
    return null;
  }
  const values = Array.isArray(condition) ? condition : [condition];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.outcome} name="Outcome" resourceType={resourceType} />
          {value.contributedToDeath !== undefined && value.contributedToDeath !== null && (
            <Typography component="div"><b>Contributed To Death:</b>&nbsp;{value.contributedToDeath ? 'True' : 'False'}</Typography>
          )}
          <Quantity quantity={value.onsetAge} name="Onset Age" resourceType={resourceType} />
          <Range range={value.onsetRange} name="Onset Range" resourceType={resourceType} />
          <Period period={value.onsetPeriod} name="Onset Period" resourceType={resourceType} />
          {value.onsetString && <Typography component="div"><b>Onset:</b>&nbsp;{`${value.onsetString}`}</Typography>}
          <Annotation annotation={value.note} name="Note" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default FamilyMemberHistoryCondition;
