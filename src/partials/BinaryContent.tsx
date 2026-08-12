import { Box, Link, Tooltip, Typography } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router';

type TBinaryContentProps = {
    contentType: String | undefined;
    id: String | undefined;
};

const BinaryContent = ({ contentType, id }: TBinaryContentProps) => {
    if (!id) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                Content
            </Typography>
            <Typography sx={{ mb: 1 }}>{contentType ? String(contentType) : 'Unknown content type'}</Typography>
            <Tooltip title="View in Document Viewer">
                <Link
                    component={RouterLink}
                    to={`/document-viewer/4_0_0/Binary/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: 'fit-content' }}
                >
                    <DescriptionIcon fontSize="small" /> View <OpenInNewIcon fontSize="small" />
                </Link>
            </Tooltip>
        </Box>
    );
};

export default BinaryContent;
