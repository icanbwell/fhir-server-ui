import { Typography, Link, Chip, CircularProgress } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useResourceCount } from '../hooks/useResourceCount';

type TReverseReferenceLinkProps = {
    target: string;
    property: string;
    resolvedId: string;
};

function ReverseReferenceLink({ target, property, resolvedId }: TReverseReferenceLinkProps) {
    const href = (() => {
        if (target === 'AuditEvent') {
            const currDate = new Date().toISOString().split('T')[0];
            const dateBeforeWeek = new Date();
            dateBeforeWeek.setDate(dateBeforeWeek.getDate() - 7);
            return `/4_0_0/${target}?${property}=${resolvedId}&date=lt.${currDate}&date=gt.${dateBeforeWeek.toISOString().split('T')[0]}`;
        }
        return `/4_0_0/${target}?${property}=${resolvedId}`;
    })();

    // AuditEvent's date bounds don't need to be repeated here: FhirApi.getUrl() ->
    // addMissingRequiredParams() already appends the same rolling 7-day window
    // (src/utils/auditEventDateFilter.ts) automatically for AuditEvent searches.
    const { count, isLoading, error } = useResourceCount({
        resourceType: target,
        queryParameters: [`${property}=${resolvedId}`],
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
            {isLoading && <CircularProgress size={14} />}
            {!isLoading && !error && count !== null && (
                <Chip label={`(${count})`} size="small" />
            )}
            <OpenInNewIcon />
        </Link>
    );
}

export default ReverseReferenceLink;
