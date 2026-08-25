import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TBiologicallyDerivedProductCollection } from '../types/partials/BiologicallyDerivedProductCollection';
import Reference from './Reference';
import DateTime from './DateTime';
import Period from './Period';

type TBiologicallyDerivedProductCollectionProps = TBaseResourceProps & {
  field?: string;
  collection: TBiologicallyDerivedProductCollection | TBiologicallyDerivedProductCollection[] | undefined;
};

const BiologicallyDerivedProductCollection = ({ collection, name, resourceType }: TBiologicallyDerivedProductCollectionProps) => {
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
          <Reference reference={value.source} name="Source" resourceType={resourceType} />
          <DateTime dateTime={value.collectedDateTime} name="Collected" resourceType={resourceType} />
          <Period period={value.collectedPeriod} name="Collected Period" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default BiologicallyDerivedProductCollection;
