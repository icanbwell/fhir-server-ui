import { Box, Typography } from '@mui/material';
import Reference from './Reference';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDocumentReferenceRelatesTo } from '../types/partials/DocumentReferenceRelatesTo';

type TDocumentReferenceRelatesToProps = TBaseResourceProps & {
    relatesTo: TDocumentReferenceRelatesTo | TDocumentReferenceRelatesTo[] | undefined;
    resourceType?: String;
    id?: String;
    // Always passed as an empty string by the generated DocumentReference.tsx (via partials_mapping_for_fields.py); unused here.
    field?: string;
};

const DocumentReferenceRelatesToPartial = ({ relatesTo, name, resourceType, id }: TDocumentReferenceRelatesToProps) => {
    const entries = relatesTo ? (Array.isArray(relatesTo) ? relatesTo : [relatesTo]) : [];
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {entries.map((entry, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Relationship: {String(entry.code)}
                    </Typography>
                    <Reference reference={entry} name="Target" field="target" resourceType={resourceType} id={id} searchParameter="relates-to" />
                </Box>
            ))}
        </Box>
    );
};

export default DocumentReferenceRelatesToPartial;
