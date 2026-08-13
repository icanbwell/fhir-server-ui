import { Typography, Link, CircularProgress } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useResourceCount } from '../hooks/useResourceCount';
import { resourceLinkSx } from './resourceLinkSx';

type TReverseReferenceLinkProps = {
    target: string;
    property: string;
    resolvedId: string;
};

function ReverseReferenceLink({ target, property, resolvedId }: TReverseReferenceLinkProps) {
    const href = `/4_0_0/${target}?${property}=${resolvedId}`;

    // AuditEvent queries are slow on this FHIR server, so this link is excluded from
    // counting entirely (queryParameters: undefined short-circuits useResourceCount's
    // effect before it fetches anything) — it still renders as a plain link, with no badge.
    const { count, atLimit, isLoading, error } = useResourceCount({
        resourceType: target,
        queryParameters: target === 'AuditEvent' ? undefined : [`${property}=${resolvedId}`],
        limit: 10,
    });

    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            sx={resourceLinkSx}
        >
            <Typography>{target}</Typography>
            {isLoading && <CircularProgress size={14} aria-label="Loading count" />}
            {!isLoading && !error && count !== null && (
                <Typography color="primary" sx={{ textDecoration: 'none' }}>
                    {atLimit ? '(10+)' : `(${count})`}
                </Typography>
            )}
            <OpenInNewIcon />
        </Link>
    );
}

export default ReverseReferenceLink;
