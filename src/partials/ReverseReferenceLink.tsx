import { Typography, Link, Chip, CircularProgress } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useResourceCount } from '../hooks/useResourceCount';

type TReverseReferenceLinkProps = {
    target: string;
    property: string;
    resolvedId: string;
};

function ReverseReferenceLink({ target, property, resolvedId }: TReverseReferenceLinkProps) {
    const href = `/4_0_0/${target}?${property}=${resolvedId}`;

    // AuditEvent's rolling 7-day window is applied uniformly by
    // FhirApi.addMissingRequiredParams for both the href's click-through (via
    // IndexPage -> getBundleAsync) and the count-fetch below, so there is
    // nothing target-specific left to do here.
    const { count, atLimit, isLoading, error } = useResourceCount({
        resourceType: target,
        queryParameters: [`${property}=${resolvedId}`],
        limit: 10,
    });

    return (
        <Link
            href={href}
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
            <Typography>{target}</Typography>
            {isLoading && <CircularProgress size={14} aria-label="Loading count" />}
            {!isLoading && !error && count !== null && (
                <Chip label={atLimit ? '10+' : `(${count})`} size="small" variant="outlined" color="primary" />
            )}
            <OpenInNewIcon />
        </Link>
    );
}

export default ReverseReferenceLink;
