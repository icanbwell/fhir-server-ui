import { Link, Tooltip } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router';

type TDocumentViewerLinkProps = {
    resourceType: 'DocumentReference' | 'Binary';
    id: String | undefined;
    // Selects a specific content[] entry (DocumentReference only) — see DocumentViewerPage's
    // path-segment convention. Omitted entirely for Binary, which has no content[] array.
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
