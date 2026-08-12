import { Box, Typography } from '@mui/material';
import Reference from './Reference';
import CodeableConcept from './CodeableConcept';
import Period from './Period';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDocumentReferenceContext } from '../types/partials/DocumentReferenceContext';

type TDocumentReferenceContextProps = TBaseResourceProps & {
    context: TDocumentReferenceContext | undefined;
    // Always passed as an empty string by the generated DocumentReference.tsx (via partials_mapping_for_fields.py); unused here.
    field?: string;
};

const DocumentReferenceContextPartial = ({ context, name, resourceType, id }: TDocumentReferenceContextProps) => {
    if (!context) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {context.encounter && (
                <Reference reference={context.encounter} name="Encounter" resourceType={resourceType} id={id} searchParameter="encounter" />
            )}
            {context.event && <CodeableConcept codeableConcept={context.event} name="Event" resourceType={resourceType} id={id} />}
            {context.period && <Period period={context.period} name="Period" resourceType={resourceType} id={id} />}
            {context.facilityType && (
                <CodeableConcept codeableConcept={context.facilityType} name="Facility Type" resourceType={resourceType} id={id} />
            )}
            {context.practiceSetting && (
                <CodeableConcept codeableConcept={context.practiceSetting} name="Practice Setting" resourceType={resourceType} id={id} />
            )}
            {context.related && (
                <Reference reference={context.related} name="Related" resourceType={resourceType} id={id} searchParameter="related" />
            )}
        </Box>
    );
};

export default DocumentReferenceContextPartial;
