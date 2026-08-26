import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSpecimenCollection } from '../types/partials/SpecimenCollection';
import Reference from './Reference';
import DateTime from './DateTime';
import Period from './Period';
import Quantity from './Quantity';
import CodeableConcept from './CodeableConcept';

type TSpecimenCollectionProps = TBaseResourceProps & {
  field?: string;
  collection: TSpecimenCollection | TSpecimenCollection[] | undefined;
};

const SpecimenCollectionField = ({ collection, name, resourceType }: TSpecimenCollectionProps) => {
  if (!collection) {
    return null;
  }
  const values = Array.isArray(collection) ? collection : [collection];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Reference reference={value.collector} name="Collector" resourceType={resourceType} />
          <DateTime dateTime={value.collectedDateTime} name="Collected Date Time" resourceType={resourceType} />
          <Period period={value.collectedPeriod} name="Collected Period" resourceType={resourceType} />
          <Quantity quantity={value.duration} name="Duration" resourceType={resourceType} />
          <Quantity quantity={value.quantity} name="Quantity" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.method} name="Method" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.bodySite} name="Body Site" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.fastingStatusCodeableConcept} name="Fasting Status" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default SpecimenCollectionField;
