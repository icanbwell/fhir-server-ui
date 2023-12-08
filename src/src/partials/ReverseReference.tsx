import { Typography, Link, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';

type TReverseReference = {
  target: string;
  property: string;
};

type TReverseReferenceProps = TBaseResourceProps & {
  reverseReferences: TReverseReference[];
};

function ReverseReference({ name, id, reverseReferences, resourceType }: TReverseReferenceProps) {
  if (resourceType === 'Patient') {
    id = `Patient/${id}`;
  }
  if (resourceType === 'Person') {
    id = `Patient/person.${id}`;
  }

  return reverseReferences &&
    reverseReferences.length > 0 &&
    reverseReferences[0] ? (
    <Box sx={{ mt: 1, bt: 1 }}>
      <Typography variant="h5">{name}</Typography>
      {reverseReferences.map((reference: any, index: Number) =>
        reference ? (
          <Link
            key={`${index}`}
            href={`/4_0_0/${reference.target}?${reference.property}=${id}`}
          >
            {`/4_0_0/${reference.target}?${reference.property}=${id}`}
          </Link>
        ) : null,
      )}
    </Box>
  ) : null;
}

export default ReverseReference;
