import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSupplyRequestParameter } from '../types/partials/SupplyRequestParameter';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Range from './Range';

type TSupplyRequestParameterProps = TBaseResourceProps & {
  field?: string;
  parameter: TSupplyRequestParameter | TSupplyRequestParameter[] | undefined;
};

const SupplyRequestParameterField = ({ parameter, name, resourceType }: TSupplyRequestParameterProps) => {
  if (!parameter) {
    return null;
  }
  const values = Array.isArray(parameter) ? parameter : [parameter];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.valueCodeableConcept} name="Value" resourceType={resourceType} />
          <Quantity quantity={value.valueQuantity} name="Value Quantity" resourceType={resourceType} />
          <Range range={value.valueRange} name="Value Range" resourceType={resourceType} />
          {value.valueBoolean !== undefined && <Typography component="div"><b>Value Boolean:</b>&nbsp;{String(value.valueBoolean)}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default SupplyRequestParameterField;
