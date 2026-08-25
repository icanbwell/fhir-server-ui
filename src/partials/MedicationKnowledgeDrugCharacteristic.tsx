import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicationKnowledgeDrugCharacteristic } from '../types/partials/MedicationKnowledgeDrugCharacteristic';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';

type TMedicationKnowledgeDrugCharacteristicProps = TBaseResourceProps & {
  field?: string;
  drugCharacteristic: TMedicationKnowledgeDrugCharacteristic | TMedicationKnowledgeDrugCharacteristic[] | undefined;
};

const MedicationKnowledgeDrugCharacteristicField = ({
  drugCharacteristic,
  name,
  resourceType,
}: TMedicationKnowledgeDrugCharacteristicProps) => {
  if (!drugCharacteristic) {
    return null;
  }
  const values = Array.isArray(drugCharacteristic) ? drugCharacteristic : [drugCharacteristic];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.valueCodeableConcept} name="Value" resourceType={resourceType} />
          {value.valueString && <Typography component="div"><b>Value:</b>&nbsp;{value.valueString}</Typography>}
          <Quantity quantity={value.valueQuantity} name="Value Quantity" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MedicationKnowledgeDrugCharacteristicField;
