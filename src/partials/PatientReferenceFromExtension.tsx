import { Box, Typography } from '@mui/material';
import { Link } from 'react-router';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { TExtension } from '../types/partials/Extension';

type TPatientReferenceFromExtensionProps = {
    extension: TExtension[] | undefined;
};

// b.well-specific: Subscription and SubscriptionStatus resources carry the owning patient's
// client-scoped Person id as a top-level extension (id: 'client_person_id') rather than a
// structural subject/patient field — FHIR R4 Subscription has no such field. The
// `Patient/person.<id>` shape matches what ReverseReference.tsx already builds for
// Person-sourced ids, and was confirmed against a real Subscription search URL
// (`/4_0_0/Subscription?patient=Patient/person.<clientPersonId>`).
const CLIENT_PERSON_ID_EXTENSION_ID = 'client_person_id';

const PatientReferenceFromExtension = ({ extension }: TPatientReferenceFromExtensionProps) => {
    const clientPersonId = extension?.find((e) => e?.id === CLIENT_PERSON_ID_EXTENSION_ID)?.valueString;
    if (!clientPersonId) {
        return null;
    }
    const to = `/4_0_0/Patient/person.${clientPersonId}`;
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Patient
            </Typography>
            <Link title="Direct link to Patient" to={to}>
                <Typography component="span">{to}</Typography>{' '}
                <OpenInNewIcon fontSize="inherit" />
            </Link>
        </Box>
    );
};

export default PatientReferenceFromExtension;
