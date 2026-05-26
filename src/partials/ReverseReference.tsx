import { Typography, Link, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

type TReverseReference = {
    target: string;
    property: string;
};

type TReverseReferenceProps = TBaseResourceProps & {
    reverseReferences: TReverseReference[];
};

function ReverseReference({ id, reverseReferences, resourceType }: TReverseReferenceProps) {
    let resolvedId = id;
    if (resourceType === 'Patient') {
        resolvedId = `Patient/${id}`;
    }
    if (resourceType === 'Person') {
        resolvedId = `Patient/person.${id}`;
    }

    const getReference = (reference: any) => {
        if (reference.target === 'AuditEvent') {
            const currDate = new Date().toISOString().split('T')[0];
            const dateBeforeWeek = new Date();
            dateBeforeWeek.setDate(dateBeforeWeek.getDate() - 7);
            return `/4_0_0/${reference.target}?${reference.property}=${resolvedId}&date=lt.${currDate}&date=gt.${dateBeforeWeek.toISOString().split('T')[0]}`;
        }
        return `/4_0_0/${reference.target}?${reference.property}=${resolvedId}`;
    };

    const getLabel = (reference: any) => {
        return `${reference.target}`;
    };

    return reverseReferences && reverseReferences.length > 0 && reverseReferences[0] ? (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {reverseReferences.map((reference: any, index: number) =>
                    reference ? (
                        <Link
                            key={`${index}`}
                            href={getReference(reference)}
                            target="_blank"
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
                            <Typography>{getLabel(reference)}</Typography>
                            <OpenInNewIcon />
                        </Link>
                    ) : null
                )}
            </Box>
        </Box>
    ) : null;
}

export default ReverseReference;
