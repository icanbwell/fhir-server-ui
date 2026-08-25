import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTaskInput } from '../types/partials/TaskInput';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Period from './Period';
import Quantity from './Quantity';

type TTaskInputProps = TBaseResourceProps & {
  field?: string;
  input: TTaskInput | TTaskInput[] | undefined;
};

const TaskInput = ({ input, name, resourceType }: TTaskInputProps) => {
  if (!input) {
    return null;
  }
  const values = Array.isArray(input) ? input : [input];

  const primitiveValue = (value: TTaskInput) =>
    value.valueString ??
    value.valueBoolean ??
    value.valueCode ??
    value.valueDate ??
    value.valueDateTime ??
    value.valueInteger ??
    value.valueUri ??
    value.valueUrl ??
    value.valueMarkdown;

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.valueCodeableConcept} name="Value" resourceType={resourceType} />
          <Reference reference={value.valueReference} name="Value" resourceType={resourceType} />
          <Period period={value.valuePeriod} name="Value" resourceType={resourceType} />
          <Quantity quantity={value.valueQuantity} name="Value" resourceType={resourceType} />
          {primitiveValue(value) !== undefined && (
            <Typography component="div"><b>Value:</b>&nbsp;{String(primitiveValue(value))}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default TaskInput;
