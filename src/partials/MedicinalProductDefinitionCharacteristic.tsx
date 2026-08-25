import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicinalProductDefinitionCharacteristic } from '../types/partials/MedicinalProductDefinitionCharacteristic';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Date from './Date';
import Boolean from './Boolean';
import Attachment from './Attachment';

type TMedicinalProductDefinitionCharacteristicProps = TBaseResourceProps & {
  field?: string;
  characteristic: TMedicinalProductDefinitionCharacteristic | TMedicinalProductDefinitionCharacteristic[] | undefined;
};

const MedicinalProductDefinitionCharacteristicField = ({
  characteristic,
  name,
  resourceType,
}: TMedicinalProductDefinitionCharacteristicProps) => {
  if (!characteristic) {
    return null;
  }
  const values = Array.isArray(characteristic) ? characteristic : [characteristic];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.valueCodeableConcept} name="Value" resourceType={resourceType} />
          <Quantity quantity={value.valueQuantity} name="Value Quantity" resourceType={resourceType} />
          <Date date={value.valueDate} name="Value Date" resourceType={resourceType} />
          <Boolean boolean={value.valueBoolean} name="Value Boolean" resourceType={resourceType} />
          <Attachment attachment={value.valueAttachment} name="Value Attachment" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MedicinalProductDefinitionCharacteristicField;
