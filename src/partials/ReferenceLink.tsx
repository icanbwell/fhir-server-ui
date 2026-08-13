import { Typography, Link, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useResourceCount } from '../hooks/useResourceCount';

type TReferenceLinkProps = {
    reference: string;
    display?: string;
};

function ReferenceLink({ reference, display }: TReferenceLinkProps) {
    const [resourceType, id] = reference.split('/');
    // `id=<value>` (not the FHIR-standard `_id`) is this server's documented filter for
    // searching by resource id — see fhir-server's cheatsheet.md, "By ids or list of ids".
    const { count, isLoading, error } = useResourceCount({
        resourceType,
        queryParameters: id ? [`id=${id}`] : undefined,
        limit: 1,
    });

    return (
        <Link
            href={`/4_0_0/${reference}`}
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
            <Typography>{display || reference}</Typography>
            {isLoading && <CircularProgress size={14} aria-label="Loading count" />}
            {!isLoading && !error && count !== null && (
                count > 0 ? (
                    <CheckCircleIcon color="success" fontSize="small" titleAccess="Resource exists" />
                ) : (
                    <CancelIcon color="error" fontSize="small" titleAccess="Resource not found" />
                )
            )}
            <OpenInNewIcon />
        </Link>
    );
}

export default ReferenceLink;
