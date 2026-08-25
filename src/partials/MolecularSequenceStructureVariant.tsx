import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMolecularSequenceStructureVariant } from '../types/partials/MolecularSequenceStructureVariant';
import CodeableConcept from './CodeableConcept';

type TMolecularSequenceStructureVariantProps = TBaseResourceProps & {
  field?: string;
  structureVariant: TMolecularSequenceStructureVariant | TMolecularSequenceStructureVariant[] | undefined;
};

const MolecularSequenceStructureVariantField = ({
  structureVariant,
  name,
  resourceType,
}: TMolecularSequenceStructureVariantProps) => {
  if (!structureVariant) {
    return null;
  }
  const values = Array.isArray(structureVariant) ? structureVariant : [structureVariant];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.variantType} name="Variant Type" resourceType={resourceType} />
          {value.exact !== undefined && (
            <Typography component="div"><b>Exact:</b>&nbsp;{value.exact ? 'True' : 'False'}</Typography>
          )}
          {value.length !== undefined && (
            <Typography component="div"><b>Length:</b>&nbsp;{`${value.length}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MolecularSequenceStructureVariantField;
