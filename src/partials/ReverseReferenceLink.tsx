import { Typography, Link, CircularProgress } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useResourceCount } from '../hooks/useResourceCount';
import { resourceLinkSx } from './resourceLinkSx';

type TReverseReferenceLinkProps = {
    target: string;
    property: string;
    resolvedId: string;
    // Scopes the search to one patient, e.g. `Patient/123`. DocumentReference?encounter=<id> on its own timed out
    // on staging (HTTP 500 after about 60 seconds) and answers in seconds with patient= added, so an Encounter page
    // passes its subject here. Only a Patient reference scopes the search: Encounter.subject may be a Group, and
    // patient= matches Patient subjects only, so patient=Group/<id> would find nothing.
    patientReference?: string;
};

function ReverseReferenceLink({ target, property, resolvedId, patientReference }: TReverseReferenceLinkProps) {
    const queryParameters = [`${property}=${resolvedId}`];
    if (patientReference?.startsWith('Patient/')) {
        queryParameters.push(`patient=${patientReference}`);
    }
    const href = `/4_0_0/${target}?${queryParameters.join('&')}`;

    // AuditEvent queries are slow on this FHIR server, so this link is excluded from
    // counting entirely (queryParameters: undefined short-circuits useResourceCount's
    // effect before it fetches anything) — it still renders as a plain link, with no badge.
    const { count, atLimit, isLoading, error } = useResourceCount({
        resourceType: target,
        queryParameters: target === 'AuditEvent' ? undefined : queryParameters,
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
