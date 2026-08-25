import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSpecimenContainer } from '../types/partials/SpecimenContainer';
import Identifier from './Identifier';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Reference from './Reference';

type TSpecimenContainerProps = TBaseResourceProps & {
  field?: string;
  container: TSpecimenContainer | TSpecimenContainer[] | undefined;
};

const SpecimenContainerField = ({ container, name, resourceType }: TSpecimenContainerProps) => {
  if (!container) {
    return null;
  }
  const values = Array.isArray(container) ? container : [container];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Quantity quantity={value.capacity} name="Capacity" resourceType={resourceType} />
          <Quantity quantity={value.specimenQuantity} name="Specimen Quantity" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.additiveCodeableConcept} name="Additive" resourceType={resourceType} />
          <Reference reference={value.additiveReference} name="Additive Reference" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default SpecimenContainerField;
