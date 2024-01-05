import { Typography, Link, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TReference } from '../types/partials/Reference';

type TReferenceProps = TBaseResourceProps & {
  reference: TReference|TReference[]|undefined;
};

function Reference({ reference: references = [], name }: TReferenceProps) {
  // Ensure that references is an array
  if (!Array.isArray(references)) {
    references = [references];
  }

  return references && references.length > 0 && references[0] ? (
    <Box>
      <Typography variant="h4">{name}</Typography>
      {references.map((reference: TReference, index: Number) =>
        reference ? (
          <Link href={`/4_0_0/${reference.reference}`} key={`${index}`}>
            {reference.display || reference.reference}
          </Link>
        ) : null,
      )}
    </Box>
  ) : null;
}

export default Reference;
