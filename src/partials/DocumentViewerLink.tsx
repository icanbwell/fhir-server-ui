import { Link, Tooltip } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router';

// Every FHIR resource type the Document Viewer (DocumentViewer.tsx) knows how to render —
// either the resource itself (Binary) or a field on it that carries Attachment(s) (all others;
// see ATTACHMENT_FIELD_BY_RESOURCE_TYPE in DocumentViewer.tsx for which field on each).
export type TDocumentViewerResourceType =
    | 'DocumentReference'
    | 'Binary'
    | 'DiagnosticReport'
    | 'Media'
    | 'Patient'
    | 'Practitioner'
    | 'RelatedPerson'
    | 'Consent'
    | 'Contract';

type TDocumentViewerLinkProps = {
    resourceType: TDocumentViewerResourceType;
    id: String | undefined;
    // Selects a specific attachment entry for resource types whose attachment field is an
    // array (DocumentReference.content, DiagnosticReport.presentedForm, Patient/Practitioner/
    // RelatedPerson.photo) — see DocumentViewerPage's path-segment convention. Omitted entirely
    // for single-attachment fields (Binary, Media.content, Consent.sourceAttachment,
    // Contract.legallyBindingAttachment), which have no array to index into.
    contentIndex?: number;
    sx?: SxProps<Theme>;
};

const DocumentViewerLink = ({ resourceType, id, contentIndex, sx }: TDocumentViewerLinkProps) => {
    if (!id) {
        return null;
    }
    const to = `/document-viewer/4_0_0/${resourceType}/${id}${contentIndex !== undefined ? `/${contentIndex}` : ''}`;
    return (
        <Tooltip title="View in Document Viewer">
            <Link
                component={RouterLink}
                to={to}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ...sx }}
            >
                <DescriptionIcon fontSize="small" /> View <OpenInNewIcon fontSize="small" />
            </Link>
        </Tooltip>
    );
};

export default DocumentViewerLink;
