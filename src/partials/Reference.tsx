import { useMemo } from 'react';
import { Typography, Link, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExtension } from '../types/partials/Extension';
import { IdentifierSystem } from '../utils/identifierSystem';
import { TReference } from '../types/partials/Reference';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

type TReferenceProps = TBaseResourceProps & {
    reference: any;
    field?: string;
};

function Reference({ reference: references = [], name, field }: TReferenceProps) {
    const uuidReferences = useMemo(() => {
        const referenceArray = Array.isArray(references) ? references : [references];

        return referenceArray
            .map((reference: any) => {
                let uuidReference: string | undefined;
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
            .filter((u: TReference) => u.reference);
    }, [references, field]);

    return uuidReferences && uuidReferences.length > 0 && uuidReferences[0] ? (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
            {uuidReferences.map((reference: TReference, index: Number) =>
                reference ? (
                    <Link
                        href={`/4_0_0/${reference.reference}`}
                        key={`${index}`}
                        rel="noopener noreferrer"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline',
                            },
                        }}
                    >
                        <Typography>{reference.display || reference.reference}</Typography>

                        <OpenInNewIcon />
                    </Link>
                ) : null
            )}
        </Box>
    ) : null;
}

export default Reference;
