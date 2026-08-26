import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TGroupCharacteristic } from '../types/partials/GroupCharacteristic';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Range from './Range';
import Reference from './Reference';
import Period from './Period';

type TGroupCharacteristicProps = TBaseResourceProps & {
  field?: string;
  characteristic: TGroupCharacteristic | TGroupCharacteristic[] | undefined;
};

const GroupCharacteristic = ({ characteristic, name, resourceType }: TGroupCharacteristicProps) => {
  if (!characteristic) {
    return null;
  }
  const values = Array.isArray(characteristic) ? characteristic : [characteristic];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.valueCodeableConcept} name="Value" resourceType={resourceType} />
          {value.valueBoolean !== undefined && value.valueBoolean !== null && (
            <Typography component="div"><b>Value:</b>&nbsp;{value.valueBoolean ? 'True' : 'False'}</Typography>
          )}
          <Quantity quantity={value.valueQuantity} name="Value Quantity" resourceType={resourceType} />
          <Range range={value.valueRange} name="Value Range" resourceType={resourceType} />
          <Reference reference={value.valueReference} name="Value Reference" resourceType={resourceType} />
          {value.exclude !== undefined && value.exclude !== null && (
            <Typography component="div"><b>Exclude:</b>&nbsp;{value.exclude ? 'True' : 'False'}</Typography>
          )}
          <Period period={value.period} name="Period" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default GroupCharacteristic;
