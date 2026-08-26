import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TImmunizationProtocolApplied } from '../types/partials/ImmunizationProtocolApplied';
import Reference from './Reference';
import CodeableConcept from './CodeableConcept';

type TImmunizationProtocolAppliedProps = TBaseResourceProps & {
  field?: string;
  protocolApplied: TImmunizationProtocolApplied | TImmunizationProtocolApplied[] | undefined;
};

const ImmunizationProtocolAppliedField = ({ protocolApplied, name, resourceType }: TImmunizationProtocolAppliedProps) => {
  if (!protocolApplied) {
    return null;
  }
  const values = Array.isArray(protocolApplied) ? protocolApplied : [protocolApplied];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.series && <Typography component="div"><b>Series:</b>&nbsp;{value.series}</Typography>}
          <Reference reference={value.authority} name="Authority" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.targetDisease} name="Target Disease" resourceType={resourceType} />
          {(value.doseNumberPositiveInt !== undefined || value.doseNumberString) && (
            <Typography component="div">
              <b>Dose Number:</b>&nbsp;{value.doseNumberPositiveInt !== undefined ? `${value.doseNumberPositiveInt}` : value.doseNumberString}
            </Typography>
          )}
          {(value.seriesDosesPositiveInt !== undefined || value.seriesDosesString) && (
            <Typography component="div">
              <b>Series Doses:</b>&nbsp;{value.seriesDosesPositiveInt !== undefined ? `${value.seriesDosesPositiveInt}` : value.seriesDosesString}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ImmunizationProtocolAppliedField;
