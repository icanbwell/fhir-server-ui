import { Box, Link, Paper, Tooltip, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDocumentReferenceContent } from '../types/partials/DocumentReferenceContent';

type TDocumentContentProps = TBaseResourceProps & {
    content: TDocumentReferenceContent | TDocumentReferenceContent[] | undefined;
    // Always passed as an empty string by the generated DocumentReference.tsx (via partials_mapping_for_fields.py); unused here.
    field?: string;
};

const DocumentContent = ({ content, name, id }: TDocumentContentProps) => {
    const entries = content ? (Array.isArray(content) ? content : [content]) : [];
    if (entries.length === 0) {
        return null;
    }

    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {entries.map((entry, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ flexGrow: 1 }}>
                        {entry.attachment?.title ? String(entry.attachment.title) : `Content ${index + 1}`}
                        {entry.attachment?.contentType ? ` (${entry.attachment.contentType})` : ''}
                    </Typography>
                    <Tooltip title="View in Document Viewer">
                        <Link
                            component={RouterLink}
                            to={`/document-viewer/4_0_0/DocumentReference/${id}/${index}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            <DescriptionIcon fontSize="small" /> View <OpenInNewIcon fontSize="small" />
                        </Link>
                    </Tooltip>
                </Paper>
            ))}
        </Box>
    );
};

export default DocumentContent;
