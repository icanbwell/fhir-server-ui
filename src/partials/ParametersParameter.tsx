import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TParametersParameter } from '../types/partials/ParametersParameter';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Reference from './Reference';
import Identifier from './Identifier';
import Period from './Period';

type TParametersParameterProps = TBaseResourceProps & {
  field?: string;
  parameter: TParametersParameter | TParametersParameter[] | undefined;
};

const ParametersParameterField = ({ parameter, name, resourceType }: TParametersParameterProps) => {
  if (!parameter) {
    return null;
  }
  const values = Array.isArray(parameter) ? parameter : [parameter];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Name:</b>&nbsp;{`${value.name}`}</Typography>
          {(value.valueString || value.valueCode) && (
            <Typography component="div"><b>Value:</b>&nbsp;{`${value.valueString || value.valueCode}`}</Typography>
          )}
          {value.valueBoolean !== undefined && (
            <Typography component="div"><b>Value:</b>&nbsp;{value.valueBoolean ? 'True' : 'False'}</Typography>
          )}
          {value.valueInteger !== undefined && (
            <Typography component="div"><b>Value:</b>&nbsp;{`${value.valueInteger}`}</Typography>
          )}
          {(value.valueDate || value.valueDateTime) && (
            <Typography component="div"><b>Value Date:</b>&nbsp;{`${value.valueDate || value.valueDateTime}`}</Typography>
          )}
          <CodeableConcept codeableConcept={value.valueCodeableConcept} name="Value" resourceType={resourceType} />
          <Quantity quantity={value.valueQuantity} name="Value" resourceType={resourceType} />
          <Reference reference={value.valueReference} name="Value Reference" resourceType={resourceType} />
          <Identifier identifier={value.valueIdentifier} name="Value Identifier" resourceType={resourceType} />
          <Period period={value.valuePeriod} name="Value Period" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ParametersParameterField;
