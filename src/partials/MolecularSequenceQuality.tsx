import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMolecularSequenceQuality } from '../types/partials/MolecularSequenceQuality';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';

type TMolecularSequenceQualityProps = TBaseResourceProps & {
  field?: string;
  quality: TMolecularSequenceQuality | TMolecularSequenceQuality[] | undefined;
};

const MolecularSequenceQualityField = ({ quality, name, resourceType }: TMolecularSequenceQualityProps) => {
  if (!quality) {
    return null;
  }
  const values = Array.isArray(quality) ? quality : [quality];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.type && (
            <Typography component="div"><b>Type:</b>&nbsp;{`${value.type}`}</Typography>
          )}
          <CodeableConcept codeableConcept={value.standardSequence} name="Standard Sequence" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.method} name="Method" resourceType={resourceType} />
          <Quantity quantity={value.score} name="Score" resourceType={resourceType} />
          {value.precision !== undefined && (
            <Typography component="div"><b>Precision:</b>&nbsp;{`${value.precision}`}</Typography>
          )}
          {value.recall !== undefined && (
            <Typography component="div"><b>Recall:</b>&nbsp;{`${value.recall}`}</Typography>
          )}
          {value.fScore !== undefined && (
            <Typography component="div"><b>F-Score:</b>&nbsp;{`${value.fScore}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MolecularSequenceQualityField;
