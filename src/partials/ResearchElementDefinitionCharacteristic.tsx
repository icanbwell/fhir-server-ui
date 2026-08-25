import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TResearchElementDefinitionCharacteristic } from '../types/partials/ResearchElementDefinitionCharacteristic';
import CodeableConcept from './CodeableConcept';

type TResearchElementDefinitionCharacteristicProps = TBaseResourceProps & {
  field?: string;
  characteristic: TResearchElementDefinitionCharacteristic | TResearchElementDefinitionCharacteristic[] | undefined;
};

const ResearchElementDefinitionCharacteristicField = ({
  characteristic,
  name,
  resourceType,
}: TResearchElementDefinitionCharacteristicProps) => {
  if (!characteristic) {
    return null;
  }
  const values = Array.isArray(characteristic) ? characteristic : [characteristic];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.definitionCodeableConcept} name="Definition" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.unitOfMeasure} name="Unit Of Measure" resourceType={resourceType} />
          {value.exclude !== undefined && (
            <Typography component="div"><b>Exclude:</b>&nbsp;{value.exclude ? 'True' : 'False'}</Typography>
          )}
          {value.studyEffectiveDescription && (
            <Typography component="div"><b>Study Effective Description:</b>&nbsp;{value.studyEffectiveDescription}</Typography>
          )}
          {value.participantEffectiveDescription && (
            <Typography component="div"><b>Participant Effective Description:</b>&nbsp;{value.participantEffectiveDescription}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ResearchElementDefinitionCharacteristicField;
