import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TAdministrableProductDefinitionProperty } from '../types/partials/AdministrableProductDefinitionProperty';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import DateField from './Date';
import BooleanField from './Boolean';
import Attachment from './Attachment';

type TAdministrableProductDefinitionPropertyProps = TBaseResourceProps & {
  field?: string;
  property: TAdministrableProductDefinitionProperty | TAdministrableProductDefinitionProperty[] | undefined;
};

const AdministrableProductDefinitionProperty = ({ property, name, resourceType }: TAdministrableProductDefinitionPropertyProps) => {
  if (!property) {
    return null;
  }
  const values = Array.isArray(property) ? property : [property];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.valueCodeableConcept} name="Value" resourceType={resourceType} />
          <Quantity quantity={value.valueQuantity} name="Value" resourceType={resourceType} />
          <DateField date={value.valueDate} name="Value Date" resourceType={resourceType} />
          <BooleanField boolean={value.valueBoolean} name="Value Boolean" resourceType={resourceType} />
          <Attachment attachment={value.valueAttachment} name="Value Attachment" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.status} name="Status" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default AdministrableProductDefinitionProperty;
