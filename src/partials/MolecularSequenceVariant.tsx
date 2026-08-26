import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMolecularSequenceVariant } from '../types/partials/MolecularSequenceVariant';
import Reference from './Reference';

type TMolecularSequenceVariantProps = TBaseResourceProps & {
  field?: string;
  variant: TMolecularSequenceVariant | TMolecularSequenceVariant[] | undefined;
};

const MolecularSequenceVariantField = ({ variant, name, resourceType }: TMolecularSequenceVariantProps) => {
  if (!variant) {
    return null;
  }
  const values = Array.isArray(variant) ? variant : [variant];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.start !== undefined && (
            <Typography component="div"><b>Start:</b>&nbsp;{`${value.start}`}</Typography>
          )}
          {value.end !== undefined && (
            <Typography component="div"><b>End:</b>&nbsp;{`${value.end}`}</Typography>
          )}
          {value.observedAllele && (
            <Typography component="div"><b>Observed Allele:</b>&nbsp;{`${value.observedAllele}`}</Typography>
          )}
          {value.referenceAllele && (
            <Typography component="div"><b>Reference Allele:</b>&nbsp;{`${value.referenceAllele}`}</Typography>
          )}
          {value.cigar && (
            <Typography component="div"><b>Cigar:</b>&nbsp;{`${value.cigar}`}</Typography>
          )}
          <Reference reference={value.variantPointer} name="Variant Pointer" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MolecularSequenceVariantField;
