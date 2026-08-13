import { Box, Typography } from '@mui/material';
import DocumentViewerLink from './DocumentViewerLink';

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
            <DocumentViewerLink resourceType="Binary" id={id} sx={{ width: 'fit-content' }} />
        </Box>
    );
};

export default BinaryContent;
