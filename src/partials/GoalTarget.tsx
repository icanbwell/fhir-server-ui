import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TGoalTarget } from '../types/partials/GoalTarget';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Range from './Range';
import Ratio from './Ratio';

type TGoalTargetProps = TBaseResourceProps & {
  field?: string;
  target: TGoalTarget | TGoalTarget[] | undefined;
};

const GoalTarget = ({ target, name, resourceType }: TGoalTargetProps) => {
  if (!target) {
    return null;
  }
  const values = Array.isArray(target) ? target : [target];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.measure} name="Measure" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.detailCodeableConcept} name="Detail" resourceType={resourceType} />
          <Quantity quantity={value.detailQuantity} name="Detail Quantity" resourceType={resourceType} />
          <Range range={value.detailRange} name="Detail Range" resourceType={resourceType} />
          <Ratio ratio={value.detailRatio} name="Detail Ratio" resourceType={resourceType} />
          {value.detailString && <Typography component="div"><b>Detail:</b>&nbsp;{`${value.detailString}`}</Typography>}
          {value.detailBoolean !== undefined && value.detailBoolean !== null && (
            <Typography component="div"><b>Detail:</b>&nbsp;{value.detailBoolean ? 'True' : 'False'}</Typography>
          )}
          {value.detailInteger !== undefined && value.detailInteger !== null && (
            <Typography component="div"><b>Detail:</b>&nbsp;{`${value.detailInteger}`}</Typography>
          )}
          {value.dueDate && <Typography component="div"><b>Due Date:</b>&nbsp;{`${value.dueDate}`}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default GoalTarget;
