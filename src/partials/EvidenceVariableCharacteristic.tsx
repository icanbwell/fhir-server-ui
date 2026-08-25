import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEvidenceVariableCharacteristic } from '../types/partials/EvidenceVariableCharacteristic';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TEvidenceVariableCharacteristicProps = TBaseResourceProps & {
  field?: string;
  characteristic: TEvidenceVariableCharacteristic | TEvidenceVariableCharacteristic[] | undefined;
};

const EvidenceVariableCharacteristic = ({ characteristic, name, resourceType }: TEvidenceVariableCharacteristicProps) => {
  if (!characteristic) {
    return null;
  }
  const values = Array.isArray(characteristic) ? characteristic : [characteristic];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          <CodeableConcept codeableConcept={value.definitionCodeableConcept} name="Definition" resourceType={resourceType} />
          <Reference reference={value.definitionReference} name="Definition Reference" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.method} name="Method" resourceType={resourceType} />
          <Reference reference={value.device} name="Device" resourceType={resourceType} />
          {value.exclude !== undefined && (
            <Typography component="div"><b>Exclude:</b>&nbsp;{value.exclude ? 'True' : 'False'}</Typography>
          )}
          {value.groupMeasure && <Typography component="div"><b>Group Measure:</b>&nbsp;{value.groupMeasure}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default EvidenceVariableCharacteristic;
