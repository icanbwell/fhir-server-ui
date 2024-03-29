import { useEffect, useState } from 'react';
import { Typography, Link, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExtension } from '../types/partials/Extension';
import { IdentifierSystem } from '../utils/identifierSystem';
import { TReference } from '../types/partials/Reference';

type TReferenceProps = TBaseResourceProps & {
  reference: any;
  field?: string;
};

function Reference({ reference: references = [], name, field }: TReferenceProps) {
  // Ensure that references is an array
  if (!Array.isArray(references)) {
    references = [references];
  }

  const [uuidReferences, setUuidReferences] = useState<TReference[]>(
    []
  );

  useEffect(() => {
    setUuidReferences(
      references
        .map((reference: any) => {
          let uuidReference: string | null = null;
          if (field) {
            uuidReference = reference[`${field}`]?.extension?.find(
              (e: TExtension) => e.url === IdentifierSystem.uuid
            )?.valueString;
          } else {
            uuidReference = reference?.extension?.find(
              (e: TExtension) => e.url === IdentifierSystem.uuid
            )?.valueString;
          }
          return { reference: uuidReference, display: reference.display };
        })
        .filter((u: TReference) => u.reference)
    );
  }, [references]);

  return uuidReferences && uuidReferences.length > 0 && uuidReferences[0] ? (
    <Box>
      <Typography variant="h4">{name}</Typography>
      {uuidReferences.map((reference: TReference, index: Number) =>
        reference ? (
          <Link
            href={`/4_0_0/${reference.reference}`}
            key={`${index}`}
            display='block'
            mb={index !== references.length - 1 ? 1 : 0}
          >
            {reference.display || reference.reference}
          </Link>
        ) : null
      )}
    </Box>
  ) : null;
}

export default Reference;
